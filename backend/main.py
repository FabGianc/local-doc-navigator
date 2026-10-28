"""
RAG Backend — FastAPI + LangChain + ChromaDB + Ollama
Esecuzione (solo locale): uvicorn main:app --host 127.0.0.1 --port 8000
Uso in LAN: vedi README (CORS_ORIGINS e --host 0.0.0.0)
"""

import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import (
    UnstructuredPDFLoader,
    UnstructuredWordDocumentLoader,
    TextLoader,
)

# ── Config ──────────────────────────────────────────────

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3")
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
# /api/ingest indicizza solo file contenuti in questa cartella
INGEST_ROOT = Path(os.getenv("INGEST_ROOT", "./docs")).resolve()
# Origini web autorizzate a chiamare l'API (separate da virgola)
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080"
    ).split(",")
    if o.strip()
]

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── LangChain components ────────────────────────────────

embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_BASE_URL)
vectorstore = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
llm = ChatOllama(model=CHAT_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.1)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)

# ── FastAPI app ─────────────────────────────────────────

app = FastAPI(title="RAG Search API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Models ──────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class ChatRequest(BaseModel):
    messages: list[dict]
    top_k: int = 5

class IngestRequest(BaseModel):
    file_path: str

# ── Helpers ─────────────────────────────────────────────

LOADERS = {
    ".pdf": UnstructuredPDFLoader,
    ".doc": UnstructuredWordDocumentLoader,
    ".docx": UnstructuredWordDocumentLoader,
    ".txt": TextLoader,
}


def load_and_index(file_path: str) -> int:
    """Load a document, split into chunks, index in ChromaDB. Returns chunk count."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = path.suffix.lower()
    loader_cls = LOADERS.get(ext)
    if not loader_cls:
        raise ValueError(f"Unsupported file type: {ext}")

    loader = loader_cls(str(path))
    documents = loader.load()

    # Attach metadata
    indexed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for doc in documents:
        doc.metadata["file_path"] = str(path.absolute())
        doc.metadata["file_name"] = path.name
        doc.metadata["file_type"] = ext.lstrip(".")
        doc.metadata["indexed_at"] = indexed_at

    chunks = text_splitter.split_documents(documents)

    # Generate deterministic IDs to avoid duplicates
    ids = []
    for i, chunk in enumerate(chunks):
        content_hash = hashlib.md5(chunk.page_content.encode()).hexdigest()[:12]
        ids.append(f"{path.stem}_{content_hash}_{i}")

    vectorstore.add_documents(chunks, ids=ids)
    return len(chunks)


# ── Endpoints ───────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "models": {"embed": EMBED_MODEL, "chat": CHAT_MODEL}}


@app.post("/api/search")
async def search(req: SearchRequest):
    results = vectorstore.similarity_search_with_relevance_scores(req.query, k=req.top_k)
    return {
        "query": req.query,
        "results": [
            {
                "content": doc.page_content,
                "file_path": doc.metadata.get("file_path", ""),
                "page": doc.metadata.get("page_number"),
                "score": round(score, 4),
                "metadata": doc.metadata,
            }
            for doc, score in results
        ],
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    # Get relevant docs
    last_user_msg = next(
        (m["content"] for m in reversed(req.messages) if m["role"] == "user"), ""
    )
    relevant_docs = vectorstore.similarity_search_with_relevance_scores(
        last_user_msg, k=req.top_k
    )

    # Build context
    context_parts = []
    sources = []
    for doc, score in relevant_docs:
        context_parts.append(
            f"[Fonte: {doc.metadata.get('file_path', 'sconosciuto')}]\n{doc.page_content}"
        )
        sources.append({
            "content": doc.page_content,
            "file_path": doc.metadata.get("file_path", ""),
            "page": doc.metadata.get("page_number"),
            "score": round(score, 4),
        })

    context = "\n\n---\n\n".join(context_parts)

    system_prompt = f"""Sei un assistente RAG. Rispondi in italiano basandoti SOLO sui documenti forniti.
Se l'informazione non è presente nei documenti, dillo chiaramente.
Cita sempre il percorso del file da cui proviene l'informazione.

DOCUMENTI:
{context}"""

    messages_for_llm = [{"role": "system", "content": system_prompt}]
    messages_for_llm.extend(req.messages)

    response = llm.invoke(messages_for_llm)

    return {"answer": response.content, "sources": sources}


@app.post("/api/ingest")
async def ingest(req: IngestRequest):
    target = Path(req.file_path).resolve()
    if not target.is_relative_to(INGEST_ROOT):
        raise HTTPException(
            status_code=403,
            detail=f"Percorso non consentito: sono indicizzabili solo i file in {INGEST_ROOT}",
        )
    try:
        count = load_and_index(str(target))
        return {"status": "ok", "chunks": count, "file_path": req.file_path}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and ingest it into the vector store."""
    # Solo il nome del file, senza percorsi: evita scritture fuori da UPLOAD_DIR
    safe_name = Path(file.filename or "").name
    if not safe_name or safe_name in (".", ".."):
        raise HTTPException(400, "Nome file non valido")

    ext = Path(safe_name).suffix.lower()
    if ext not in LOADERS:
        raise HTTPException(400, f"Tipo file non supportato: {ext}. Supportati: {list(LOADERS.keys())}")

    dest = Path(UPLOAD_DIR) / safe_name
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    count = load_and_index(str(dest))
    return {"status": "ok", "file_name": safe_name, "chunks": count}


@app.get("/api/documents")
async def list_documents():
    collection = vectorstore._collection
    all_data = collection.get(include=["metadatas"])

    files: dict[str, dict] = {}
    for meta in all_data["metadatas"]:
        fp = meta.get("file_path", "unknown")
        if fp not in files:
            files[fp] = {
                "file_path": fp,
                "file_name": meta.get("file_name", Path(fp).name),
                "file_type": meta.get("file_type", ""),
                "indexed_at": meta.get("indexed_at", ""),
                "chunks_count": 0,
            }
        files[fp]["chunks_count"] += 1

    return list(files.values())

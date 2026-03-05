# RAG Backend

## Prerequisiti

1. **Ollama** installato e in esecuzione: https://ollama.ai
2. **Python 3.11+**

## Setup

```bash
# 1. Scarica i modelli Ollama
ollama pull llama3
ollama pull nomic-embed-text

# 2. Installa dipendenze Python
cd backend
pip install -r requirements.txt

# 3. Avvia il server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Variabili d'ambiente (opzionali)

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL di Ollama |
| `EMBED_MODEL` | `nomic-embed-text` | Modello per embeddings |
| `CHAT_MODEL` | `llama3` | Modello LLM per la chat |
| `CHROMA_DIR` | `./chroma_db` | Directory database vettoriale |
| `UPLOAD_DIR` | `./uploads` | Directory upload file |

## API Endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/search` | Ricerca semantica |
| POST | `/api/chat` | Chat RAG con contesto |
| POST | `/api/ingest` | Indicizza file da path locale |
| POST | `/api/upload` | Upload + indicizzazione file |
| GET | `/api/documents` | Lista documenti indicizzati |

# Local Doc Navigator

Motore di ricerca **RAG (Retrieval-Augmented Generation) completamente locale** per i propri documenti.
Si caricano PDF, Word o file di testo; il sistema li indicizza e permette di:

- **cercarli per significato** (ricerca semantica, non solo per parole chiave);
- **interrogarli in chat**: le risposte sono generate da un LLM locale basandosi *solo* sui documenti indicizzati, con l'indicazione del file di provenienza.

Nessun dato esce dalla macchina: embedding, database vettoriale e modello linguistico girano in locale tramite [Ollama](https://ollama.com).

## Architettura

```
Browser (React)  ──HTTP──▶  Backend FastAPI  ──▶  ChromaDB (vettori su disco)
  porta 8080                  porta 8000      └─▶  Ollama (embedding + LLM)
```

| Componente | Tecnologie |
|------------|------------|
| Frontend (`src/`) | Vite, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend (`backend/`) | Python, FastAPI, LangChain, ChromaDB, Unstructured |
| Modelli (default) | `nomic-embed-text` per gli embedding, `llama3` per la chat |

I documenti vengono divisi in blocchi di 1000 caratteri (sovrapposizione 200), trasformati in embedding e salvati in ChromaDB.
In fase di ricerca vengono recuperati i blocchi più simili alla domanda; in chat questi blocchi diventano il contesto passato al modello.

Formati supportati: `.pdf`, `.doc`, `.docx`, `.txt`.

## Requisiti

- [Ollama](https://ollama.com) installato e in esecuzione
- Python 3.11+
- Node.js 18+ e npm

## Avvio rapido

**1. Modelli Ollama**

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

**2. Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

**3. Frontend** (in un secondo terminale, dalla radice del progetto)

```bash
npm install
npm run dev
```

Aprire <http://localhost:8080>. L'indirizzo del backend si imposta dall'icona impostazioni dell'interfaccia (predefinito `http://localhost:8000`).

## Configurazione del backend

Variabili d'ambiente opzionali:

| Variabile | Predefinito | Descrizione |
|-----------|-------------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Indirizzo di Ollama |
| `EMBED_MODEL` | `nomic-embed-text` | Modello per gli embedding |
| `CHAT_MODEL` | `llama3` | Modello per la chat |
| `CHROMA_DIR` | `./chroma_db` | Cartella del database vettoriale |
| `UPLOAD_DIR` | `./uploads` | Cartella dei file caricati dall'interfaccia |
| `INGEST_ROOT` | `./docs` | Unica cartella da cui `/api/ingest` può indicizzare file |
| `CORS_ORIGINS` | `http://localhost:8080,http://127.0.0.1:8080` | Origini web autorizzate a chiamare l'API |

> Se si cambia `EMBED_MODEL` dopo aver indicizzato dei documenti, cancellare `CHROMA_DIR` e reindicizzare: embedding di modelli diversi non sono confrontabili.

## API

| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| GET | `/api/health` | Stato del servizio e modelli in uso |
| POST | `/api/search` | Ricerca semantica — `{"query": "...", "top_k": 5}` |
| POST | `/api/chat` | Chat sui documenti — `{"messages": [{"role": "user", "content": "..."}], "top_k": 5}` |
| POST | `/api/upload` | Caricamento e indicizzazione di un file (multipart) |
| POST | `/api/ingest` | Indicizzazione di un file già presente in `INGEST_ROOT` — `{"file_path": "..."}` |
| GET | `/api/documents` | Elenco dei documenti indicizzati |

Documentazione interattiva: <http://localhost:8000/docs>.

## Uso in rete locale

Per impostazione predefinita backend e frontend accettano connessioni **solo dalla macchina locale**.
Per usare il backend da un altro PC della LAN (ad esempio un server con GPU che ospita Ollama):

```bash
CORS_ORIGINS="http://192.168.1.50:8080" uvicorn main:app --host 0.0.0.0 --port 8000
```

dove `192.168.1.50:8080` è l'indirizzo da cui viene servito il frontend; poi impostare nell'interfaccia l'indirizzo del server (es. `http://192.168.1.100:8000`).

## Sicurezza

Il backend **non ha autenticazione**: chiunque raggiunga la porta 8000 può leggere i contenuti indicizzati.

- Esporlo solo su reti fidate, mai direttamente su Internet.
- In LAN, limitare l'accesso alla porta con il firewall agli host autorizzati.
- I file caricati restano in `UPLOAD_DIR` e i loro contenuti in `CHROMA_DIR`: proteggere o cancellare queste cartelle se contengono documenti riservati. Entrambe sono escluse dal repository tramite `.gitignore`.

## Sviluppo

```bash
npm run build     # build di produzione in dist/
npm test          # test del frontend (Vitest)
```

Il frontend è stato inizialmente generato con [Lovable](https://lovable.dev).

## Autore

Pierfabrizio Giancola

## Licenza

Distribuito con licenza [GNU General Public License v3.0](LICENSE).
Copyright (C) 2026 Pierfabrizio Giancola.

// RAG API client — connects to local backend on LAN

const DEFAULT_ENDPOINT = "http://localhost:8000";

export function getEndpoint(): string {
  return localStorage.getItem("rag_endpoint") || DEFAULT_ENDPOINT;
}

export function setEndpoint(url: string) {
  localStorage.setItem("rag_endpoint", url.replace(/\/+$/, ""));
}

export interface SearchResult {
  content: string;
  file_path: string;
  page?: number;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
}

export interface DocumentInfo {
  file_path: string;
  file_name: string;
  file_type: string;
  indexed_at: string;
  chunks_count: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getEndpoint();
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function searchDocuments(query: string, topK = 5): Promise<SearchResponse> {
  return apiFetch("/api/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export async function chatWithDocuments(
  messages: { role: string; content: string }[],
  topK = 5
): Promise<ChatResponse> {
  return apiFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages, top_k: topK }),
  });
}

export async function getDocuments(): Promise<DocumentInfo[]> {
  return apiFetch("/api/documents");
}

export async function ingestDocument(filePath: string): Promise<{ status: string }> {
  return apiFetch("/api/ingest", {
    method: "POST",
    body: JSON.stringify({ file_path: filePath }),
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch("/api/health");
    return true;
  } catch {
    return false;
  }
}

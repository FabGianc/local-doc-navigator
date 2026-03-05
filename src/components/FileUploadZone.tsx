import { useState, useCallback } from "react";
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getEndpoint } from "@/lib/rag-api";
import { cn } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function FileUploadZone({ onUploaded }: { onUploaded?: () => void }) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");

  const uploadFile = useCallback(async (file: File) => {
    setStatus("uploading");
    setMessage(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${getEndpoint()}/api/upload`, { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      setStatus("success");
      setMessage(`${file.name} — ${data.chunks} chunks indicizzati`);
      onUploaded?.();
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Errore durante l'upload");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
        dragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/40 hover:bg-surface-elevated",
        status === "success" && "border-relevance-high bg-relevance-high/5",
        status === "error" && "border-destructive bg-destructive/5"
      )}
      onClick={() => {
        if (status === "idle") document.getElementById("file-upload-input")?.click();
      }}
    >
      <input
        id="file-upload-input"
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInput}
        className="hidden"
      />

      {status === "idle" && (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Trascina un file o <span className="text-primary font-medium">clicca per caricare</span>
          </p>
          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT</p>
        </div>
      )}

      {status === "uploading" && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-foreground font-medium">Indicizzazione in corso...</p>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-full">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-relevance-high" />
          <p className="text-sm text-relevance-high font-medium">Documento indicizzato!</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">Errore</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
}

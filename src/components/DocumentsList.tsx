import { useEffect, useState } from "react";
import { FileText, RefreshCw, Loader2, HardDrive } from "lucide-react";
import { getDocuments, type DocumentInfo } from "@/lib/rag-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  txt: "📃",
};

export function DocumentsList() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDocuments();
      setDocs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Documenti indicizzati
        </h3>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading} className="h-7 w-7">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">Backend non raggiungibile</p>
      )}

      {!error && docs.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">Nessun documento indicizzato</p>
      )}

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin">
        {docs.map((doc, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg",
              "bg-surface-elevated border border-border text-sm"
            )}
          >
            <span>{typeIcons[doc.file_type] || "📄"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-card-foreground truncate">{doc.file_name}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{doc.file_path}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{doc.chunks_count} chunks</span>
          </div>
        ))}
      </div>
    </div>
  );
}

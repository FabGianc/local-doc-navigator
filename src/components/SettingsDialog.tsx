import { useState, useEffect } from "react";
import { Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEndpoint, setEndpoint, checkHealth } from "@/lib/rag-api";
import { cn } from "@/lib/utils";

export function SettingsDialog() {
  const [url, setUrl] = useState(getEndpoint());
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus("checking");
    const ok = await checkHealth();
    setStatus(ok ? "ok" : "error");
  };

  const handleSave = () => {
    setEndpoint(url);
    testConnection();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          <span
            className={cn(
              "absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-background",
              status === "ok" && "bg-relevance-high",
              status === "error" && "bg-destructive",
              (status === "idle" || status === "checking") && "bg-muted-foreground"
            )}
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurazione Endpoint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              URL Backend RAG
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.100:8000"
              className={cn(
                "w-full h-10 px-3 rounded-lg font-mono text-sm",
                "bg-surface-elevated border border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {status === "checking" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Verifica connessione...</span>
                </>
              )}
              {status === "ok" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-relevance-high" />
                  <span className="text-relevance-high">Connesso</span>
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Non raggiungibile</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={testConnection}>
                Testa
              </Button>
              <Button size="sm" onClick={handleSave}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

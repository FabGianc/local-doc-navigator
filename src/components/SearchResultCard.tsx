import { FileText, FolderOpen } from "lucide-react";
import type { SearchResult } from "@/lib/rag-api";
import { cn } from "@/lib/utils";

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  onClick?: () => void;
}

function RelevanceBadge({ score }: { score: number }) {
  const level = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  const label = level === "high" ? "Alta" : level === "medium" ? "Media" : "Bassa";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        level === "high" && "bg-relevance-high/15 text-relevance-high",
        level === "medium" && "bg-relevance-medium/15 text-relevance-medium",
        level === "low" && "bg-relevance-low/15 text-relevance-low"
      )}
    >
      {Math.round(score * 100)}% — {label}
    </span>
  );
}

export function SearchResultCard({ result, index, onClick }: SearchResultCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 rounded-xl border border-border bg-card",
        "hover:border-primary/30 hover:shadow-md",
        "transition-all duration-200 group"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-mono font-semibold">
            {index + 1}
          </span>
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-card-foreground truncate">
            {result.file_path.split("/").pop()}
          </span>
          {result.page && (
            <span className="text-xs text-muted-foreground">p. {result.page}</span>
          )}
        </div>
        <RelevanceBadge score={result.score} />
      </div>

      <p className="text-sm text-card-foreground/80 leading-relaxed line-clamp-3 mb-3">
        {result.content}
      </p>

      <div className="flex items-center gap-1.5 text-xs">
        <FolderOpen className="h-3.5 w-3.5 text-source-path" />
        <code className="font-mono text-source-path-foreground bg-source-path/10 px-2 py-0.5 rounded truncate max-w-full">
          {result.file_path}
        </code>
      </div>
    </button>
  );
}

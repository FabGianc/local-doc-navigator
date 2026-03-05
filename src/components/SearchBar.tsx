import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({ onSearch, isLoading, placeholder = "Cerca nei documenti..." }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 pl-12 pr-14 rounded-xl",
            "bg-surface-elevated border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "transition-all duration-200",
            "text-base font-sans shadow-sm"
          )}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "h-10 px-4 rounded-lg",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 disabled:opacity-40",
            "transition-all duration-150 text-sm font-medium"
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
        </button>
      </div>
    </form>
  );
}

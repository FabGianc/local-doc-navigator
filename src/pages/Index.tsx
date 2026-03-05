import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";
import { SearchResultCard } from "@/components/SearchResultCard";
import { ChatPanel } from "@/components/ChatPanel";
import { SettingsDialog } from "@/components/SettingsDialog";
import { DocumentsList } from "@/components/DocumentsList";
import { FileUploadZone } from "@/components/FileUploadZone";
import { searchDocuments, type SearchResult } from "@/lib/rag-api";
import { Search, MessageSquare, Database, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type View = "search" | "chat";

const Index = () => {
  const [view, setView] = useState<View>("search");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [chatQuery, setChatQuery] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await searchDocuments(query);
      setResults(response.results);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const openChatWithQuery = (query?: string) => {
    setChatQuery(query);
    setView("chat");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-card p-5 gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">RAG Search</h1>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setView("search")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "search"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Search className="h-4 w-4" />
            Ricerca
          </button>
          <button
            onClick={() => openChatWithQuery()}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "chat"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat RAG
          </button>
        </nav>

        <div className="flex-1" />

        <FileUploadZone />

        <DocumentsList />

        <div className="border-t border-border pt-3 flex justify-end">
          <SettingsDialog />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Database className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">RAG Search</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("search")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "search" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => openChatWithQuery()}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <SettingsDialog />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === "search" ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              {/* Search hero */}
              <div className={cn(
                "flex flex-col items-center justify-center px-6 transition-all duration-500",
                hasSearched ? "pt-8 pb-6" : "pt-24 pb-12"
              )}>
                {!hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                      Cerca nei tuoi documenti
                    </h2>
                    <p className="text-muted-foreground">
                      Ricerca semantica con RAG su PDF, DOC, DOCX e altri formati
                    </p>
                  </motion.div>
                )}
                <SearchBar onSearch={handleSearch} isLoading={isSearching} />
              </div>

              {/* Results */}
              <div className="flex-1 px-6 pb-8 max-w-3xl mx-auto w-full">
                {hasSearched && !isSearching && results.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm mt-8">
                    Nessun risultato trovato. Verifica che il backend sia attivo e i documenti indicizzati.
                  </p>
                )}

                <div className="space-y-3">
                  {results.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SearchResultCard
                        result={result}
                        index={i}
                        onClick={() => openChatWithQuery(`Dimmi di più su: ${result.content.slice(0, 100)}`)}
                      />
                    </motion.div>
                  ))}
                </div>

                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-center"
                  >
                    <button
                      onClick={() => openChatWithQuery(lastQuery)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Approfondisci con la chat
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <div className="lg:hidden p-3 border-b border-border">
                <button
                  onClick={() => setView("search")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Torna alla ricerca
                </button>
              </div>
              <ChatPanel initialQuery={chatQuery} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;

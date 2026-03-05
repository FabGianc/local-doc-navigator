import { useState, useRef, useEffect } from "react";
import { Send, Loader2, FolderOpen, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithDocuments, type ChatMessage, type SearchResult } from "@/lib/rag-api";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  initialQuery?: string;
}

function SourceTag({ source }: { source: SearchResult }) {
  return (
    <div className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md bg-source-path/10">
      <FolderOpen className="h-3 w-3 text-source-path" />
      <code className="font-mono text-source-path-foreground truncate max-w-[200px]">
        {source.file_path}
      </code>
      {source.page && <span className="text-muted-foreground">p.{source.page}</span>}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function ChatPanel({ initialQuery }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialQuery && !initialized.current) {
      initialized.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithDocuments(
        updatedMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer, sources: response.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore di connessione al backend RAG. Verifica che il servizio sia attivo." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) sendMessage(input.trim());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Fai una domanda sui tuoi documenti</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  msg.role === "user" ? "bg-chat-user text-primary-foreground" : "bg-secondary"
                )}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div>
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-chat-user text-primary-foreground"
                      : "bg-chat-assistant text-secondary-foreground"
                  )}
                >
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.sources.map((s, j) => (
                      <SourceTag key={j} source={s} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl bg-chat-assistant px-2 py-1">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi una domanda..."
            className={cn(
              "flex-1 h-11 px-4 rounded-lg",
              "bg-surface-elevated border border-border",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "text-sm transition-all"
            )}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-11 w-11 rounded-lg flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 disabled:opacity-40",
              "transition-all"
            )}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

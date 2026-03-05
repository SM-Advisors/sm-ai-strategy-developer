import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAndreaChat } from "@/hooks/use-andrea-chat";
import AndreaChatMessages from "./AndreaChatMessages";
import AndreaSuggestedPrompts from "./AndreaSuggestedPrompts";
import andreaCoachImg from "@/assets/andrea-coach.png";
import andreaCoach2Img from "@/assets/andrea-coach2.png";

interface AndreaChatProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** When true, the bubble fades to avoid overlapping UI elements */
  dimBubble?: boolean;
}

export default function AndreaChat({ isOpen, onOpen, onClose, dimBubble }: AndreaChatProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    latestPrompts,
    appliedEdits,
    dismissedEdits,
    sendMessage,
    applyFieldEdit,
    dismissFieldEdit,
  } = useAndreaChat();

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter alone sends; Shift+Enter or Ctrl+Shift+Enter adds a newline
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
          sendMessage(inputValue.trim());
          setInputValue("");
          if (inputRef.current) inputRef.current.style.height = "auto";
        }
      }
    },
    [inputValue, isLoading, sendMessage]
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // --- Collapsed bubble ---
  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className={`fixed bottom-6 right-6 z-[9999] group transition-opacity duration-300 ${
          dimBubble ? "opacity-20 hover:opacity-80" : "opacity-100"
        }`}
        aria-label="Open Andrea AI Assistant"
      >
        <div className="relative">
          <img
            src={andreaCoachImg}
            alt="Andrea"
            className="h-24 w-24 rounded-full shadow-lg ring-2 ring-primary/30 group-hover:ring-primary/60 group-hover:scale-105 transition-all duration-300 object-cover bg-white"
          />
          {messages.length <= 1 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
          )}
        </div>
      </button>
    );
  }

  // --- Expanded side panel (slides in from right, full screen height) ---
  return (
    <div className="fixed right-0 top-0 z-[9998] h-screen w-full sm:w-[400px] flex flex-col shadow-2xl border-l border-border bg-background">
      {/* Header */}
      <div className="bg-background px-4 py-3 flex items-center gap-3 shrink-0 border-b border-border">
        <img
          src={andreaCoach2Img}
          alt="Andrea"
          className="h-10 w-10 rounded-full object-cover ring-1 ring-foreground/20"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground font-sans leading-none">
            Andrea
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your AI Strategy Advisor
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-foreground/60 hover:text-foreground p-1 rounded-md hover:bg-foreground/10 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-card overflow-hidden flex flex-col min-h-0">
        <AndreaChatMessages
          messages={messages}
          appliedEdits={appliedEdits}
          dismissedEdits={dismissedEdits}
          onApplyEdit={applyFieldEdit}
          onDismissEdit={dismissFieldEdit}
          isLoading={isLoading}
        />

        <AndreaSuggestedPrompts
          prompts={latestPrompts}
          onSelect={handlePromptClick}
          disabled={isLoading}
        />
      </div>

      {/* Input area */}
      <div className="bg-card border-t border-[hsl(var(--card-border))] px-4 py-3 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Andrea anything..."
            disabled={isLoading}
            rows={1}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-[hsl(var(--card-border))] bg-card text-card-foreground placeholder:text-card-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none overflow-y-auto"
            style={{ maxHeight: 120 }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

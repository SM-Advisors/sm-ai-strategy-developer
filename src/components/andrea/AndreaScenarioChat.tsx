import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAndreaScenarioChat } from "@/hooks/use-andrea-scenario-chat";
import AndreaChatMessages from "./AndreaChatMessages";
import AndreaSuggestedPrompts from "./AndreaSuggestedPrompts";
import andreaCoachImg from "@/assets/andrea-coach.png";
import andreaCoach2Img from "@/assets/andrea-coach2.png";
import type { ScenarioResult } from "@/hooks/use-run-scenario";

interface AndreaScenarioChatProps {
  scenarioResults: ScenarioResult[];
}

export default function AndreaScenarioChat({ scenarioResults }: AndreaScenarioChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    latestPrompts,
    sendMessage,
    updateScenarioResults,
  } = useAndreaScenarioChat();

  // Keep scenario results in sync
  useEffect(() => {
    updateScenarioResults(scenarioResults);
  }, [scenarioResults, updateScenarioResults]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // Map ScenarioChatMessage to ChatMessage format for reuse of AndreaChatMessages
  const chatMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    suggestedPrompts: m.suggestedPrompts,
  }));

  // --- Collapsed bubble ---
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] group"
        aria-label="Open Andrea Scenario Advisor"
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

  // --- Expanded chat panel ---
  return (
    <div className="fixed bottom-0 right-0 z-[9999] w-full h-[85vh] sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[560px] flex flex-col rounded-none sm:rounded-xl shadow-2xl overflow-hidden border border-border">
      {/* Header */}
      <div className="bg-background px-4 py-3 flex items-center gap-3 shrink-0">
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
            Scenario Analysis Advisor
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-foreground/60 hover:text-foreground p-1 rounded-md hover:bg-foreground/10 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-card overflow-hidden flex flex-col min-h-0">
        <AndreaChatMessages
          messages={chatMessages}
          appliedEdits={new Set()}
          onApplyEdit={() => {}}
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
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about scenario results..."
            disabled={isLoading}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-[hsl(var(--card-border))] bg-card text-card-foreground placeholder:text-card-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
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

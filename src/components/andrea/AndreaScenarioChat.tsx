import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Square, MessageSquarePlus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAndreaScenarioChat } from "@/hooks/use-andrea-scenario-chat";
import AndreaChatMessages from "./AndreaChatMessages";
import AndreaSuggestedPrompts from "./AndreaSuggestedPrompts";
import AndreaChatHistory from "./AndreaChatHistory";
import andreaCoachImg from "@/assets/andrea-coach.png";
import andreaCoach2Img from "@/assets/andrea-coach2.png";
import type { ScenarioResult } from "@/hooks/use-run-scenario";

interface AndreaScenarioChatProps {
  scenarioResults: ScenarioResult[];
}

export default function AndreaScenarioChat({ scenarioResults }: AndreaScenarioChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    latestPrompts,
    conversations,
    activeConversationId,
    sendMessage,
    cancelRequest,
    startNewChat,
    switchConversation,
    deleteConversation,
    updateScenarioResults,
  } = useAndreaScenarioChat();

  // Keep scenario results in sync
  useEffect(() => {
    updateScenarioResults(scenarioResults);
  }, [scenarioResults, updateScenarioResults]);

  useEffect(() => {
    if (isOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeConversationId, showHistory]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleNewChat = () => {
    startNewChat();
    setShowHistory(false);
    setInputValue("");
  };

  // Map messages for AndreaChatMessages reuse
  const chatMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    suggestedPrompts: m.suggestedPrompts,
  }));

  const historyConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    messages: c.messages,
    createdAt: c.createdAt,
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
            Scenario Analysis Advisor
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="text-foreground/60 hover:text-foreground p-1.5 rounded-md hover:bg-foreground/10 transition-colors"
            aria-label="New chat"
            title="New chat"
          >
            <MessageSquarePlus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`p-1.5 rounded-md transition-colors ${
              showHistory
                ? "text-primary bg-primary/10"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/10"
            }`}
            aria-label="Chat history"
            title="Chat history"
          >
            <History className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-foreground/60 hover:text-foreground p-1.5 rounded-md hover:bg-foreground/10 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History panel or chat */}
      {showHistory ? (
        <div className="flex-1 overflow-hidden bg-card">
          <AndreaChatHistory
            conversations={historyConversations as any}
            activeId={activeConversationId}
            onSelect={switchConversation}
            onDelete={deleteConversation}
            onNewChat={handleNewChat}
            onClose={() => setShowHistory(false)}
          />
        </div>
      ) : (
        <>
          {/* Messages area */}
          <div className="flex-1 bg-card overflow-hidden flex flex-col min-h-0">
            <AndreaChatMessages
              messages={chatMessages}
              appliedEdits={new Set()}
              dismissedEdits={new Set()}
              onApplyEdit={() => {}}
              onDismissEdit={() => {}}
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
                placeholder="Ask about scenario results..."
                disabled={isLoading}
                rows={1}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-[hsl(var(--card-border))] bg-card text-card-foreground placeholder:text-card-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none overflow-y-auto"
                style={{ maxHeight: 120 }}
              />
              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9 shrink-0"
                  onClick={cancelRequest}
                  aria-label="Stop generating"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}

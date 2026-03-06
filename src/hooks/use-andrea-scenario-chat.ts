import { useState, useCallback, useRef } from "react";
import { useIntakeStore } from "@/stores/intake-store";
import type { ScenarioResult } from "./use-run-scenario";

// --- Types ---

export interface ScenarioChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedPrompts?: string[];
}

export interface ScenarioChatConversation {
  id: string;
  title: string;
  messages: ScenarioChatMessage[];
  createdAt: number;
}

// --- Constants ---

const INITIAL_PROMPTS = [
  "What are the key patterns?",
  "Which concerns should I prioritize?",
  "How do stakeholder views conflict?",
];

const WELCOME_MESSAGE: ScenarioChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I'm Andrea, and I'm here to help you interpret your scenario results. Once you've run scenarios for different stakeholders, I can help you identify patterns, prioritize concerns, and suggest plan modifications. What would you like to discuss?",
  suggestedPrompts: INITIAL_PROMPTS,
};

function createConversation(): ScenarioChatConversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [WELCOME_MESSAGE],
    createdAt: Date.now(),
  };
}

function deriveTitle(text: string): string {
  const cleaned = text.trim().replace(/\n+/g, " ");
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "…" : cleaned;
}

// --- Hook ---

export function useAndreaScenarioChat() {
  const [conversations, setConversations] = useState<ScenarioChatConversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scenarioResultsRef = useRef<ScenarioResult[]>([]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [WELCOME_MESSAGE];

  const updateScenarioResults = useCallback((results: ScenarioResult[]) => {
    scenarioResultsRef.current = results;
  }, []);

  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  const updateActiveMessages = useCallback(
    (updater: (prev: ScenarioChatMessage[]) => ScenarioChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: updater(c.messages) } : c))
      );
    },
    [activeId]
  );

  const updateActiveTitle = useCallback(
    (title: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, title } : c))
      );
    },
    [activeId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ScenarioChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      const isFirstUserMsg = !messages.some((m) => m.role === "user");
      if (isFirstUserMsg) {
        updateActiveTitle(deriveTitle(text));
      }

      updateActiveMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const store = useIntakeStore.getState();
        const planMarkdown = store.generatedPlan;
        const companyName = store.companyName;
        const industry = store.industry;

        const apiMessages = [...messages.filter((m) => m.id !== "welcome"), userMessage]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andrea-scenario-chat`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            planMarkdown,
            companyName,
            industry,
            scenarioResults: scenarioResultsRef.current,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${resp.status}`);
        }

        const data = await resp.json();

        const assistantMessage: ScenarioChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I'm here to help discuss your scenario results. What would you like to know?",
          suggestedPrompts:
            Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0
              ? data.suggestedPrompts
              : undefined,
        };

        updateActiveMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return;

        console.error("Andrea scenario chat error:", err);

        const errorMessage: ScenarioChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm sorry, I had trouble connecting. Please try sending your message again.",
          suggestedPrompts: ["Try again"],
        };
        updateActiveMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, updateActiveMessages, updateActiveTitle]
  );

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    const newConvo = createConversation();
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(newConvo.id);
  }, []);

  const switchConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeId) return;
      abortRef.current?.abort();
      abortRef.current = null;
      setIsLoading(false);
      setActiveId(conversationId);
    },
    [activeId]
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== conversationId);
        if (conversationId === activeId) {
          if (filtered.length === 0) {
            const newConvo = createConversation();
            setActiveId(newConvo.id);
            return [newConvo];
          }
          setActiveId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeId]
  );

  return {
    messages,
    isLoading,
    latestPrompts,
    conversations,
    activeConversationId: activeId,
    sendMessage,
    cancelRequest,
    startNewChat,
    switchConversation,
    deleteConversation,
    updateScenarioResults,
  };
}

import { useState, useCallback, useRef } from "react";
import { useIntakeStore } from "@/stores/intake-store";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

export interface PlanImprovement {
  section: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  title: string;
  description: string;
  impact: string;
}

export interface PlanReviewMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  improvements?: PlanImprovement[];
  suggestedPrompts?: string[];
}

export interface PlanReviewConversation {
  id: string;
  title: string;
  messages: PlanReviewMessage[];
  createdAt: number;
}

// --- Constants ---

const INITIAL_PROMPTS = [
  "Review my plan for improvements",
  "How strong is my roadmap?",
  "Are my KPIs well-defined?",
];

const WELCOME_MESSAGE: PlanReviewMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Andrea, your AI strategy review advisor. I've reviewed your generated AI Strategic Plan and I'm ready to help you strengthen it. I can identify improvements, answer questions about specific sections, or discuss strategic trade-offs. What would you like to explore?",
  suggestedPrompts: INITIAL_PROMPTS,
};

function createConversation(): PlanReviewConversation {
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

export function useAndreaPlanReview() {
  const [conversations, setConversations] = useState<PlanReviewConversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [WELCOME_MESSAGE];

  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  const updateActiveMessages = useCallback(
    (updater: (prev: PlanReviewMessage[]) => PlanReviewMessage[]) => {
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

      const userMessage: PlanReviewMessage = {
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

        const { data, error: invokeError } = await supabase.functions.invoke("andrea-plan-review", {
          body: {
            messages: apiMessages,
            planMarkdown,
            companyName,
            industry,
          },
        });

        if (invokeError) throw new Error(invokeError.message || "andrea-plan-review failed");

        const assistantMessage: PlanReviewMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I'm here to help review your plan. What would you like to know?",
          improvements:
            Array.isArray(data.improvements) && data.improvements.length > 0
              ? data.improvements
              : undefined,
          suggestedPrompts:
            Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0
              ? data.suggestedPrompts
              : undefined,
        };

        updateActiveMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return;

        console.error("Andrea plan review error:", err);

        const errorMessage: PlanReviewMessage = {
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
  };
}

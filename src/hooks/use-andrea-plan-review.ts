import { useState, useCallback, useRef } from "react";
import { useIntakeStore } from "@/stores/intake-store";

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

// --- Hook ---

export function useAndreaPlanReview() {
  const [messages, setMessages] = useState<PlanReviewMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /** Get the latest suggested prompts */
  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  /** Send a user message */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: PlanReviewMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
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

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andrea-plan-review`;
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
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${resp.status}`);
        }

        const data = await resp.json();

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

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return;

        console.error("Andrea plan review error:", err);

        const errorMessage: PlanReviewMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm sorry, I had trouble connecting. Please try sending your message again.",
          suggestedPrompts: ["Try again"],
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  return {
    messages,
    isLoading,
    latestPrompts,
    sendMessage,
  };
}

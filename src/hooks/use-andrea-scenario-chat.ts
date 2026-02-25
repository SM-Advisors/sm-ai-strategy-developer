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

// --- Hook ---

export function useAndreaScenarioChat() {
  const [messages, setMessages] = useState<ScenarioChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scenarioResultsRef = useRef<ScenarioResult[]>([]);

  /** Update scenario results reference (call when new results come in) */
  const updateScenarioResults = useCallback((results: ScenarioResult[]) => {
    scenarioResultsRef.current = results;
  }, []);

  /** Get latest suggested prompts */
  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  /** Send a user message */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ScenarioChatMessage = {
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

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return;

        console.error("Andrea scenario chat error:", err);

        const errorMessage: ScenarioChatMessage = {
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
    updateScenarioResults,
  };
}

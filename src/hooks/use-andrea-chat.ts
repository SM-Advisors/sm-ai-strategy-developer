import { useState, useCallback, useRef } from "react";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";

// --- Types ---

export interface FieldEdit {
  fieldId: string;
  fieldLabel: string;
  suggestedValue: string | string[];
  reason: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  fieldEdits?: FieldEdit[];
  suggestedPrompts?: string[];
}

// --- Constants ---

const INITIAL_PROMPTS = [
  "What is this assessment for?",
  "Help me with this section",
  "What should I put here?",
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Andrea, your AI strategy intake advisor. I'm here to help you complete your AI Strategic Planning assessment. Ask me anything about the form, or I can suggest answers based on your organization's context.",
  suggestedPrompts: INITIAL_PROMPTS,
};

// --- Hook ---

export function useAndreaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedEdits, setAppliedEdits] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  /** Get the latest suggested prompts from the most recent assistant message */
  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  /** Build context payload from current intake store state */
  const buildContext = useCallback(() => {
    const store = useIntakeStore.getState();
    const formState = store.getFormData();
    const currentStep = store.currentStep;

    const currentSection =
      currentStep < sections.length
        ? { index: currentStep, title: sections[currentStep].title }
        : null;

    const visibleFields =
      currentSection
        ? sections[currentStep].fields
            .filter((f) => {
              if (!f.showIf) return true;
              const condVal = formState[f.showIf.field as keyof IntakeFormData] as string;
              if (f.showIf.condition === "notEqual") return condVal !== f.showIf.value;
              if (f.showIf.condition === "equal") return condVal === f.showIf.value;
              return !!condVal;
            })
            .map((f) => ({
              id: f.id,
              label: f.label,
              type: f.type,
              options: f.options,
            }))
        : [];

    return { formState, currentSection, visibleFields };
  }, []);

  /** Send a user message and get Andrea's response */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { formState, currentSection, visibleFields } = buildContext();

        // Build messages for the API (exclude the welcome message, cap at 20)
        const apiMessages = [...messages.filter((m) => m.id !== "welcome"), userMessage]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andrea-chat`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            currentSection,
            formState,
            visibleFields,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${resp.status}`);
        }

        const data = await resp.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I'm here to help! What would you like to know about the assessment?",
          fieldEdits: Array.isArray(data.fieldEdits) && data.fieldEdits.length > 0 ? data.fieldEdits : undefined,
          suggestedPrompts: Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0 ? data.suggestedPrompts : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return; // Intentional cancellation

        console.error("Andrea chat error:", err);

        const errorMessage: ChatMessage = {
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
    [isLoading, messages, buildContext]
  );

  /** Apply a field edit suggestion to the intake form */
  const applyFieldEdit = useCallback(
    (fieldId: string, value: string | string[], editKey: string) => {
      const store = useIntakeStore.getState();
      store.setField(fieldId as keyof IntakeFormData, value as any);
      setAppliedEdits((prev) => new Set([...prev, editKey]));
    },
    []
  );

  return {
    messages,
    isLoading,
    latestPrompts,
    appliedEdits,
    sendMessage,
    applyFieldEdit,
  };
}

import { useState, useCallback, useRef } from "react";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";
import { supabase } from "@/integrations/supabase/client";

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

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
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

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [WELCOME_MESSAGE],
    createdAt: Date.now(),
  };
}

/** Derive a short title from the first user message */
function deriveTitle(text: string): string {
  const cleaned = text.trim().replace(/\n+/g, " ");
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "…" : cleaned;
}

// --- Hook ---

export function useAndreaChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedEdits, setAppliedEdits] = useState<Set<string>>(new Set());
  const [dismissedEdits, setDismissedEdits] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [WELCOME_MESSAGE];

  /** Get the latest suggested prompts from the most recent assistant message */
  const latestPrompts =
    [...messages].reverse().find((m) => m.role === "assistant" && m.suggestedPrompts?.length)
      ?.suggestedPrompts ?? [];

  /** Update messages for the active conversation */
  const updateActiveMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: updater(c.messages) } : c))
      );
    },
    [activeId]
  );

  /** Update the title of the active conversation */
  const updateActiveTitle = useCallback(
    (title: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, title } : c))
      );
    },
    [activeId]
  );

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

      // If this is the first user message, set conversation title
      const isFirstUserMsg = !messages.some((m) => m.role === "user");
      if (isFirstUserMsg) {
        updateActiveTitle(deriveTitle(text));
      }

      updateActiveMessages((prev) => [...prev, userMessage]);
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

        const { data, error: invokeError } = await supabase.functions.invoke("andrea-chat", {
          body: {
            messages: apiMessages,
            currentSection,
            formState,
            visibleFields,
          },
        });

        if (invokeError) throw new Error(invokeError.message || "andrea-chat failed");

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I'm here to help! What would you like to know about the assessment?",
          fieldEdits: Array.isArray(data.fieldEdits) && data.fieldEdits.length > 0 ? data.fieldEdits : undefined,
          suggestedPrompts: Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0 ? data.suggestedPrompts : undefined,
        };

        updateActiveMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") return; // Intentional cancellation

        console.error("Andrea chat error:", err);

        const errorMessage: ChatMessage = {
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
    [isLoading, messages, buildContext, updateActiveMessages, updateActiveTitle]
  );

  /** Cancel in-flight request */
  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  /** Start a new conversation */
  const startNewChat = useCallback(() => {
    // Cancel any in-flight request first
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);

    const newConvo = createConversation();
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(newConvo.id);
    setAppliedEdits(new Set());
    setDismissedEdits(new Set());
  }, []);

  /** Switch to an existing conversation */
  const switchConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeId) return;
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = null;
      setIsLoading(false);

      setActiveId(conversationId);
      setAppliedEdits(new Set());
      setDismissedEdits(new Set());
    },
    [activeId]
  );

  /** Delete a conversation */
  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== conversationId);
        // If we deleted the active one, switch to first or create new
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
      setAppliedEdits(new Set());
      setDismissedEdits(new Set());
    },
    [activeId]
  );

  /** Dismiss a field edit suggestion without applying it */
  const dismissFieldEdit = useCallback((editKey: string) => {
    setDismissedEdits((prev) => new Set([...prev, editKey]));
  }, []);

  /** Apply a field edit suggestion to the intake form */
  const applyFieldEdit = useCallback(
    (fieldId: string, value: string | string[], editKey: string, mode: "replace" | "append" = "replace") => {
      const store = useIntakeStore.getState();
      const currentValue = store[fieldId as keyof IntakeFormData];

      let finalValue: string | string[];
      if (mode === "append" && typeof value === "string" && typeof currentValue === "string" && currentValue.trim()) {
        finalValue = `${currentValue.trim()}\n\n— Andrea's suggestion —\n${value}`;
      } else {
        finalValue = value;
      }

      store.setField(fieldId as keyof IntakeFormData, finalValue as any, { isAndreaSuggestion: true });
      setAppliedEdits((prev) => new Set([...prev, editKey]));
    },
    []
  );

  return {
    messages,
    isLoading,
    latestPrompts,
    appliedEdits,
    dismissedEdits,
    conversations,
    activeConversationId: activeId,
    sendMessage,
    cancelRequest,
    startNewChat,
    switchConversation,
    deleteConversation,
    applyFieldEdit,
    dismissFieldEdit,
  };
}

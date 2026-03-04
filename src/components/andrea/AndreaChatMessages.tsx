import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import AndreaEditSuggestion from "./AndreaEditSuggestion";
import type { ChatMessage } from "@/hooks/use-andrea-chat";

interface AndreaChatMessagesProps {
  messages: ChatMessage[];
  appliedEdits: Set<string>;
  onApplyEdit: (fieldId: string, value: string | string[], editKey: string, mode: "replace" | "append") => void;
  isLoading: boolean;
}

export default function AndreaChatMessages({
  messages,
  appliedEdits,
  onApplyEdit,
  isLoading,
}: AndreaChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div key={msg.id}>
            {/* Message bubble */}
            <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-[hsl(220,15%,96%)] text-card-foreground rounded-2xl rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
            </div>

            {/* Field edit suggestions */}
            {msg.fieldEdits && msg.fieldEdits.length > 0 && (
              <div className="mt-1 ml-0 max-w-[85%] space-y-1.5">
                {msg.fieldEdits.map((edit) => {
                  const editKey = `${msg.id}-${edit.fieldId}`;
                  return (
                    <AndreaEditSuggestion
                      key={editKey}
                      edit={edit}
                      editKey={editKey}
                      isApplied={appliedEdits.has(editKey)}
                      onApply={(mode) =>
                        onApplyEdit(edit.fieldId, edit.suggestedValue, editKey, mode)
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[hsl(220,15%,96%)] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
            <span
              className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

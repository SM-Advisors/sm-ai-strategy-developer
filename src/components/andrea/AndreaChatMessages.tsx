import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import AndreaEditSuggestion from "./AndreaEditSuggestion";
import type { ChatMessage } from "@/hooks/use-andrea-chat";

interface AndreaChatMessagesProps {
  messages: ChatMessage[];
  appliedEdits: Set<string>;
  dismissedEdits: Set<string>;
  onApplyEdit: (fieldId: string, value: string | string[], editKey: string, mode: "replace" | "append") => void;
  onDismissEdit: (editKey: string) => void;
  isLoading: boolean;
}

export default function AndreaChatMessages({
  messages,
  appliedEdits,
  dismissedEdits,
  onApplyEdit,
  onDismissEdit,
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
            {msg.fieldEdits && msg.fieldEdits.length > 0 && (() => {
              const pendingEdits = msg.fieldEdits.filter((edit) => {
                const key = `${msg.id}-${edit.fieldId}`;
                return !appliedEdits.has(key) && !dismissedEdits.has(key);
              });
              return (
                <div className="mt-1 ml-0 max-w-[85%] space-y-1.5">
                  {msg.fieldEdits.map((edit) => {
                    const editKey = `${msg.id}-${edit.fieldId}`;
                    return (
                      <AndreaEditSuggestion
                        key={editKey}
                        edit={edit}
                        editKey={editKey}
                        isApplied={appliedEdits.has(editKey)}
                        isDismissed={dismissedEdits.has(editKey)}
                        onApply={(mode) =>
                          onApplyEdit(edit.fieldId, edit.suggestedValue, editKey, mode)
                        }
                        onReject={() => onDismissEdit(editKey)}
                      />
                    );
                  })}
                  {/* Bulk actions when 2+ suggestions are pending */}
                  {pendingEdits.length >= 2 && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() =>
                          pendingEdits.forEach((e) =>
                            onApplyEdit(e.fieldId, e.suggestedValue, `${msg.id}-${e.fieldId}`, "replace")
                          )
                        }
                      >
                        <Check className="h-3 w-3" />
                        Replace All
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs gap-1.5"
                        onClick={() =>
                          pendingEdits.forEach((e) =>
                            onApplyEdit(e.fieldId, e.suggestedValue, `${msg.id}-${e.fieldId}`, "append")
                          )
                        }
                      >
                        Append All
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
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

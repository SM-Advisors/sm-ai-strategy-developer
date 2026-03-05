import { MessageSquarePlus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/use-andrea-chat";

interface AndreaChatHistoryProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export default function AndreaChatHistory({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onClose,
}: AndreaChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Chat History</h4>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {conversations.map((convo) => {
          const isActive = convo.id === activeId;
          const hasUserMessages = convo.messages.some((m) => m.role === "user");
          const timeLabel = formatTime(convo.createdAt);

          return (
            <button
              key={convo.id}
              onClick={() => {
                onSelect(convo.id);
                onClose();
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors group",
                isActive && "bg-muted"
              )}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  isActive ? "font-medium text-foreground" : "text-foreground/80"
                )}>
                  {convo.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{timeLabel}</p>
              </div>
              {hasUserMessages && conversations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(convo.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

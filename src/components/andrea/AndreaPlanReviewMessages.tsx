import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { PlanReviewMessage, PlanImprovement } from "@/hooks/use-andrea-plan-review";
import { AlertTriangle, AlertCircle, Info, ArrowUp } from "lucide-react";

interface AndreaPlanReviewMessagesProps {
  messages: PlanReviewMessage[];
  isLoading: boolean;
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  Critical: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  High: { icon: AlertCircle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  Moderate: { icon: Info, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Low: { icon: ArrowUp, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
};

function ImprovementCard({ improvement }: { improvement: PlanImprovement }) {
  const config = severityConfig[improvement.severity] || severityConfig.Low;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-3 space-y-1.5", config.bg, config.border)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
        <span className={cn("text-xs font-semibold", config.color)}>{improvement.severity}</span>
        <span className="text-xs text-gray-500">·</span>
        <span className="text-xs text-gray-600">{improvement.section}</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{improvement.title}</p>
      <p className="text-xs text-gray-700 leading-relaxed">{improvement.description}</p>
      <p className="text-xs text-gray-500 italic">Impact: {improvement.impact}</p>
    </div>
  );
}

export default function AndreaPlanReviewMessages({
  messages,
  isLoading,
}: AndreaPlanReviewMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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

            {/* Improvement suggestions */}
            {msg.improvements && msg.improvements.length > 0 && (
              <div className="mt-2 ml-0 max-w-[90%] space-y-2">
                {msg.improvements.map((improvement, i) => (
                  <ImprovementCard key={`${msg.id}-improvement-${i}`} improvement={improvement} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[hsl(220,15%,96%)] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-card-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

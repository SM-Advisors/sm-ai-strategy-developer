import { useState } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ScenarioResult } from "@/hooks/use-run-scenario";

interface ScenarioResultCardProps {
  result: ScenarioResult;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const sentimentColors: Record<string, { bg: string; text: string; border: string }> = {
  Supportive: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Cautiously Optimistic": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Concerned: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Skeptical: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Opposed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function ScenarioResultCard({ result, onRegenerate, isRegenerating }: ScenarioResultCardProps) {
  const [expanded, setExpanded] = useState(true);
  const sentiment = sentimentColors[result.overallSentiment] || sentimentColors.Concerned;

  return (
    <div className={cn("bg-card rounded-xl border card-elevated overflow-hidden", sentiment.border)}>
      {/* Header */}
      <div className={cn("px-5 py-4 border-b flex items-center justify-between gap-3", sentiment.border, sentiment.bg)}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 min-w-0"
          >
            {expanded
              ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            }
            <h3 className="font-semibold text-gray-900 truncate">{result.stakeholder}</h3>
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="gap-1.5 text-xs h-7"
            >
              <RefreshCw className={cn("w-3 h-3", isRegenerating && "animate-spin")} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          )}
          <span className={cn(
            "text-sm font-medium px-3 py-1 rounded-full border",
            sentiment.bg, sentiment.text, sentiment.border
          )}>
            {result.overallSentiment}
          </span>
        </div>
      </div>

      {/* Narrative Body */}
      {expanded && (
        <div className="px-6 py-5">
          <div className="prose prose-sm max-w-none
            prose-headings:font-serif prose-headings:text-card-foreground
            prose-h1:text-xl prose-h1:mb-2 prose-h1:mt-0
            prose-h2:text-base prose-h2:mb-1 prose-h2:mt-4
            prose-h3:text-sm prose-h3:font-semibold prose-h3:mb-1 prose-h3:mt-4 prose-h3:text-gray-700
            prose-p:text-sm prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-600
            prose-ul:my-2 prose-ul:space-y-1
            prose-li:text-sm prose-li:text-gray-700
            prose-hr:border-gray-200 prose-hr:my-4
            [&>*:first-child]:mt-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.narrative}
            </ReactMarkdown>
          </div>
          {result.createdAt && (
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-gray-100">
              Generated {new Date(result.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

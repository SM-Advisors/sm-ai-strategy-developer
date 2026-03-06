import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Quote, AlertTriangle, AlertCircle, Info, ArrowUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { ScenarioResult, ScenarioRecommendation, ScenarioRisk } from "@/hooks/use-run-scenario";

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

const priorityConfig: Record<string, { icon: React.ElementType; color: string }> = {
  Critical: { icon: AlertTriangle, color: "text-red-600" },
  High: { icon: AlertCircle, color: "text-orange-600" },
  Moderate: { icon: Info, color: "text-amber-600" },
  Low: { icon: ArrowUp, color: "text-blue-600" },
};

function PhaseSentimentBadge({ sentiment }: { sentiment: string }) {
  const colors = sentimentColors[sentiment] || sentimentColors.Concerned;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
      {sentiment}
    </span>
  );
}

function RecommendationRow({ rec }: { rec: ScenarioRecommendation }) {
  const config = priorityConfig[rec.priority] || priorityConfig.Low;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 py-2">
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.color)} />
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold", config.color)}>{rec.priority}</span>
          <span className="text-sm font-medium text-gray-900">{rec.title}</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
        <p className="text-xs text-gray-400 italic">{rec.rationale}</p>
      </div>
    </div>
  );
}

function RiskRow({ risk }: { risk: ScenarioRisk }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="space-y-0.5 flex-1">
        <p className="text-sm text-gray-900">{risk.risk}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Likelihood: <strong className="text-gray-700">{risk.likelihood}</strong></span>
          <span>Impact: <strong className="text-gray-700">{risk.impact}</strong></span>
        </div>
        <p className="text-xs text-gray-600 italic">Mitigation: {risk.mitigation}</p>
      </div>
    </div>
  );
}

export default function ScenarioResultCard({ result, onRegenerate, isRegenerating }: ScenarioResultCardProps) {
  const [phasesOpen, setPhasesOpen] = useState(false);
  const [risksOpen, setRisksOpen] = useState(false);
  const sentiment = sentimentColors[result.overallSentiment] || sentimentColors.Concerned;

  return (
    <div className={cn("bg-card rounded-xl border card-elevated", sentiment.border)}>
      {/* Header */}
      <div className={cn("px-5 py-4 border-b", sentiment.border, sentiment.bg)}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{result.stakeholder}</h3>
          <span className={cn("text-sm font-medium px-3 py-1 rounded-full", sentiment.bg, sentiment.text, "border", sentiment.border)}>
            {result.overallSentiment}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{result.sentimentRationale}</p>
      </div>

      {/* Executive Summary */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Executive Summary</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{result.executiveSummary}</p>
        </div>

        {/* Quotable Reaction */}
        {result.quotableReaction && (
          <div className="flex gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <Quote className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 italic leading-relaxed">"{result.quotableReaction}"</p>
          </div>
        )}

        {/* Phase Analysis — Collapsible */}
        {result.phaseAnalysis && result.phaseAnalysis.length > 0 && (
          <Collapsible open={phasesOpen} onOpenChange={setPhasesOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary cursor-pointer transition-colors">
              {phasesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Phase-by-Phase Analysis
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
              <div className="mt-3 space-y-4">
                {result.phaseAnalysis.map((phase, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-sm font-semibold text-gray-900">{phase.phase}</h5>
                      <PhaseSentimentBadge sentiment={phase.sentiment} />
                    </div>
                    {phase.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {phase.strengths.map((s, j) => (
                            <li key={j} className="text-xs text-gray-700 pl-3 border-l-2 border-green-200">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {phase.concerns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">Concerns</p>
                        <ul className="space-y-0.5">
                          {phase.concerns.map((c, j) => (
                            <li key={j} className="text-xs text-gray-700 pl-3 border-l-2 border-amber-200">{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-blue-800"><strong>Key Question:</strong> {phase.keyQuestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Recommendations */}
        {result.topRecommendations && result.topRecommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommendations</h4>
            <div className="divide-y divide-gray-100">
              {result.topRecommendations.map((rec, i) => (
                <RecommendationRow key={i} rec={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Risks — Collapsible */}
        {result.risksIdentified && result.risksIdentified.length > 0 && (
          <Collapsible open={risksOpen} onOpenChange={setRisksOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary cursor-pointer transition-colors">
              {risksOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Risks Identified ({result.risksIdentified.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
              <div className="mt-2">
                {result.risksIdentified.map((risk, i) => (
                  <RiskRow key={i} risk={risk} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

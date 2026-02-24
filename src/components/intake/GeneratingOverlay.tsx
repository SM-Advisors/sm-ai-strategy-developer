import { useEffect, useRef, useState } from "react";
import { useIntakeStore } from "@/stores/intake-store";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TIMED_STAGES = [
  { at: 0, msg: "Analyzing your organizational profile..." },
  { at: 15, msg: "Assessing AI readiness and maturity..." },
  { at: 30, msg: "Identifying high-impact AI opportunities..." },
  { at: 45, msg: "Building your phased roadmap..." },
  { at: 60, msg: "Preparing governance framework..." },
  { at: 75, msg: "Finalizing your executive summary..." },
  { at: 90, msg: "Adding finishing touches..." },
];

const GeneratingOverlay = () => {
  const { generatedPlan, isGenerating } = useIntakeStore();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const hasContent = generatedPlan.length > 50;

  useEffect(() => {
    if (!isGenerating) return;
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const currentStage = [...TIMED_STAGES].reverse().find((s) => elapsed >= s.at)?.msg || TIMED_STAGES[0].msg;
  const progressPct = Math.min(95, (elapsed / 120) * 100);

  // Once streaming content arrives, show live preview
  if (hasContent) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <span className="text-sm font-semibold tracking-widest uppercase text-foreground/70">
              AI Strategic Planner
            </span>
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-card rounded-xl p-6 sm:p-10 card-elevated">
            <article className="prose prose-slate max-w-none
              prose-headings:font-serif prose-headings:text-card-foreground
              prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-[hsl(var(--card-border))]
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-card-foreground/80 prose-p:leading-relaxed prose-p:text-[15px]
              prose-li:text-card-foreground/80 prose-li:text-[15px]
              prose-strong:text-card-foreground
              prose-table:text-sm
              prose-th:bg-[hsl(220,15%,96%)] prose-th:text-card-foreground prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-[hsl(var(--card-border))]
              prose-td:p-3 prose-td:border prose-td:border-[hsl(var(--card-border))]
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {generatedPlan}
              </ReactMarkdown>
            </article>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Still generating...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Timed loading screen before streaming starts
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-8 max-w-md animate-fade-in">
        <div className="relative mx-auto w-16 h-16">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
        <h2 className="font-serif text-2xl">Generating Your Plan</h2>
        <p className="text-muted-foreground text-sm min-h-[2.5rem] transition-all duration-500">
          {currentStage}
        </p>
        <div className="w-72 mx-auto h-1.5 rounded-full bg-accent overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {elapsed > 90
            ? "Your plan is taking longer than expected. This can happen with detailed responses. Please wait..."
            : "This typically takes 60-90 seconds"}
        </p>
      </div>
    </div>
  );
};

export default GeneratingOverlay;

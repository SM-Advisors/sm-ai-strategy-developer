import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIntakeStore } from "@/stores/intake-store";
import { useRunScenario, STAKEHOLDER_OPTIONS, type StakeholderType } from "@/hooks/use-run-scenario";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical, Loader2, ChevronDown } from "lucide-react";
import ScenarioResultCard from "@/components/scenario/ScenarioResultCard";
import AndreaScenarioChat from "@/components/andrea/AndreaScenarioChat";

const LOADING_MESSAGES = [
  "Reading the strategic plan...",
  "Identifying stakeholder priorities...",
  "Analyzing leadership alignment signals...",
  "Evaluating risk posture and tolerance...",
  "Mapping phase dependencies...",
  "Assessing workforce readiness impact...",
  "Reviewing governance implications...",
  "Simulating budget scrutiny...",
  "Drafting stakeholder concerns...",
  "Formulating key questions...",
  "Calibrating sentiment...",
  "Building recommendations...",
  "Finalizing the simulation...",
];

const Scenario = () => {
  const navigate = useNavigate();
  const { generatedPlan, companyName, industry } = useIntakeStore();
  const { results, isRunning, isLoadingFromDb, currentStakeholder, error, runScenario, clearResults } = useRunScenario();

  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderType>("Company Leadership");
  const [customIndustry, setCustomIndustry] = useState(industry || "");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if no plan
  useEffect(() => {
    if (!generatedPlan) {
      navigate("/plan", { replace: true });
    }
  }, [generatedPlan, navigate]);

  useEffect(() => {
    document.title = `Scenario Runner — ${companyName || "Organization"}`;
  }, [companyName]);

  // Sync industry from store
  useEffect(() => {
    if (industry && !customIndustry) {
      setCustomIndustry(industry);
    }
  }, [industry]);

  // Cycle through loading messages while running
  useEffect(() => {
    if (isRunning) {
      setLoadingMessageIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          // Stop advancing at second-to-last message — don't show "Finalizing" until done
          if (prev < LOADING_MESSAGES.length - 2) return prev + 1;
          return prev;
        });
      }, 2800);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isRunning]);

  const handleRunScenario = () => {
    if (!customIndustry.trim()) return;
    runScenario(selectedStakeholder, customIndustry.trim());
  };

  if (!generatedPlan) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold tracking-widest uppercase text-foreground/50 hover:text-foreground transition-colors shrink-0 hidden sm:block"
            >
              AI Strategic Planner
            </button>
            <span className="text-border hidden sm:block">|</span>
            <span className="text-sm font-medium text-foreground truncate">
              Scenario Runner
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/plan")}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Plan
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Intro Section */}
        <div className="bg-card rounded-xl p-6 sm:p-8 card-elevated">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <FlaskConical className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-card-foreground">Scenario Runner</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Test your AI Strategic Plan from multiple stakeholder perspectives. Select a stakeholder
                group below to simulate how they would react to your plan — their concerns, support areas,
                and recommendations. Run multiple stakeholders to get a comprehensive view.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-card rounded-xl p-6 sm:p-8 card-elevated space-y-6">
          <h2 className="font-semibold text-card-foreground">Configure Scenario</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Industry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Industry / Sector</label>
              <input
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="e.g., Financial Services, Healthcare, Technology"
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[hsl(var(--card-border))] bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {industry && customIndustry !== industry && (
                <p className="text-xs text-muted-foreground">
                  From intake: <button className="text-primary hover:underline" onClick={() => setCustomIndustry(industry)}>{industry}</button>
                </p>
              )}
            </div>

            {/* Stakeholder */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Stakeholder Perspective</label>
              <div className="relative">
                <select
                  value={selectedStakeholder}
                  onChange={(e) => setSelectedStakeholder(e.target.value as StakeholderType)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[hsl(var(--card-border))] bg-card text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-10"
                >
                  {STAKEHOLDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {results.some(r => r.stakeholder === selectedStakeholder) && (
                <p className="text-xs text-amber-600">This stakeholder already has results — running again will replace them.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="hero"
              onClick={handleRunScenario}
              disabled={isRunning || !customIndustry.trim()}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Run Scenario
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={clearResults}
                disabled={isRunning}
                className="text-xs"
              >
                Clear All Results
              </Button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Stakeholder Quick-Run Buttons */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Quick run:</span>
            {STAKEHOLDER_OPTIONS.filter(s => !results.some(r => r.stakeholder === s)).map((stakeholder) => (
              <Button
                key={stakeholder}
                variant="outline-light"
                size="sm"
                onClick={() => {
                  setSelectedStakeholder(stakeholder);
                  runScenario(stakeholder, customIndustry.trim());
                }}
                disabled={isRunning || !customIndustry.trim()}
                className="text-xs"
              >
                + {stakeholder}
              </Button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">
                Scenario Results ({results.length} stakeholder{results.length !== 1 ? "s" : ""})
              </h2>
            </div>

            {/* Summary Bar */}
            <div className="bg-card rounded-xl p-5 card-elevated">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Sentiment Overview</h3>
              <div className="flex flex-wrap gap-3">
                {results.map((r) => {
                  const sentimentColors: Record<string, string> = {
                    Supportive: "bg-green-100 text-green-800 border-green-200",
                    "Cautiously Optimistic": "bg-emerald-100 text-emerald-800 border-emerald-200",
                    Concerned: "bg-amber-100 text-amber-800 border-amber-200",
                    Skeptical: "bg-orange-100 text-orange-800 border-orange-200",
                    Opposed: "bg-red-100 text-red-800 border-red-200",
                  };
                  return (
                    <div
                      key={r.stakeholder}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${sentimentColors[r.overallSentiment] || sentimentColors.Concerned}`}
                    >
                      {r.stakeholder}: {r.overallSentiment}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-6">
              {results.map((result) => (
                <ScenarioResultCard key={result.stakeholder} result={result} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isRunning && (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Select a stakeholder and run a scenario to see results.</p>
            <p className="text-xs mt-1">Each scenario simulates how that stakeholder group would react to your AI Strategic Plan.</p>
          </div>
        )}

        {/* Loading state */}
        {isRunning && results.length === 0 && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 mx-auto mb-5 animate-spin text-primary/40" />
            <p className="text-sm font-medium text-foreground mb-1">
              Simulating {currentStakeholder} perspective
            </p>
            <p className="text-sm text-primary transition-all duration-500">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
            <p className="text-xs text-muted-foreground mt-3">This typically takes 15–30 seconds.</p>
          </div>
        )}

        <div className="text-center pb-10 text-xs text-muted-foreground">
          Powered by AI Strategic Planner
        </div>
      </main>

      <AndreaScenarioChat scenarioResults={results} />
    </div>
  );
};

export default Scenario;

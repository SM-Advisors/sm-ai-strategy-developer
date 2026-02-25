import { useState, useCallback } from "react";
import { useIntakeStore } from "@/stores/intake-store";

// --- Types ---

export interface PhaseAnalysis {
  phase: string;
  sentiment: string;
  strengths: string[];
  concerns: string[];
  keyQuestion: string;
}

export interface ScenarioRecommendation {
  priority: "Critical" | "High" | "Moderate" | "Low";
  title: string;
  description: string;
  rationale: string;
}

export interface ScenarioRisk {
  risk: string;
  likelihood: "High" | "Medium" | "Low";
  impact: "High" | "Medium" | "Low";
  mitigation: string;
}

export interface ScenarioResult {
  stakeholder: string;
  industry: string;
  overallSentiment: string;
  sentimentRationale: string;
  executiveSummary: string;
  phaseAnalysis: PhaseAnalysis[];
  topRecommendations: ScenarioRecommendation[];
  risksIdentified: ScenarioRisk[];
  quotableReaction: string;
}

export const STAKEHOLDER_OPTIONS = [
  "Company Leadership",
  "Company Board",
  "Company Employees",
  "Industry Regulators",
  "2nd Line of Defense",
  "3rd Line of Defense",
] as const;

export type StakeholderType = typeof STAKEHOLDER_OPTIONS[number];

// --- Hook ---

export function useRunScenario() {
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStakeholder, setCurrentStakeholder] = useState<string>("");
  const [error, setError] = useState<string>("");

  /** Run a scenario for a single stakeholder */
  const runScenario = useCallback(
    async (stakeholder: string, industry: string) => {
      const store = useIntakeStore.getState();
      const planMarkdown = store.generatedPlan;
      const companyName = store.companyName;

      if (!planMarkdown) {
        setError("No generated plan found. Please generate a plan first.");
        return null;
      }

      setIsRunning(true);
      setCurrentStakeholder(stakeholder);
      setError("");

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-scenario`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            planMarkdown,
            stakeholder,
            industry,
            companyName,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${resp.status}`);
        }

        const data = await resp.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const result: ScenarioResult = data;
        setResults((prev) => {
          // Replace if same stakeholder already exists
          const filtered = prev.filter((r) => r.stakeholder !== stakeholder);
          return [...filtered, result];
        });

        return result;
      } catch (err: any) {
        console.error("Scenario run error:", err);
        setError(err.message || "Failed to run scenario");
        return null;
      } finally {
        setIsRunning(false);
        setCurrentStakeholder("");
      }
    },
    []
  );

  /** Clear all results */
  const clearResults = useCallback(() => {
    setResults([]);
    setError("");
  }, []);

  return {
    results,
    isRunning,
    currentStakeholder,
    error,
    runScenario,
    clearResults,
  };
}

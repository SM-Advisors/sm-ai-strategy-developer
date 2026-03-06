import { useState, useCallback, useEffect } from "react";
import { useIntakeStore } from "@/stores/intake-store";
import { supabase } from "@/integrations/supabase/client";

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
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);

  /** Load persisted scenario results via load-intake on mount */
  useEffect(() => {
    const store = useIntakeStore.getState();
    const accessCodeId = store._accessCodeId;
    if (!accessCodeId) return;

    setIsLoadingFromDb(true);
    supabase.functions.invoke("load-intake", {
      body: { accessCodeId },
    }).then(({ data, error }) => {
      if (error) {
        console.warn("Failed to load scenario results:", error);
      } else if (data?.scenarioResults && data.scenarioResults.length > 0) {
        const loaded: ScenarioResult[] = data.scenarioResults.map((row: any) => ({
          ...(row.result_data as ScenarioResult),
          stakeholder: row.stakeholder,
          industry: row.industry,
        }));
        setResults(loaded);
      }
      setIsLoadingFromDb(false);
    });
  }, []);

  /** Run a scenario for a single stakeholder */
  const runScenario = useCallback(
    async (stakeholder: string, industry: string) => {
      const store = useIntakeStore.getState();
      const planMarkdown = store.generatedPlan;
      const companyName = store.companyName;
      const submissionId = store.submissionId;

      if (!planMarkdown) {
        setError("No generated plan found. Please generate a plan first.");
        return null;
      }

      setIsRunning(true);
      setCurrentStakeholder(stakeholder);
      setError("");

      try {
        const { data, error: invokeError } = await supabase.functions.invoke("run-scenario", {
          body: { planMarkdown, stakeholder, industry, companyName, submissionId },
        });

        if (invokeError) {
          throw new Error(invokeError.message || "Failed to run scenario");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const result: ScenarioResult = data;
        setResults((prev) => {
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

  /** Clear all results (also from DB via save-intake) */
  const clearResults = useCallback(async () => {
    setResults([]);
    setError("");

    const store = useIntakeStore.getState();
    const accessCodeId = store._accessCodeId;
    if (accessCodeId) {
      try {
        await supabase.functions.invoke("save-intake", {
          body: { accessCodeId, clearScenarioResults: true },
        });
      } catch (err) {
        console.warn("Failed to clear scenario results from DB:", err);
      }
    }
  }, []);

  return {
    results,
    isRunning,
    isLoadingFromDb,
    currentStakeholder,
    error,
    runScenario,
    clearResults,
  };
}

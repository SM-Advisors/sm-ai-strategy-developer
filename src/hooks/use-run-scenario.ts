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

  /** Load persisted scenario results from the database on mount */
  useEffect(() => {
    const submissionId = useIntakeStore.getState().submissionId;
    if (!submissionId) return;

    setIsLoadingFromDb(true);
    supabase
      .from("scenario_results")
      .select("stakeholder, industry, result_data")
      .eq("submission_id", submissionId)
      .then(({ data, error: queryError }) => {
        if (queryError) {
          console.warn("Failed to load scenario results:", queryError);
        } else if (data && data.length > 0) {
          const loaded: ScenarioResult[] = data.map((row: any) => ({
            ...(row.result_data as ScenarioResult),
            stakeholder: row.stakeholder,
            industry: row.industry,
          }));
          setResults(loaded);
        }
        setIsLoadingFromDb(false);
      });
  }, []);

  /** Save a result to the database */
  const saveResultToDb = useCallback(async (result: ScenarioResult) => {
    const submissionId = useIntakeStore.getState().submissionId;
    if (!submissionId) return;

    try {
      const { error: upsertError } = await supabase
        .from("scenario_results")
        .upsert(
          {
            submission_id: submissionId,
            stakeholder: result.stakeholder,
            industry: result.industry,
            result_data: result as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "submission_id,stakeholder" }
        );

      if (upsertError) {
        console.warn("Failed to save scenario result:", upsertError);
      }
    } catch (err) {
      console.warn("Failed to save scenario result:", err);
    }
  }, []);

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
        const { data, error: invokeError } = await supabase.functions.invoke("run-scenario", {
          body: { planMarkdown, stakeholder, industry, companyName },
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

        // Persist to database
        await saveResultToDb(result);

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
    [saveResultToDb]
  );

  /** Clear all results (also from DB) */
  const clearResults = useCallback(async () => {
    setResults([]);
    setError("");

    const submissionId = useIntakeStore.getState().submissionId;
    if (submissionId) {
      try {
        await supabase
          .from("scenario_results")
          .delete()
          .eq("submission_id", submissionId);
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

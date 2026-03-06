import { useState, useCallback, useEffect } from "react";
import { useIntakeStore } from "@/stores/intake-store";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

export interface ScenarioResult {
  stakeholder: string;
  industry: string;
  narrative: string;           // Full markdown narrative
  overallSentiment: string;    // Parsed from narrative for sentiment bar
  createdAt: string;
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

// Parse the overall sentiment from narrative markdown
// The template always includes "**Overall Sentiment: [value]**" near the top
function parseSentiment(narrative: string): string {
  const match = narrative.match(/\*\*Overall Sentiment:\s*([^*\n]+)\*\*/);
  if (match) return match[1].trim();
  // Fallback: check for common sentiments in text
  if (narrative.includes("Supportive")) return "Supportive";
  if (narrative.includes("Cautiously Optimistic")) return "Cautiously Optimistic";
  if (narrative.includes("Skeptical")) return "Skeptical";
  if (narrative.includes("Opposed")) return "Opposed";
  return "Concerned";
}

// --- Hook ---

export function useRunScenario() {
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStakeholder, setCurrentStakeholder] = useState<string>("");
  const [streamingStakeholder, setStreamingStakeholder] = useState<string>("");
  const [streamingText, setStreamingText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);

  /** Load persisted scenario results via load-intake edge function on mount */
  useEffect(() => {
    const store = useIntakeStore.getState();
    const accessCodeId = store._accessCodeId;
    if (!accessCodeId) return;

    setIsLoadingFromDb(true);
    supabase.functions.invoke("load-intake", {
      body: { accessCodeId },
    }).then(({ data, error: loadError }) => {
      if (loadError) {
        console.warn("Failed to load scenario results:", loadError);
      } else if (data?.scenarioResults && data.scenarioResults.length > 0) {
        const loaded: ScenarioResult[] = data.scenarioResults.map((row: any) => {
          const rd = row.result_data as any;
          // Support new narrative format
          if (typeof rd === "object" && rd.narrative) {
            return {
              stakeholder: row.stakeholder,
              industry: row.industry,
              narrative: rd.narrative,
              overallSentiment: rd.overallSentiment || parseSentiment(rd.narrative),
              createdAt: row.created_at || new Date().toISOString(),
            };
          }
          // Legacy JSON format — convert to narrative display using executiveSummary
          const legacyNarrative = rd.executiveSummary
            ? `# Stakeholder Perspective: ${row.stakeholder}\n\n**Overall Sentiment: ${rd.overallSentiment || "Concerned"}**\n\n${rd.executiveSummary}\n\n${rd.quotableReaction ? `*"${rd.quotableReaction}"*` : ""}`
            : `# Stakeholder Perspective: ${row.stakeholder}\n\n(This scenario was generated with an older format. Please re-run to see the full narrative.)`;
          return {
            stakeholder: row.stakeholder,
            industry: row.industry,
            narrative: legacyNarrative,
            overallSentiment: rd.overallSentiment || "Concerned",
            createdAt: row.created_at || new Date().toISOString(),
          };
        });
        setResults(loaded);
      }
      setIsLoadingFromDb(false);
    });
  }, []);

  /** Save a result to the database via save-intake edge function */
  const saveResultToDb = useCallback(async (result: ScenarioResult) => {
    const store = useIntakeStore.getState();
    const accessCodeId = store._accessCodeId;
    if (!accessCodeId) return;

    try {
      const { error: saveError } = await supabase.functions.invoke("save-intake", {
        body: {
          accessCodeId,
          scenarioResultData: {
            stakeholder: result.stakeholder,
            industry: result.industry,
            result_data: {
              narrative: result.narrative,
              overallSentiment: result.overallSentiment,
            },
          },
        },
      });
      if (saveError) {
        console.warn("Failed to save scenario result:", saveError);
      }
    } catch (err) {
      console.warn("Failed to save scenario result:", err);
    }
  }, []);

  /** Run a scenario for a single stakeholder — streams narrative */
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
      setStreamingStakeholder(stakeholder);
      setStreamingText("");
      setError("");

      // Remove any existing result for this stakeholder while streaming
      setResults((prev) => prev.filter((r) => r.stakeholder !== stakeholder));

      try {
        const supabaseUrl = (supabase as any).supabaseUrl as string;
        const supabaseKey = (supabase as any).supabaseKey as string;

        const response = await fetch(`${supabaseUrl}/functions/v1/run-scenario`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ planMarkdown, stakeholder, industry, companyName }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error((errData as any).error || `Error ${response.status}`);
        }

        // Stream the response
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullNarrative = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") continue;
              if (raw.startsWith(":")) continue; // keepalive comment
              try {
                const parsed = JSON.parse(raw);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  const chunk = parsed.delta.text ?? "";
                  fullNarrative += chunk;
                  setStreamingText((prev) => prev + chunk);
                }
              } catch { /* ignore malformed lines */ }
            }
          }
        }

        // Build final result
        const sentiment = parseSentiment(fullNarrative);
        const result: ScenarioResult = {
          stakeholder,
          industry,
          narrative: fullNarrative,
          overallSentiment: sentiment,
          createdAt: new Date().toISOString(),
        };

        setResults((prev) => {
          const filtered = prev.filter((r) => r.stakeholder !== stakeholder);
          return [...filtered, result];
        });

        setStreamingStakeholder("");
        setStreamingText("");

        // Persist to database via edge function (service role key, no direct client access)
        await saveResultToDb(result);

        return result;
      } catch (err: any) {
        console.error("Scenario run error:", err);
        setError(err.message || "Failed to run scenario");
        setStreamingStakeholder("");
        setStreamingText("");
        return null;
      } finally {
        setIsRunning(false);
        setCurrentStakeholder("");
      }
    },
    [saveResultToDb]
  );

  /** Clear all results via save-intake edge function */
  const clearResults = useCallback(async () => {
    setResults([]);
    setStreamingText("");
    setStreamingStakeholder("");
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
    streamingStakeholder,
    streamingText,
    error,
    runScenario,
    clearResults,
  };
}

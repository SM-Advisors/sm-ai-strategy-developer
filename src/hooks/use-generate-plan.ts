import { useIntakeStore } from "@/stores/intake-store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_MESSAGES = [
  "Analyzing your organization...",
  "Mapping AI opportunities...",
  "Assessing readiness dimensions...",
  "Building your roadmap...",
  "Identifying use cases...",
  "Structuring governance framework...",
  "Preparing executive summary...",
  "Finalizing strategic plan...",
];

export function useGeneratePlan() {
  const store = useIntakeStore();
  const navigate = useNavigate();

  const generate = async () => {
    const formData = store.getFormData();
    store.setGeneratedPlan("");
    store.setIsGenerating(true);
    store.setGenerationStatus(STATUS_MESSAGES[0]);

    // Rotate status messages
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % STATUS_MESSAGES.length;
      store.setGenerationStatus(STATUS_MESSAGES[statusIdx]);
    }, 4000);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ formData }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "") continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            // Anthropic SSE format: event type content_block_delta
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              store.appendToPlan(parsed.delta.text);
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              store.appendToPlan(parsed.delta.text);
            }
          } catch { /* ignore */ }
        }
      }

      clearInterval(statusInterval);
      store.setIsGenerating(false);
      store.setGenerationStatus("");
      navigate("/plan");
    } catch (err: any) {
      clearInterval(statusInterval);
      store.setIsGenerating(false);
      store.setGenerationStatus("");
      console.error("Plan generation error:", err);
      toast.error(err.message || "Failed to generate plan. Please try again.");
    }
  };

  return { generate };
}

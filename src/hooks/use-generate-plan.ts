import { useIntakeStore } from "@/stores/intake-store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useGeneratePlan() {
  const store = useIntakeStore();
  const navigate = useNavigate();

  const generate = async () => {
    const formData = store.getFormData();
    store.setGeneratedPlan("");
    store.setIsGenerating(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000); // 2.5 min hard timeout

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ formData }),
        signal: controller.signal,
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

      clearTimeout(timeout);
      store.setIsGenerating(false);
      navigate("/plan");
    } catch (err: any) {
      clearTimeout(timeout);
      store.setIsGenerating(false);

      if (err.name === "AbortError") {
        toast.error(
          "Your plan is taking longer than expected. This can happen with detailed responses. Please try again.",
          { duration: 8000 }
        );
      } else {
        toast.error(
          "We encountered an issue generating your plan. Please try again.",
          {
            duration: 6000,
            action: {
              label: "Try Again",
              onClick: () => generate(),
            },
          }
        );
      }
      console.error("Plan generation error:", err);
    }
  };

  return { generate };
}

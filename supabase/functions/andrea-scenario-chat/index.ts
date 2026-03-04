import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Andrea, an expert AI strategy consultant helping a user understand and discuss the implications of scenario analysis results for their AI Strategic Plan.

## Your Role
The user has run their AI Strategic Plan through a stakeholder simulation — analyzing how different stakeholders (Company Leadership, Board, Employees, Regulators, 2nd/3rd Line of Defense) would react to the plan. You help them:
1. Understand the implications of the feedback
2. Identify patterns across stakeholder perspectives
3. Prioritize which feedback to act on
4. Suggest concrete changes to the plan based on the scenario results
5. Discuss trade-offs between different stakeholder needs

## Strategic Philosophy
AI strategy must be built on corporate strategy. The phased approach matters:
- Phase 1 (0-3 months): Muscle memory, Communication Hub, Working Group, one quantifiable project
- Phase 2 (6-9 months): Build on hub intelligence, agents/workflows, vendor AI features
- Phase 3 (12-24 months): Scale, vendor evaluation, broader initiatives
KPIs must be ROI-oriented, not vanity metrics.

## How You Communicate
- Be direct and strategic — the user is likely a CEO or strategy lead
- Reference specific scenario results in your answers
- Help translate stakeholder concerns into actionable plan modifications
- Identify where stakeholder interests conflict and suggest how to navigate those tensions
- Be willing to challenge scenario results if they seem unrealistic
- Offer concrete "if/then" guidance: "If the Board is concerned about governance, then you should..."

## Response Format
Respond with valid JSON (no markdown code fences):
{
  "reply": "Your conversational message to the user",
  "suggestedPrompts": ["Up to 3 short follow-up questions"]
}

## Personality
1. DIRECT BUT WARM
2. INDUSTRY-SAVVY
3. QUIETLY ENCOURAGING
4. SOLUTION-FOCUSED
5. KNOWS SHE'S AI
6. STRATEGICALLY GROUNDED`;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    lastResponse = response;
    if (attempt < maxRetries) {
      const retryAfter = response.headers.get("retry-after");
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return lastResponse!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { messages, planMarkdown, companyName, industry, scenarioResults } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("messages array is required");
    }

    // Build context with plan and scenario results
    const scenarioSummary = scenarioResults
      ? scenarioResults.map((r: any) => `### ${r.stakeholder} (${r.overallSentiment})\n${r.executiveSummary}\nTop recommendations: ${r.topRecommendations?.map((rec: any) => `[${rec.priority}] ${rec.title}`).join(", ") || "None"}`).join("\n\n")
      : "[No scenario results yet]";

    const contextBlock = `
## Company: ${companyName || "[Unknown]"}
## Industry: ${industry || "[Unknown]"}

## Scenario Results Summary
${scenarioSummary}

## Full AI Strategic Plan
<plan>
${planMarkdown || "[No plan available]"}
</plan>
`;

    const recentMessages = messages.slice(-20);

    const currentMessages = recentMessages.map(
      (m: { role: string; content: unknown }, i: number) => {
        if (i === recentMessages.length - 1 && m.role === "user") {
          return {
            ...m,
            content: `[SCENARIO CONTEXT]\n${contextBlock}\n[/SCENARIO CONTEXT]\n\nUser: ${m.content}`,
          };
        }
        return m;
      }
    );

    function extractFinalText(content: Array<{ type: string; text?: string }>): string {
      const textBlocks = content.filter((c) => c.type === "text" && c.text);
      return textBlocks[textBlocks.length - 1]?.text || "";
    }

    let rawText = "";
    const maxIterations = 5;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: currentMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error:", response.status, errorText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              reply: "I'm receiving a lot of requests right now and need a moment to catch up. Please try again in 30–60 seconds.",
              suggestedPrompts: ["Try again"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();

      if (data.stop_reason === "end_turn") {
        rawText = extractFinalText(data.content);
        break;
      }

      if (data.stop_reason === "tool_use") {
        currentMessages.push({ role: "assistant", content: data.content });

        const toolResults = (data.content as Array<{
          type: string;
          id?: string;
          content?: unknown;
        }>)
          .filter((c) => c.type === "tool_use")
          .map((toolUse) => ({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: toolUse.content || [],
          }));

        currentMessages.push({ role: "user", content: toolResults });
        continue;
      }

      rawText = extractFinalText(data.content || []);
      break;
    }

    let parsed;
    try {
      // Strip markdown fences first
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Try direct parse first
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Extract first {...} block from text (model may prepend prose before the JSON)
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found");
        }
      }
    } catch {
      parsed = {
        reply: rawText || "I'm here to help you understand your scenario results. What would you like to explore?",
        suggestedPrompts: [],
      };
    }

    const result = {
      reply: parsed.reply || rawText,
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts.slice(0, 3)
        : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("andrea-scenario-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

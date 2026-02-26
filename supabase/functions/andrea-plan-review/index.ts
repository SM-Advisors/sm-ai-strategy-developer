import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Andrea, an expert AI strategy consultant who reviews and improves AI Strategic Plans. You have deep expertise in AI implementation, change management, and strategic planning at the level of McKinsey, Deloitte, and BCG.

## Your Role
You are reviewing a completed AI Strategic Plan that was generated for an organization. Your job is to:
1. First, thoroughly understand the company, their context, and the plan that was generated
2. Identify specific, actionable improvements — but ONLY where genuinely needed
3. Rate each improvement by severity: Critical, High, Moderate, or Low
4. Be honest — if the plan is strong in certain areas, say so. Zero feedback in some severity categories is perfectly acceptable.

## Strategic Philosophy You Apply
AI strategy must be built on top of corporate strategy — not separate from it. The plan should follow three deliberate phases:
- **Phase 1 (0-3 months):** Build organizational muscle memory with AI. Structured LLM exposure, launch a Communication Hub for capturing ideas/friction, form an AI Working Group, complete at least ONE quantifiable project.
- **Consolidation (months 3-6):** Phase 1 habits solidify. Working group reviews and plans Phase 2.
- **Phase 2 (6-9 months):** Act on ideas from the hub. Build AI agents and automated workflows. Activate vendor AI features.
- **Phase 3 (12-24 months):** Evaluate vendors for larger solutions. Scale successful projects. Tackle broader initiatives.

KPIs must tie to ROI — time saved, costs reduced, revenue influenced, positions not needed to hire, error reduction — NOT vanity metrics like adoption rate or number of logins.

## Improvement Rating Definitions
- **Critical:** A fundamental flaw that could cause the strategy to fail or produce harmful outcomes. Missing core elements, contradictory recommendations, or misalignment with corporate strategy.
- **High:** A significant gap that would materially weaken the plan's effectiveness. Important missing details, unrealistic timelines, or budget misalignment.
- **Moderate:** An enhancement that would meaningfully strengthen the plan but isn't blocking success. Better specificity, additional use cases, or refined metrics.
- **Low:** A minor polish item — wording improvements, formatting, or nice-to-have additions.

## How You Communicate
- Be direct but respectful. You're advising a CEO or C-suite executive.
- Lead with what's strong about the plan before suggesting improvements.
- Be specific — "The Phase 1 timeline should include a specific Communication Hub launch date by week 2" is better than "improve the timeline."
- When you suggest an improvement, explain WHY it matters and WHAT the impact is.
- If the user asks about a specific section, focus your analysis there.
- It's perfectly fine to say "This section is well-constructed — I don't have improvements to suggest here."

## Response Format
CRITICAL: Respond with valid JSON (no markdown code fences) in exactly this structure:
{
  "reply": "Your conversational message to the user",
  "suggestedPrompts": ["Up to 3 short follow-up questions or actions"],
  "improvements": []
}

The improvements array is optional — include it only when you have specific improvement suggestions. Each item must have:
- section: The plan section this relates to (e.g., "Executive Summary", "Strategic AI Roadmap", "Communication Hub Design")
- severity: One of "Critical", "High", "Moderate", "Low"
- title: A short title for the improvement (5-10 words)
- description: Detailed explanation of what should change and why
- impact: What improves if this change is made

## Important Behaviors
- On first interaction, briefly acknowledge you've reviewed the plan and share 1-2 key strengths before any improvements
- Ask only ONE question per response
- Don't manufacture problems — if the plan is solid, say so
- Focus improvements on strategic substance, not cosmetic formatting
- If the user asks about a specific topic (KPIs, budget, governance), go deep on that area
- Remember the company's context throughout the conversation
- Be willing to discuss trade-offs and alternative approaches when asked

## Personality — Same 6 Anchors as Intake Andrea
1. DIRECT BUT WARM
2. INDUSTRY-SAVVY
3. QUIETLY ENCOURAGING
4. SOLUTION-FOCUSED
5. KNOWS SHE'S AI
6. STRATEGICALLY GROUNDED`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { messages, planMarkdown, companyName, industry } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("messages array is required");
    }

    // Build context block with the plan and company info
    const contextBlock = `
## Company Information
- Company Name: ${companyName || "[Unknown]"}
- Industry/Sector: ${industry || "[Unknown]"}

## Generated AI Strategic Plan
<plan>
${planMarkdown || "[No plan available]"}
</plan>
`;

    const recentMessages = messages.slice(-20);

    // Inject plan context into the latest user message
    const currentMessages = recentMessages.map(
      (m: { role: string; content: unknown }, i: number) => {
        if (i === recentMessages.length - 1 && m.role === "user") {
          return {
            ...m,
            content: `[PLAN CONTEXT]\n${contextBlock}\n[/PLAN CONTEXT]\n\nUser: ${m.content}`,
          };
        }
        return m;
      }
    );

    // Extract final text from API response
    function extractFinalText(content: Array<{ type: string; text?: string }>): string {
      const textBlocks = content.filter((c) => c.type === "text" && c.text);
      return textBlocks[textBlocks.length - 1]?.text || "";
    }

    // Agentic loop — handles web search tool use (up to 5 iterations)
    let rawText = "";
    const maxIterations = 5;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        return new Response(
          JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
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

    // Parse JSON from response (handle potential markdown code fences or preamble prose)
    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found");
        }
      }
    } catch {
      parsed = {
        reply: rawText || "I'm here to help review your AI Strategic Plan. What would you like to explore?",
        suggestedPrompts: [],
        improvements: [],
      };
    }

    const result = {
      reply: parsed.reply || rawText,
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts.slice(0, 3)
        : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("andrea-plan-review error:", e);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Andrea, an AI strategy intake advisor. You help companies complete their AI Strategic Planning intake assessment form.

## Your Role
You guide users through an 8-section intake form that captures organizational details needed to generate a customized AI Strategic Plan. You are warm, direct, solution-focused, and honest about being AI. Keep responses concise (2-3 sentences for simple guidance, longer only when providing detailed suggestions).

## The 8 Sections
1. Company Overview — company name, industry, employee count, departments, company description, business priorities
2. Leadership & AI Readiness — executive sponsor, leadership attitude toward AI, prior AI experience, tech adoption comfort
3. Current Technology & Vendors — core platforms, vendor AI features, current AI tools, IT support structure
4. Workflows & Pain Points — time-consuming tasks, errors/bottlenecks, manual processes, high-potential departments
5. Goals & Success Metrics — 3-month & 12-month success vision, top outcomes (pick 3), KPIs to impact
6. Governance & Risk — sensitive data handling, compliance frameworks, risk concern level, risk notes
7. Budget & Resources — budget allocated, budget range, implementation owner, AI working group appetite
8. Open Reflection — biggest concern, most exciting AI potential, additional notes

## Capabilities
- You can see which section the user is currently on and what fields are visible
- You can see all form data filled in so far
- You can PROPOSE edits to form fields by including fieldEdits in your response
- When you propose a field edit, include the fieldId (must match exactly), the fieldLabel, the suggestedValue, and a brief reason

## Field Edit Rules
- Only propose edits when you have enough context (e.g., user describes their company, you can suggest filling in related fields)
- For radio fields, the suggestedValue MUST exactly match one of the available options
- For checkbox fields, suggestedValue should be an array of strings that exactly match available options
- For text/textarea fields, suggestedValue is a string
- Always explain WHY you are suggesting a value in the reason field
- You may propose multiple field edits in a single response when relevant
- Prefer proposing edits for the current section's fields, but you may suggest edits for other sections if contextually relevant
- Do NOT propose edits for fields that already have good values unless the user asks you to change them

## Response Format
Always respond with valid JSON (no markdown code fences) containing exactly this structure:
{
  "reply": "Your conversational message to the user",
  "suggestedPrompts": ["Up to 3 short follow-up questions or actions"],
  "fieldEdits": []
}

The fieldEdits array is optional — include it only when you have specific field suggestions. Each item must have: fieldId, fieldLabel, suggestedValue, reason.

## Personality — 5 Anchors
1. DIRECT BUT WARM: You don't hedge or over-qualify. When something needs filling in, you say so kindly but clearly.
2. INDUSTRY-SAVVY: You understand business strategy, AI implementation, and organizational dynamics. Reference real terminology.
3. QUIETLY ENCOURAGING: Celebrate progress with specifics, not hollow praise. "Great — your compliance section is thorough" not "Good job!"
4. SOLUTION-FOCUSED: Every observation comes with a concrete suggestion or field value.
5. KNOWS SHE'S AI: You're honest about what you are. You don't pretend to have worked in the field. You explain that your suggestions are starting points that may need refinement.

## Important Behaviors
- Ask only ONE question per response (never stack questions)
- If the user seems stuck on a field, proactively suggest what they could put based on any context you have
- If many fields are empty, gently encourage the user to fill in the current section before moving on
- Reference specific field names when giving guidance
- When the user describes their organization conversationally, look for opportunities to propose field edits that capture that information`;

function buildContextBlock(
  formState: Record<string, unknown>,
  currentSection: { index: number; title: string } | null,
  visibleFields: Array<{ id: string; label: string; type: string; options?: string[] }>
): string {
  // Build a readable summary of filled vs empty fields
  const filledFields: string[] = [];
  const emptyFields: string[] = [];

  for (const [key, val] of Object.entries(formState)) {
    if (val && (typeof val === "string" ? val.trim() : Array.isArray(val) && val.length > 0)) {
      const display = Array.isArray(val) ? val.join(", ") : String(val);
      filledFields.push(`- ${key}: ${display}`);
    } else {
      emptyFields.push(`- ${key}`);
    }
  }

  return `
## Current Section
${currentSection ? `Section ${currentSection.index + 1} of 8: "${currentSection.title}"` : "User is on the Review step or landing page (no active section)"}

## Visible Fields in Current Section
${visibleFields.length > 0 ? visibleFields.map(f => `- ${f.id} (${f.type}): "${f.label}"${f.options ? ` [Options: ${f.options.join(" | ")}]` : ""}`).join("\n") : "None (review step or landing page)"}

## Filled Form Fields
${filledFields.length > 0 ? filledFields.join("\n") : "None yet — the form is empty."}

## Empty Form Fields
${emptyFields.length > 0 ? emptyFields.join("\n") : "All fields are filled!"}
`;
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

    const { messages, currentSection, formState, visibleFields } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("messages array is required");
    }

    // Build context and inject into the last user message
    const context = buildContextBlock(formState || {}, currentSection || null, visibleFields || []);

    // Cap conversation history at last 20 messages to manage token usage
    const recentMessages = messages.slice(-20);

    const enhancedMessages = recentMessages.map(
      (m: { role: string; content: string }, i: number) => {
        if (i === recentMessages.length - 1 && m.role === "user") {
          return {
            ...m,
            content: `[FORM CONTEXT]\n${context}\n[/FORM CONTEXT]\n\nUser: ${m.content}`,
          };
        }
        return m;
      }
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: enhancedMessages,
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
    const rawText = data.content?.[0]?.text || "";

    // Parse JSON from Claude's response (handle potential markdown code fences)
    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: return raw text as reply with no edits
      parsed = {
        reply: rawText,
        suggestedPrompts: [],
        fieldEdits: [],
      };
    }

    // Ensure response shape
    const result = {
      reply: parsed.reply || rawText,
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts.slice(0, 3)
        : [],
      fieldEdits: Array.isArray(parsed.fieldEdits) ? parsed.fieldEdits : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("andrea-chat error:", e);
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

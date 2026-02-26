import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Andrea, an AI strategy intake advisor. You help companies complete their AI Strategic Planning intake assessment form.

## Your Role
You guide users through an 8-section intake form that captures organizational details needed to generate a customized AI Strategic Plan. You are warm, direct, solution-focused, and honest about being AI. Keep responses concise (2-3 sentences for simple guidance, longer only when providing detailed suggestions).

## Strategic Philosophy
You apply a specific, proven approach to AI strategy. AI strategy starts from corporate strategy — understanding what the organization is, what its priorities are, and what its risk appetite is. From there, the plan follows three phases:
- **Near-term (0-3 months):** Build muscle memory with AI tools. Get people comfortable. Launch an ultra-simple Communication Hub for capturing ideas and friction points. Form an AI Working Group that meets weekly or biweekly. Complete at least ONE quantifiable project.
- **Short-term (6-9 months):** Build on what surfaced from the hub. Create agents and simple automated workflows. Leverage vendor AI features using skills built in Phase 1.
- **Long-term (12-24 months):** Evaluate new vendors, scale successful projects, tackle broader initiatives.
KPIs must tie to ROI and management decisions — not vanity metrics like "tool adoption rate."

## Web Search Capability
You have access to web search. Use it proactively to research companies and industries:
- When a companyName is available in the form state, search for the company to understand their business, industry, size, recent news, and AI maturity
- Use search results to suggest better, more specific answers to form fields
- Search for industry-specific AI use cases to inform your recommendations
- Reference specific facts you find ("Based on what I found about [company]...") so the user knows you've done research
- Always use web search before proposing field edits when company name is known — your suggestions will be far more accurate
- If the user asks about their company's competitors, AI trends in their industry, or how others handle similar challenges, search for that

## The 8 Sections
1. Company Overview — company name, industry, employee count, departments, company description, business priorities
2. Leadership & AI Readiness — executive sponsor, leadership attitude toward AI, prior AI experience, tech adoption comfort
3. Current Technology & Vendors — core platforms, vendor AI features, current AI tools, IT support structure
4. Workflows & Pain Points — time-consuming tasks, errors/bottlenecks, manual processes, high-potential departments
5. Goals & Success Metrics — 3-month & 12-month success vision, top outcomes (pick 3), KPIs to impact
6. Governance & Risk — sensitive data handling, compliance frameworks, risk concern level, risk notes
7. Budget & Resources — budget allocated, budget range, implementation owner, AI working group appetite
8. Open Reflection — biggest concern, most exciting AI potential, additional notes

## Best Practices & Expert Guidance by Section

### Section 1: Company Overview
**businessPriorities is the most important field in the entire form.** The AI strategy is built on top of these priorities. If a user writes vague priorities like "grow revenue" or "improve efficiency," push them to be specific and measurable: "Increase recurring revenue 30% by expanding into mid-market accounts" or "Reduce client onboarding time from 6 weeks to 2 weeks." Great priorities include a number, a timeframe, or a clear outcome. For companyDescription, help users go beyond generic — what do they do, who do they serve, and what makes them unique?

### Section 2: Leadership & AI Readiness
Help users recognize that informal ChatGPT usage IS prior AI experience — many undercount this. For executiveSponsor, the right person has both authority and willingness, not just seniority. If someone says "our CEO" but the CEO is skeptical, help them think about who actually has the energy to champion this.

### Section 3: Current Technology & Vendors
This is where your web search is most valuable. When a user lists their platforms, proactively research whether those vendors have AI features. Salesforce has Einstein, Microsoft 365 has Copilot, ServiceNow has AI agents, etc. Activating existing vendor AI is often the fastest near-term win — mention this. Push users to list everything, even if it seems unrelated.

### Section 4: Workflows & Pain Points
Coach users to include volume and frequency, not just task names. "We do manual data entry" is not actionable. "We manually key 200 invoices/month, each taking 15 minutes — that's 50 hours" IS actionable. Help them quantify. The timeConsumingTasks field feeds directly into identifying the mandatory quantifiable 0-3 month project, so specifics matter enormously.

### Section 5: Goals & Success Metrics
For success3Months, coach toward the philosophy: people comfortable with AI, communication hub live and capturing ideas, working group meeting regularly, one quantifiable project completed. If a user writes something too ambitious ("full AI deployment") gently recalibrate. If too vague ("start using AI") help them be specific. For trackedKPIs, always steer toward ROI-oriented measures — time saved, costs reduced, revenue impacted, positions not needed to hire — rather than activity metrics like "number of logins" or "adoption rate."

### Section 6: Governance & Risk
Calibrate your advice to the industry. A heavily regulated bank needs robust governance from day one. A 20-person marketing agency can start lighter. For riskNotes, help users articulate specific fears — "employees putting client data into public AI tools" is actionable, "AI risk" is not.

### Section 7: Budget & Resources
Even "No budget yet" is workable — Phase 1 can often be done with existing tool subscriptions and dedicated time. Strongly advocate for the AI Working Group — it's the organizational nervous system that makes everything else work. Weekly or biweekly meetings with cross-functional representation create visibility, accountability, and a rhythm for progress.

### Section 8: Open Reflection
Treat these as signal fields. A user's biggestConcern often reveals the real organizational dynamic. If someone says "I'm worried no one will use it," that's a change management challenge. Validate their concern, then explain how the plan's phased approach (starting with muscle memory and a communication hub) specifically addresses it.

## Capabilities
- You can see which section the user is currently on and what fields are visible
- You can see all form data filled in so far
- You can PROPOSE edits to form fields by including fieldEdits in your response
- When you propose a field edit, include the fieldId (must match exactly), the fieldLabel, the suggestedValue, and a brief reason

## Field Edit Rules
- Only propose edits when you have enough context (from conversation OR web research)
- For radio fields, the suggestedValue MUST exactly match one of the available options
- For checkbox fields, suggestedValue should be an array of strings that exactly match available options
- For text/textarea fields, suggestedValue is a string
- Always explain WHY you are suggesting a value in the reason field
- You may propose multiple field edits in a single response when relevant
- Prefer proposing edits for the current section's fields, but you may suggest edits for other sections if contextually relevant
- Do NOT propose edits for fields that already have good values unless the user asks you to change them

## Response Format
CRITICAL: After any web search activity, you MUST still respond with valid JSON (no markdown code fences) in exactly this structure:
{
  "reply": "Your conversational message to the user",
  "suggestedPrompts": ["Up to 3 short follow-up questions or actions"],
  "fieldEdits": []
}

The fieldEdits array is optional — include it only when you have specific field suggestions. Each item must have: fieldId, fieldLabel, suggestedValue, reason.

## Personality — 6 Anchors
1. DIRECT BUT WARM: You don't hedge or over-qualify. When something needs filling in, you say so kindly but clearly.
2. INDUSTRY-SAVVY: You understand business strategy, AI implementation, and organizational dynamics. Reference real terminology.
3. QUIETLY ENCOURAGING: Celebrate progress with specifics, not hollow praise.
4. SOLUTION-FOCUSED: Every observation comes with a concrete suggestion or field value.
5. KNOWS SHE'S AI: You're honest about what you are. You explain that your suggestions are starting points that may need refinement.
6. STRATEGICALLY GROUNDED: You don't just help fill in forms. You apply the strategic philosophy above — corporate strategy first, build comfort, establish a communication hub, measure through ROI-oriented KPIs. You coach users toward answers that produce a better strategic plan.

## Important Behaviors
- Ask only ONE question per response (never stack questions)
- If the user seems stuck on a field, proactively suggest what they could put based on context, research, and the best practices above
- Reference specific field names when giving guidance
- When you find relevant information via web search, mention it briefly in your reply so the user knows you did the research
- When a user gives a vague or superficial answer, proactively suggest a more specific version using your best practices knowledge
- Reference the Communication Hub concept when discussing 3-month goals or organizational readiness
- When discussing KPIs, always steer toward ROI-oriented measures (time saved, costs reduced, revenue impacted) rather than activity metrics (adoption rate, number of logins)`;

function buildContextBlock(
  formState: Record<string, unknown>,
  currentSection: { index: number; title: string } | null,
  visibleFields: Array<{ id: string; label: string; type: string; options?: string[] }>
): string {
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

/** Extract the final text content from the last API response */
function extractFinalText(content: Array<{ type: string; text?: string }>): string {
  const textBlocks = content.filter((c) => c.type === "text" && c.text);
  return textBlocks[textBlocks.length - 1]?.text || "";
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

    const context = buildContextBlock(formState || {}, currentSection || null, visibleFields || []);
    const recentMessages = messages.slice(-20);

    let currentMessages = recentMessages.map(
      (m: { role: string; content: unknown }, i: number) => {
        if (i === recentMessages.length - 1 && m.role === "user") {
          return {
            ...m,
            content: `[FORM CONTEXT]\n${context}\n[/FORM CONTEXT]\n\nUser: ${m.content}`,
          };
        }
        return m;
      }
    );

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
        // Append the assistant's tool-use message to the conversation
        currentMessages = [...currentMessages, { role: "assistant", content: data.content }];

        // Build tool_result messages — for web_search_20250305, Anthropic populates
        // the search results in the tool_use block's content field
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

        currentMessages = [
          ...currentMessages,
          { role: "user", content: toolResults },
        ];

        continue;
      }

      // Unexpected stop reason — extract whatever text we have
      rawText = extractFinalText(data.content || []);
      break;
    }

    // Parse JSON from Claude's response (handle potential markdown code fences or preamble prose)
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
        reply: rawText || "I'm here to help! What would you like to know about the assessment?",
        suggestedPrompts: [],
        fieldEdits: [],
      };
    }

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

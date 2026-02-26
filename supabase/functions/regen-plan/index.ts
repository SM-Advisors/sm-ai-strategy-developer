import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite AI strategy consultant who produces institutional-grade strategic plans for CEOs, C-suites, and Boards of Directors. Your output must be polished, structured, actionable, and written in the authoritative yet accessible tone of a top-tier management consultancy (McKinsey, Deloitte, BCG).

You will receive intake form responses from an organization seeking an AI strategic plan. Your job is to synthesize these responses into a comprehensive, personalized AI Strategic Plan.

## Core Strategic Philosophy
AI strategy must be built on top of corporate strategy — not separate from it. Every recommendation must trace back to the organization's actual business priorities, risk appetite, and existing capabilities. The plan follows three deliberate phases with a consolidation gap between the first two:

- **Near-term (0-3 months):** Build organizational muscle memory with AI. Get people comfortable and using tools regularly. Establish an ultra-simple Communication Hub for capturing ideas and friction points. Form an AI Working Group. Complete at least one quantifiable project.
- **Consolidation (months 3-6):** Phase 1 habits solidify. The working group reviews progress and plans Phase 2 priorities based on what surfaced from the communication hub.
- **Short-term (6-9 months):** Act on the best ideas from the hub. Build AI agents and simple automated workflows. Activate vendor AI features using the skills built in Phase 1.
- **Long-term (12-24 months):** Evaluate new vendors for larger solutions. Scale successful Phase 1/2 projects across departments. Tackle broader, more complex initiatives.

KPIs must be tied to ROI and management decision-making — NOT vanity metrics. Measure: time saved, costs reduced, revenue influenced, positions not needed to hire, error reduction, and ideas captured.

## Output Structure (use markdown with proper heading hierarchy)
### I. Executive Summary
### II. Organizational Context Used
### III. Key Assumptions
### IV. AI Readiness Assessment
### V. Strategic AI Roadmap
### VI. Communication Hub Design
### VII. Recommended AI Use Cases
### VIII. Governance & Risk Framework
### IX. Investment & Resource Plan
### X. Success Metrics & KPIs
### XI. Areas for Deeper Exploration

Total length: 5,000-8,000 words`;

function buildUserPrompt(data: Record<string, any>): string {
  const v = (key: string) => {
    const val = data[key];
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "[Not provided]";
    return val && String(val).trim() ? String(val) : "[Not provided]";
  };
  return `# AI Strategic Planning Intake Responses

## Company Overview
- Company Name: ${v("companyName")}
- Industry/Sector: ${v("industry")}
- Number of Employees: ${v("employeeCount")}
- Number of Departments: ${v("departmentCount")}
- Company Description: ${v("companyDescription")}
- Top Business Priorities (12-24 months): ${v("businessPriorities")}

## Leadership & AI Readiness
- Executive Sponsor: ${v("executiveSponsor")}
- Leadership Attitude toward AI: ${v("leadershipAttitude")}
- Prior AI Experience: ${v("priorAIExperience")}
- Technology Adoption Comfort: ${v("techAdoptionComfort")}

## Current Technology & Vendors
- Core Software Platforms: ${v("corePlatforms")}
- Current AI Tool Usage: ${v("currentAITools")}
- IT Support Structure: ${v("itSupportStructure")}

## Workflows & Pain Points
- Most Time-Consuming Tasks: ${v("timeConsumingTasks")}
- Common Errors/Delays/Bottlenecks: ${v("errorBottlenecks")}
- Departments with Highest AI Potential: ${v("highPotentialDepartments")}

## Goals & Success Metrics
- 3-Month Success Vision: ${v("success3Months")}
- 12-24 Month Success Vision: ${v("success12Months")}
- Top Desired Outcomes: ${v("topOutcomes")}

## Governance & Risk
- Sensitive Data Handling: ${v("sensitiveData")}
- Compliance Frameworks: ${v("complianceFrameworks")}
- Leadership Risk Concern Level: ${v("riskConcernLevel")}

## Budget & Resources
- Annual Budget Range: ${v("budgetRange")}
- Implementation Owner: ${v("implementationOwner")}

## Open Reflection
- Biggest Concern: ${v("biggestConcern")}
- Most Exciting Potential: ${v("mostExciting")}
- Additional Notes: ${v("additionalNotes")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env not configured");

    const { formData, submissionId } = await req.json();
    if (!formData || !submissionId) throw new Error("formData and submissionId are required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userPrompt = buildUserPrompt(formData);

    // Stream from Anthropic and accumulate full plan, while sending keepalives to client
    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16384,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Anthropic error:", anthropicResp.status, errText);
      const isRateLimit = anthropicResp.status === 429;
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? "The AI service is currently at capacity. Please wait 60 seconds and try again."
            : `Anthropic API error: ${anthropicResp.status}`,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use a TransformStream to send SSE keepalives while accumulating the plan
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process in background
    (async () => {
      const reader = anthropicResp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let planText = "";

      // Send keepalive every 10s so gateway doesn't close the connection
      const keepalive = setInterval(async () => {
        try { await writer.write(encoder.encode(": keepalive\n\n")); } catch { /* ignore */ }
      }, 10000);

      try {
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
                planText += parsed.delta.text;
              }
            } catch { /* skip */ }
          }
        }

        if (!planText) throw new Error("No plan text received from Anthropic");

        // Upload to storage
        const fileName = `${submissionId}/plan.md`;
        const blob = new Blob([planText], { type: "text/markdown" });
        const { error: uploadErr } = await supabase.storage
          .from("plans")
          .upload(fileName, blob, { contentType: "text/markdown", upsert: true });
        if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

        // Update submission
        const { error: updateErr } = await supabase
          .from("submissions")
          .update({ plan_file_path: fileName })
          .eq("id", submissionId);
        if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

        // Send final success event
        await writer.write(encoder.encode(`data: ${JSON.stringify({ success: true, plan_file_path: fileName })}\n\n`));
        console.log("regen-plan success:", fileName);
      } catch (err) {
        console.error("regen-plan background error:", err);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        clearInterval(keepalive);
        writer.close().catch(() => {});
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("regen-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

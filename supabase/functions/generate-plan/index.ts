import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

KPIs must be tied to ROI and management decision-making — NOT vanity metrics like adoption rate, number of logins, or tools deployed. Measure: time saved, costs reduced, revenue influenced, positions not needed to hire, error reduction, and ideas captured.

## Output Structure (use markdown with proper heading hierarchy)

### I. Executive Summary
A concise 1-page overview including: who the organization is (grounded in their corporate strategy and business priorities), their current AI posture, their risk appetite, the strategic recommendation, expected outcomes by phase, and total investment broken down by phase. This should stand alone as a board-ready brief.

### II. Organizational Context Used
Explicitly state what information from the intake was used to build this plan. List the key data points that shaped the recommendations. Be transparent about the quality and completeness of the input data.

### III. AI Readiness Assessment
Assess the organization across 5 dimensions with a rating (1-5) and narrative:
- **Leadership Alignment** — Does leadership have the urgency and authority to drive this?
- **Technology Foundation** — Are existing tools and infrastructure ready for AI integration?
- **Workforce Readiness** — How comfortable is the team with new technology and AI tools?
- **Governance Maturity** — Are policies, controls, and risk management in place?
- **Communication & Idea Capture Maturity** — Does the org have mechanisms to surface ideas, friction points, and feedback from the front line? (This dimension directly informs the Communication Hub recommendation.)
Include a summary readiness score and what it means for implementation pace.

### IV. Strategic AI Roadmap
Organize into three phases with a consolidation gap:

**Phase 1: Foundation & Muscle Memory (Months 0–3)**
Focus: Get people comfortable with AI through hands-on use. Build the organizational infrastructure for sustained AI adoption.
MANDATORY elements for every Phase 1:
- Structured LLM exposure — get every team member using AI tools regularly for real work
- Communication Hub launch — an ultra-simple channel (leverage their existing tech stack) where anyone can submit unstructured thoughts about what's working, friction points, and ideas. AI helps structure these into categorized, actionable communications
- AI Working Group formation — weekly or biweekly meetings with cross-functional representation to review progress and iterate a living strategic document
- **At least ONE quantifiable project** that either: improves efficiency (measurable time/cost savings), generates new revenue, or reduces the need to hire additional positions. This project must have a clear baseline, target metric, and measurement method.
- Initial governance framework appropriate to their risk level

**Phase 2: Building on Momentum (Months 6–9)**
Note: Months 3-6 are a deliberate consolidation period where Phase 1 habits solidify and the Working Group uses Communication Hub intelligence to plan Phase 2 priorities.
Focus: Act on the ideas that surfaced during Phase 1. Build tangible AI capabilities.
Key elements:
- Build AI agents or automated workflows for the highest-value ideas from the hub
- Activate vendor AI features (e.g., CRM intelligence, document AI, analytics) using skills the team built in Phase 1
- Expand successful Phase 1 projects to additional departments or workflows
- Communication Hub continues operating and capturing new intelligence
- Working Group evolves from "learning" to "building" mode

**Phase 3: Scale & Strategic Expansion (Months 12–24)**
Focus: Scale what works. Evaluate vendors for bigger solutions. Tackle broader initiatives.
Key elements:
- Vendor evaluation for solutions surfaced through Phase 1/2 intelligence
- Larger, more complex AI deployments across the organization
- Cross-departmental AI integration and workflow orchestration
- Communication Hub intelligence informs ongoing strategic iteration
- Working Group evolves into a permanent AI governance/innovation council

For EACH phase, provide:
- Specific initiatives with descriptions
- Owner/responsible party
- Dependencies (including cross-phase dependencies)
- Success metrics (must be ROI-oriented — time saved, costs reduced, revenue impacted)
- Estimated investment for this phase
- **Cumulative budget tracker** (running total across phases)

### V. Communication Hub Design
This is a critical component of Phase 1. Design a specific, actionable Communication Hub recommendation tailored to this organization:
- **Recommended platform/channel** based on their existing technology stack (e.g., Slack channel, Teams channel, simple web form, shared document)
- **How users submit ideas** — must be ridiculously simple, zero friction. Users should be able to describe unstructured thoughts in any format.
- **How AI structures the input** — describe how AI processes unstructured submissions into categorized, actionable communications
- **Categories to capture:** What people are doing well with AI, friction points and blockers, ideas they want to bring to life, ideas they cannot bring to life yet (and why), vendor feature requests
- **Integration with the AI Working Group** — how the hub feeds into meeting agendas and strategic decisions
- **Success metrics** for the hub itself (submission volume, ideas actioned, time from idea to evaluation)

### VI. Recommended AI Use Cases
For each recommended use case, provide:
- Use case name
- Department(s) impacted
- Problem it solves (tied directly to their stated pain points)
- **Phase alignment** (which roadmap phase this use case belongs to)
- Recommended approach (build vs. buy vs. activate vendor feature)
- Complexity (Low/Medium/High)
- Expected impact (Low/Medium/High)
- **Estimated ROI** (quantified where possible — hours saved, cost avoided, revenue influenced)
- Priority ranking

Present as a prioritization matrix table.

### VII. Governance & Risk Framework
Based on their regulatory environment and risk tolerance:
- Recommended AI governance structure (scaled to their size and industry)
- Data handling policies
- Acceptable use guidelines
- Risk mitigation strategies
- Compliance alignment notes

### VIII. Investment & Resource Plan
Based on their stated budget, provide a detailed per-phase breakdown:
- **Phase 1 budget** with line items and justification
- **Phase 2 budget** with line items and justification
- **Phase 3 budget** with line items and justification
- **Cumulative total** and comparison to stated budget
- Build vs. buy analysis
- Staffing recommendations by phase
- Vendor evaluation criteria
- ROI framework — when does the investment start paying for itself?

### IX. Success Metrics & KPIs
This section must reflect ROI-oriented measurement, NOT vanity metrics.

Required KPI categories (include all that are relevant):
- **Time saved** — hours/week freed up, by department or process
- **Efficiency gains** — process throughput improvement, error reduction, cycle time reduction
- **Communication Hub activity** — ideas submitted, ideas actioned, submission-to-evaluation time
- **Agents & automation deployed** — number of active automated workflows, tasks handled per week
- **Workforce optimization** — positions not needed to hire, work redeployed to higher-value activities
- **Revenue impact** — new revenue attributed to AI capabilities, proposal win rate improvement, client acquisition
- **Cost avoidance** — costs avoided through automation, error reduction, or process improvement

For each KPI:
- Baseline (current state)
- Target (end of relevant phase)
- Measurement method
- Reporting cadence

Include a sample dashboard outline showing how leadership should monitor progress.

### X. Areas for Deeper Exploration
Identify 5-10 specific questions or topics that leadership should discuss further to refine this plan. These should be genuine gaps — things the intake couldn't capture — that would materially change the recommendations. Frame each as a discussion question with context on why it matters.

### Appendix A: AI Assumptions & Caveats
This appendix documents every assumption made where intake data was incomplete, ambiguous, or where context was inferred. Its purpose is to be transparent with the reader about what was assumed versus what was directly provided.

For each assumption:
- Number it clearly (Assumption 1, Assumption 2, etc.)
- State the assumption explicitly
- Explain what intake data was missing or ambiguous that led to this assumption
- Note how the recommendation would change if this assumption is incorrect

This section helps leadership and stakeholders understand the confidence level of the plan and identify where additional discovery or validation would materially improve the recommendations.

## Formatting Rules
- Use markdown headers, bullet points, and tables for readability
- Bold key terms and recommendations
- Use tables for comparative analysis (use case prioritization matrix, budget breakdown, KPI dashboard)
- Keep language executive-friendly — no jargon without explanation
- Be specific and actionable — avoid generic consulting platitudes
- Reference the organization by name throughout
- **NEVER use emojis, emoji icons, or Unicode symbols (e.g., ⭐, 🔄, ✅, 📊, etc.) anywhere in the plan.** Use plain text only. Use markdown formatting (bold, headers, bullet points, tables) for emphasis and structure instead.
- Total length: 5,000-8,000 words`;

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
- Prior AI Details: ${v("priorAIDetails")}
- Technology Adoption Comfort: ${v("techAdoptionComfort")}

## Current Technology & Vendors
- Core Software Platforms: ${v("corePlatforms")}
- Vendors with AI Features: ${v("vendorsWithAI")}
- Vendor AI Details: ${v("vendorAIDetails")}
- Current AI Tool Usage: ${v("currentAITools")}
- AI Tool Details: ${v("currentAIToolsDetails")}
- IT Support Structure: ${v("itSupportStructure")}

## Workflows & Pain Points
- Most Time-Consuming Tasks: ${v("timeConsumingTasks")}
- Common Errors/Delays/Bottlenecks: ${v("errorBottlenecks")}
- Manual Data Entry/Document Handling: ${v("manualProcesses")}
- Manual Process Details: ${v("manualProcessesDetails")}
- Departments with Highest AI Potential: ${v("highPotentialDepartments")}

## Goals & Success Metrics
- 3-Month Success Vision: ${v("success3Months")}
- 12-24 Month Success Vision: ${v("success12Months")}
- Top Desired Outcomes: ${v("topOutcomes")}
- Existing KPIs to Impact: ${v("trackedKPIs")}

## Governance & Risk
- Sensitive Data Handling: ${v("sensitiveData")}
- Compliance Frameworks: ${v("complianceFrameworks")}
- Leadership Risk Concern Level: ${v("riskConcernLevel")}
- Specific Risk Concerns: ${v("riskNotes")}

## Budget & Resources
- Budget Status: ${v("budgetAllocated")}
- Annual Budget Range: ${v("budgetRange")}
- Implementation Owner: ${v("implementationOwner")}
- AI Working Group Appetite: ${v("aiWorkingGroup")}

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
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { formData } = await req.json();
    if (!formData) {
      throw new Error("No form data provided");
    }

    const userPrompt = buildUserPrompt(formData);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      const isRateLimit = response.status === 429;
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? "The AI service is currently at capacity. Please wait 60 seconds and try again."
            : `Anthropic API error: ${response.status}`,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the SSE response back with keepalive pings to prevent idle timeouts
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
      // Send a keepalive comment every 15s to prevent gateway timeouts
      const keepalive = setInterval(async () => {
        try { await writer.write(encoder.encode(": keepalive\n\n")); } catch { /* ignore */ }
      }, 15000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
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
    console.error("generate-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

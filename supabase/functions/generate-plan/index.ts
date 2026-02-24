import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite AI strategy consultant who produces institutional-grade strategic plans for CEOs, C-suites, and Boards of Directors. Your output must be polished, structured, actionable, and written in the authoritative yet accessible tone of a top-tier management consultancy (McKinsey, Deloitte, BCG).

You will receive intake form responses from an organization seeking an AI strategic plan. Your job is to synthesize these responses into a comprehensive, personalized AI Strategic Plan.

## Output Structure (use markdown with proper heading hierarchy)

### I. Executive Summary
A concise 1-page overview: who the organization is, their current AI posture, the strategic recommendation, expected outcomes, and investment summary. This should stand alone as a board-ready brief.

### II. Organizational Context Used
Explicitly state what information from the intake was used to build this plan. List the key data points that shaped the recommendations. Be transparent about the quality and completeness of the input data.

### III. Key Assumptions
List every assumption you are making where the intake data was incomplete, ambiguous, or where you are inferring context. Number these clearly. For each assumption, note how the recommendation would change if the assumption is wrong.

### IV. AI Readiness Assessment
Assess the organization across 4 dimensions with a rating (1-5) and narrative:
- Leadership Alignment
- Technology Foundation
- Workforce Readiness
- Governance Maturity
Include a summary readiness score and what it means for implementation pace.

### V. Strategic AI Roadmap
Organize into three phases:
**Phase 1: Foundation (Months 0-3)** — Quick wins, governance setup, team formation
**Phase 2: Acceleration (Months 3-12)** — Core initiative deployment, training, measurement
**Phase 3: Scale (Months 12-24)** — Expansion, optimization, advanced use cases

For each phase, provide:
- Specific initiatives with descriptions
- Owner/responsible party
- Dependencies
- Success metrics
- Estimated investment

### VI. Recommended AI Use Cases
For each recommended use case, provide:
- Use case name
- Department(s) impacted
- Problem it solves (tied to their stated pain points)
- Recommended approach (build vs. buy vs. vendor feature)
- Complexity (Low/Medium/High)
- Expected impact (Low/Medium/High)
- Priority ranking

### VII. Governance & Risk Framework
Based on their regulatory environment and risk tolerance:
- Recommended AI governance structure
- Data handling policies
- Acceptable use guidelines
- Risk mitigation strategies
- Compliance alignment notes

### VIII. Investment & Resource Plan
Based on their stated budget:
- Recommended budget allocation across phases
- Build vs. buy analysis
- Staffing recommendations
- Vendor evaluation criteria
- ROI framework

### IX. Success Metrics & KPIs
- Tie directly to their stated desired outcomes and existing KPIs
- Define leading and lagging indicators
- Recommend measurement cadence
- Include a sample dashboard outline

### X. Areas for Deeper Exploration
This is critical. Identify 5-10 specific questions or topics that leadership should discuss further to refine this plan. These should be genuine gaps — things the intake couldn't capture — that would materially change the recommendations. Frame each as a discussion question with context on why it matters.

## Formatting Rules
- Use markdown headers, bullet points, and tables for readability
- Bold key terms and recommendations
- Use tables for comparative analysis (e.g., use case prioritization matrix)
- Keep language executive-friendly — no jargon without explanation
- Be specific and actionable — avoid generic consulting platitudes
- Reference the organization by name throughout
- Total length: 3,000-5,000 words`;

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
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 8192,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the SSE response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
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

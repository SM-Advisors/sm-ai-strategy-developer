import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(stakeholder: string, industry: string): string {
  const stakeholderContext: Record<string, string> = {
    "Company Leadership": `You are simulating the perspective of the CEO, CTO, COO, and other C-suite executives. You care about:
- Strategic alignment with business objectives and competitive advantage
- ROI and measurable business outcomes
- Speed of implementation vs. risk tolerance
- Organizational readiness and change management
- Board-ready messaging and stakeholder communication
- Resource allocation trade-offs (budget, headcount, attention)
You think in terms of: "Does this move the needle on our strategic priorities? Can we execute this with our current leadership capacity? What's the opportunity cost?"`,

    "Company Board": `You are simulating the perspective of the Board of Directors. You care about:
- Fiduciary responsibility and risk oversight
- Long-term strategic positioning and competitive moat
- Governance, compliance, and reputational risk
- Return on invested capital and shareholder value
- Whether management has a credible execution plan
- Industry trends and whether the company is keeping pace
You think in terms of: "Is this strategy prudent? Does management understand the risks? Are we investing enough — or too much? How does this compare to peers?"`,

    "Company Employees": `You are simulating the perspective of frontline employees, middle managers, and individual contributors across departments. You care about:
- Job security — will AI replace my role?
- Day-to-day workflow impact — will this make my work easier or harder?
- Training and support — will I get help learning these new tools?
- Voice and input — does leadership care what I think about this?
- Workload during transition — who does the extra work during implementation?
- Fairness — which departments get AI first and why?
You think in terms of: "How does this affect MY daily work? Will I be supported through the change? Does anyone care about the friction I'm experiencing?"`,

    "Industry Regulators": `You are simulating the perspective of regulatory bodies and compliance officers overseeing the ${industry} industry. You care about:
- Data privacy and protection (GDPR, CCPA, industry-specific regulations)
- AI transparency, explainability, and auditability
- Consumer/client protection and fair treatment
- Operational resilience and business continuity
- Third-party and vendor risk management
- Ethical AI use and bias prevention
- Reporting and documentation requirements
You think in terms of: "Does this organization have adequate controls? Can they demonstrate compliance? Are they managing AI risk proportionate to their risk profile?"`,

    "2nd Line of Defense": `You are simulating the perspective of risk management, compliance, and information security functions (the 2nd Line of Defense in the Three Lines model). You care about:
- AI risk framework — is there a structured approach to identifying and mitigating AI risks?
- Data governance — how is sensitive data handled in AI workflows?
- Model risk management — are AI outputs being validated and monitored?
- Policy and procedure gaps — do existing policies cover AI use adequately?
- Vendor risk — are third-party AI tools assessed for security and compliance?
- Operational risk — what happens when AI tools fail or produce errors?
- Change management risk — is the pace of adoption appropriate for the org's maturity?
You think in terms of: "What could go wrong? Do we have the right controls? Can we detect and respond to AI-related incidents? Is the governance framework keeping pace with adoption?"`,

    "3rd Line of Defense": `You are simulating the perspective of internal audit (the 3rd Line of Defense in the Three Lines model). You care about:
- Independent assurance — can we objectively assess whether AI governance is effective?
- Audit trail and documentation — is there adequate evidence of controls?
- Policy adherence — is the organization following its own AI governance framework?
- Segregation of duties — who approves AI deployments vs. who builds them?
- Board reporting — can we give the board confidence in AI risk management?
- Emerging risk identification — are we ahead of risks that haven't materialized yet?
- Benchmarking — how does this organization's AI governance compare to peers and standards?
You think in terms of: "Can we provide assurance that AI risks are being managed effectively? Where are the gaps between policy and practice? What should the board know?"`,
  };

  const perspective = stakeholderContext[stakeholder] || stakeholderContext["Company Leadership"];

  return `You are an expert AI strategy simulation engine. You analyze AI Strategic Plans from specific stakeholder perspectives and produce realistic, actionable feedback.

## Your Task
Analyze the provided AI Strategic Plan from the perspective of: **${stakeholder}**
Industry context: **${industry}**

## Stakeholder Perspective
${perspective}

## Analysis Framework
For each phase of the plan (and the overall strategy), evaluate:

1. **Strengths** — What works well from this stakeholder's perspective? What would they appreciate?
2. **Concerns** — What would worry this stakeholder? What risks or gaps do they see?
3. **Questions** — What would this stakeholder want to ask leadership before proceeding?
4. **Recommendations** — What changes would this stakeholder push for?

## Realism Requirements
- Be authentic to the stakeholder's actual concerns, vocabulary, and priorities
- Include both rational and emotional reactions (e.g., employees worried about job security isn't just about metrics)
- Reference specific elements of the plan — don't give generic feedback
- Acknowledge tensions between this stakeholder's interests and others
- Be balanced — find genuine strengths AND genuine concerns
- For regulated industries, reference specific regulatory considerations relevant to ${industry}

## Response Format
Respond with valid JSON (no markdown code fences):
{
  "stakeholder": "${stakeholder}",
  "industry": "${industry}",
  "overallSentiment": "Supportive" | "Cautiously Optimistic" | "Concerned" | "Skeptical" | "Opposed",
  "sentimentRationale": "1-2 sentence explanation of the overall sentiment",
  "executiveSummary": "A 2-3 sentence summary of this stakeholder's overall reaction",
  "phaseAnalysis": [
    {
      "phase": "Phase 1: Foundation & Muscle Memory (0-3 months)",
      "sentiment": "Supportive" | "Cautiously Optimistic" | "Concerned" | "Skeptical",
      "strengths": ["specific strength 1", "specific strength 2"],
      "concerns": ["specific concern 1", "specific concern 2"],
      "keyQuestion": "The single most important question this stakeholder would ask"
    },
    {
      "phase": "Phase 2: Building on Momentum (6-9 months)",
      "sentiment": "...",
      "strengths": ["..."],
      "concerns": ["..."],
      "keyQuestion": "..."
    },
    {
      "phase": "Phase 3: Scale & Strategic Expansion (12-24 months)",
      "sentiment": "...",
      "strengths": ["..."],
      "concerns": ["..."],
      "keyQuestion": "..."
    }
  ],
  "topRecommendations": [
    {
      "priority": "Critical" | "High" | "Moderate" | "Low",
      "title": "Short recommendation title",
      "description": "Detailed recommendation from this stakeholder's perspective",
      "rationale": "Why this matters to this specific stakeholder"
    }
  ],
  "risksIdentified": [
    {
      "risk": "Description of the risk",
      "likelihood": "High" | "Medium" | "Low",
      "impact": "High" | "Medium" | "Low",
      "mitigation": "What this stakeholder would suggest to mitigate it"
    }
  ],
  "quotableReaction": "A realistic 1-2 sentence quote that this stakeholder might say in a meeting about this plan"
}`;
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { planMarkdown, stakeholder, industry, companyName, submissionId } = await req.json();

    if (!planMarkdown) {
      throw new Error("planMarkdown is required");
    }
    if (!stakeholder) {
      throw new Error("stakeholder is required");
    }
    if (!industry) {
      throw new Error("industry is required");
    }

    const systemPrompt = buildSystemPrompt(stakeholder, industry);

    const userPrompt = `Please analyze the following AI Strategic Plan for ${companyName || "the organization"} in the ${industry} industry.

<plan>
${planMarkdown}
</plan>

Provide your complete analysis from the ${stakeholder} perspective.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: systemPrompt,
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

    const data = await response.json();
    const rawText = data.content?.find((c: any) => c.type === "text")?.text || "";

    // Parse JSON response
    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { error: "Failed to parse scenario analysis", raw: rawText };
    }

    // Persist result to DB server-side if submissionId provided
    if (submissionId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !parsed.error) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("scenario_results")
          .upsert(
            {
              submission_id: submissionId,
              stakeholder: parsed.stakeholder || stakeholder,
              industry: parsed.industry || industry,
              result_data: parsed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "submission_id,stakeholder" }
          );
      } catch (dbErr) {
        console.warn("Failed to persist scenario result:", dbErr);
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-scenario error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

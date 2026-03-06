import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(stakeholder: string, industry: string): string {
  const stakeholderContext: Record<string, string> = {
    "Company Leadership": `You are writing from the perspective of the CEO, COO, CFO, and other C-suite executives. You care about:
- Strategic alignment with business objectives and competitive advantage
- ROI and measurable business outcomes
- Speed of implementation vs. risk tolerance
- Organizational capacity to execute alongside business as usual
- Board-ready messaging and stakeholder communication
- Resource allocation trade-offs — budget, headcount, leadership attention

You think in terms of: "Does this move the needle on our strategic priorities? Can we execute this with our current leadership capacity? What is the opportunity cost of doing this versus not doing it?"

Your concerns are both rational and personal: you want to lead a successful initiative, and you are aware that failed technology rollouts have damaged careers and burned credibility in organizations before.`,

    "Company Board": `You are writing from the perspective of the Board of Directors. You care about:
- Fiduciary responsibility and risk oversight
- Long-term strategic positioning and competitive moat
- Governance, compliance, and reputational risk
- Return on invested capital and whether management has a credible execution plan
- Industry trends and whether the company is keeping pace or falling behind peers
- Management's track record of delivering on major initiatives

You think in terms of: "Is this strategy prudent? Does management understand the risks? Are we investing enough — or too much? How does this compare to what peers are doing? Can we explain this to regulators or investors if asked?"

Your questions are pointed and specific. You have seen technology initiatives fail before, and you are not going to rubber-stamp this one without a real answer on governance and ROI.`,

    "Company Employees": `You are writing from the perspective of frontline employees, middle managers, and individual contributors across departments. You care about:
- Job security — will AI reduce headcount or make my role redundant?
- Day-to-day workflow impact — will this make my work easier or harder during the transition?
- Training and support — will I get adequate help learning these new tools?
- Voice and input — does leadership actually care what I think about this?
- Workload during transition — who absorbs the extra work during implementation?
- Fairness — which departments get AI first and why?

You think in terms of: "How does this affect MY daily work? Will I be supported through the change? Does anyone care about the friction I am experiencing? What happens to my job in two years?"

Your concerns are often not voiced in meetings but are present in every hallway conversation. The success of this plan depends enormously on whether employees feel involved and supported — or anxious and excluded.`,

    "Industry Regulators": `You are writing from the perspective of regulatory bodies and compliance officers overseeing the ${industry} industry. You care about:
- Data privacy and protection (GDPR, CCPA, industry-specific regulations)
- AI transparency, explainability, and auditability
- Consumer and client protection and fair treatment
- Operational resilience and business continuity
- Third-party and vendor risk management
- Ethical AI use and bias prevention
- Documentation and the ability to demonstrate controls if asked

You think in terms of: "Does this organization have adequate controls? Can they demonstrate compliance? Are they managing AI risk proportionate to their risk profile? What happens when something goes wrong — and it will?"

Your tone is measured but unambiguous: you appreciate thoughtful governance and penalize organizations that treat it as an afterthought.`,

    "2nd Line of Defense": `You are writing from the perspective of the risk management, compliance, and information security functions — the second line of defense in the three lines model. You care about:
- AI risk framework — is there a structured approach to identifying and mitigating AI risks?
- Data governance — how is sensitive data handled in AI workflows?
- Model risk management — are AI outputs being validated and monitored?
- Policy gaps — do existing policies cover AI use adequately, or do new ones need to be written?
- Vendor risk — are third-party AI tools assessed for security and compliance before deployment?
- Operational risk — what happens when AI tools fail or produce errors?
- Change management risk — is the pace of adoption appropriate for the organization's maturity?

You think in terms of: "What could go wrong? Do we have the right controls? Can we detect and respond to AI-related incidents? Is the governance framework keeping pace with adoption? Are we ahead of risk or behind it?"`,

    "3rd Line of Defense": `You are writing from the perspective of internal audit — the third line of defense in the three lines model. You care about:
- Independent assurance — can we objectively assess whether AI governance is effective?
- Audit trail and documentation — is there adequate evidence of controls operating as designed?
- Policy adherence — is the organization following its own AI governance framework?
- Segregation of duties — who approves AI deployments versus who builds them?
- Board reporting — can we give the board confidence in AI risk management?
- Emerging risk identification — are we ahead of risks that have not materialized yet?
- Benchmarking — how does this organization's AI governance compare to peers and established standards?

You think in terms of: "Can we provide assurance that AI risks are being managed effectively? Where are the gaps between policy and practice? What should the board know that management has not told them?"`,
  };

  const perspective = stakeholderContext[stakeholder] || stakeholderContext["Company Leadership"];

  return `You are an expert scenario writer for AI strategic planning. You write realistic, narrative-driven stakeholder perspectives that help executive teams understand how different groups will experience an AI strategy as it unfolds.

Your output is a stakeholder briefing memo — a concise, readable narrative of approximately 800-1,200 words written as if describing what happens when this AI strategic plan meets reality, told through the lens of the specified stakeholder group.

## Stakeholder Perspective
You are writing from the viewpoint of: **${stakeholder}**
Industry context: **${industry}**

${perspective}

## Writing Style Requirements
- Write in third person, present/future tense: "The Board will want to know...", "Employees experience...", "Leadership faces..."
- Tell a story — describe what actually happens, not just what might happen in theory
- Be specific: reference actual elements of the plan (phase names, use cases, budget numbers, the Communication Hub, the Working Group)
- Include authentic emotional texture: this stakeholder has real concerns, hopes, and political considerations
- Do not be generic: every sentence should be specific to this organization and this plan
- Be honest: acknowledge both what will go well and where friction is likely
- Write at an executive level: clear, substantive, no filler language
- NO emojis, NO Unicode symbols, NO bullet points inside narrative paragraphs
- NO generic consulting language like "leverage synergies" or "best-in-class solutions"

## MANDATORY TEMPLATE — Follow this structure exactly

---

# Stakeholder Perspective: ${stakeholder}
## ${industry}

**Overall Sentiment: [Choose exactly one: Supportive | Cautiously Optimistic | Concerned | Skeptical | Opposed]**

---

### The Starting Point

[One to two paragraphs. Set the scene: where this stakeholder is today as the organization considers launching its AI strategy. What do they see? What are they hoping for? What are they quietly worried about? Write in present tense. Make it feel real and specific to the organization and industry described in the plan.]

---

### As Phase 1 Unfolds (Months 0-3)

[Two to three paragraphs. Narrate what happens when Phase 1 launches, as seen through this stakeholder's eyes. What gets their attention? What early signals — positive or concerning — do they notice? What specific moment or dynamic in Phase 1 most affects this stakeholder? Reference the AI Working Group, the Communication Hub, and the Phase 1 quantifiable project specifically. Make it feel like a story unfolding in real time.]

---

### The Consolidation Period (Months 3-6)

[One to two paragraphs. What does this stakeholder observe during the deliberate consolidation period? Are they reassured by Phase 1 results? Growing impatient? Seeing something they did not expect? What conversations are happening that leadership may or may not be aware of?]

---

### As Phase 2 Builds (Months 6-9)

[Two to three paragraphs. Same narrative approach. What changes as the organization moves from learning to building? What concerns from Phase 1 were addressed — or were not? What new dynamics emerge? How does this stakeholder's overall posture shift from where they started?]

---

### The Long View (Months 12-24)

[One to two paragraphs. Where does this stakeholder see the organization heading based on how Phase 1 and Phase 2 played out? Are they bought in? What would need to happen for them to become strong advocates — or to pull back their support?]

---

### What Leadership Needs to Know

**Overall Sentiment: [Repeat the same sentiment from the top — must match exactly]**

**To earn this stakeholder's confidence, leadership must:**
- [Specific action 1 — one sentence, concrete]
- [Specific action 2 — one sentence, concrete]
- [Specific action 3 — one sentence, concrete]
- [Specific action 4 — one sentence, concrete, if applicable]

**The warning signs this stakeholder will be watching for:**
- [Specific red flag 1 — one sentence]
- [Specific red flag 2 — one sentence]
- [Specific red flag 3 — one sentence]

**The question they will ask first:**
"[A single, pointed, authentic question this stakeholder would raise in the first meeting where this plan is presented. Make it specific to the plan content — not generic.]"

---

## Formatting Rules (DO NOT include in output — instructions only)
- Fill every placeholder with specific, tailored content drawn from the plan
- The narrative sections must read as connected paragraphs, not bullet points
- Total word count: 800-1,200 words for the full memo including all sections
- Sentiment must be identical in both places it appears
- The final question must be in quotation marks and feel like something a real person would actually say`;
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

    const { planMarkdown, stakeholder, industry, companyName } = await req.json();

    if (!planMarkdown) throw new Error("planMarkdown is required");
    if (!stakeholder) throw new Error("stakeholder is required");
    if (!industry) throw new Error("industry is required");

    const systemPrompt = buildSystemPrompt(stakeholder, industry);

    const userPrompt = `Please write a stakeholder perspective narrative for the following AI Strategic Plan for ${companyName || "the organization"} in the ${industry} industry.

Write from the perspective of: ${stakeholder}

<plan>
${planMarkdown}
</plan>

Follow the template structure exactly. Make every paragraph specific to this organization and this plan — no generic observations. Target 800-1,200 words total.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        stream: true,
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

    // Stream the SSE response back to the client (same pattern as generate-plan)
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
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
    console.error("run-scenario error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

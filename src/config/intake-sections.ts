export type FieldType = "text" | "textarea" | "radio" | "checkbox";

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  maxSelect?: number;
  showIf?: { field: string; condition: "notEqual" | "equal" | "notEmpty"; value?: string };
  helperText?: string;
  examples?: string[];
}

export interface SectionConfig {
  title: string;
  shortTitle: string;
  fields: FieldConfig[];
}

export const sections: SectionConfig[] = [
  {
    title: "Company Overview",
    shortTitle: "Company",
    fields: [
      { id: "companyName", label: "Company name", type: "text", required: true },
      {
        id: "industry",
        label: "Industry / sector",
        type: "text",
        required: true,
        helperText: "Be as specific as possible. This helps tailor AI recommendations to your regulatory environment and competitive landscape.",
        examples: [
          "B2B SaaS for healthcare revenue cycle management",
          "Regional commercial construction — primarily public sector projects",
          "Community banking — $2B in assets, serving small business and agricultural lending",
        ],
      },
      { id: "employeeCount", label: "Number of employees", type: "radio", required: true, options: ["1–10", "11–50", "51–200", "201–500", "500+"] },
      {
        id: "departmentCount",
        label: "Number of departments or business units",
        type: "text",
        helperText: "Include all distinct teams or business units, even if small. This helps us scope AI opportunities across your organization.",
        examples: [
          "8 departments: Sales, Marketing, Finance, HR, Operations, IT, Customer Success, Product",
          "3 main units: Clinical Operations, Administration, Research",
        ],
      },
      {
        id: "companyDescription",
        label: "Briefly describe what your company does and who it serves",
        type: "textarea",
        required: true,
        helperText: "Focus on what you do, who you serve, and what makes your organization unique. This grounds the entire AI strategy in your actual business.",
        examples: [
          "We are a 45-person environmental engineering firm serving municipal water districts and industrial clients across the Southeast. Our core services are regulatory compliance consulting and water treatment system design. We differentiate on speed of permitting and deep relationships with state regulators.",
          "Mid-size property management company overseeing 3,200 residential units across 28 properties. We handle leasing, maintenance, accounting, and tenant relations. Our competitive edge is our responsiveness — we guarantee 24-hour maintenance response times.",
        ],
      },
      {
        id: "businessPriorities",
        label: "What are your top 2-3 business priorities for the next 12-24 months?",
        type: "textarea",
        required: true,
        helperText: "These priorities become the foundation of your AI strategy. AI initiatives should directly serve these goals — not exist separately from them.",
        examples: [
          "1) Reduce client onboarding time from 6 weeks to 2 weeks. 2) Grow recurring revenue 30% without adding headcount. 3) Improve employee retention in our operations team — we are losing people to burnout.",
          "1) Open 3 new regional offices while keeping overhead flat. 2) Standardize our estimating process to reduce bid errors below 5%. 3) Build a repeatable training program so new project managers are productive in 30 days instead of 90.",
          "1) Increase deposits by 15% through improved business development. 2) Reduce loan processing time from 21 days to 10 days. 3) Improve regulatory exam readiness so we spend less time on exam prep.",
        ],
      },
    ],
  },
  {
    title: "Leadership & AI Readiness",
    shortTitle: "Leadership",
    fields: [
      {
        id: "executiveSponsor",
        label: "Who is the executive sponsor for this AI initiative? Name and title",
        type: "text",
        required: true,
        helperText: "This person champions the initiative, removes blockers, and communicates progress to the board. They don't need to be technical — they need authority and willingness.",
        examples: [
          "Sarah Chen, COO — she owns operations and has budget authority for technology investments",
          "Marcus Williams, CEO — small enough organization that he drives all strategic initiatives directly",
        ],
      },
      { id: "leadershipAttitude", label: "How would you describe leadership's current attitude toward AI?", type: "radio", required: true, options: [
        "Skeptical — need to see proof before committing",
        "Curious — open to it but unsure where to start",
        "Supportive — leadership is on board and wants to move",
        "Urgent — leadership sees AI as a competitive necessity now",
      ]},
      { id: "priorAIExperience", label: "Has your organization had any formal AI discussions, training, or initiatives previously?", type: "radio", options: [
        "No",
        "Informal conversations only",
        "Some training or experimentation",
        "Yes, we've had structured initiatives",
      ],
        helperText: "Even individuals using ChatGPT on their own counts as experience. Don't undercount informal usage — it's a signal of readiness.",
      },
      {
        id: "priorAIDetails",
        label: "If yes, briefly describe your prior AI experience",
        type: "textarea",
        showIf: { field: "priorAIExperience", condition: "notEqual", value: "No" },
        helperText: "Include both formal programs and informal experimentation. What worked? What didn't? This helps us avoid repeating mistakes.",
        examples: [
          "Our marketing team experimented with Jasper for content drafts in Q3 last year. No formal training — individuals self-taught. Results were mixed because there was no strategy behind it and no shared prompts or best practices.",
          "We hired a data science consultant in 2023 who built a churn prediction model. It was technically sound but never got adopted because the sales team didn't trust the outputs and weren't involved in building it.",
          "A few people use ChatGPT informally for drafting emails, summarizing meeting notes, and brainstorming. No company policy around it yet. Some managers are uneasy about what data might be going into these tools.",
        ],
      },
      { id: "techAdoptionComfort", label: "How comfortable is your team with adopting new technology in general?", type: "radio", options: [
        "Low — change is difficult here",
        "Medium — adoption happens but takes time",
        "High — our team embraces new tools readily",
      ]},
    ],
  },
  {
    title: "Current Technology & Vendors",
    shortTitle: "Technology",
    fields: [
      {
        id: "corePlatforms",
        label: "What core software platforms does your organization rely on?",
        type: "textarea",
        helperText: "List everything — CRM, ERP, project management, communication, accounting, HR systems. Many of these already have AI features you may not know about.",
        examples: [
          "Salesforce CRM, NetSuite ERP, Slack, Google Workspace, Asana, Greenhouse (ATS), Snowflake data warehouse",
          "Microsoft 365, Dynamics GP, Monday.com, QuickBooks, RingCentral, custom FileMaker database for job tracking",
          "Jack Henry core banking, Salesforce for CRM, Microsoft 365, SharePoint, ADP for payroll, Egnyte for document management",
        ],
      },
      {
        id: "vendorsWithAI",
        label: "Do any of your current vendors already offer AI features or tools?",
        type: "radio",
        options: ["Yes", "No", "Not sure"],
        helperText: "Many SaaS vendors have added AI features recently. If you're unsure, selecting 'Not sure' is perfectly fine — we can help identify them.",
      },
      {
        id: "vendorAIDetails",
        label: "If yes, list the vendors and describe their AI features",
        type: "textarea",
        showIf: { field: "vendorsWithAI", condition: "equal", value: "Yes" },
        helperText: "Even if these features aren't being used yet, list them. Activating existing vendor AI is often the fastest near-term win.",
        examples: [
          "Salesforce Einstein is available on our plan but nobody has turned it on. HubSpot has AI content generation we haven't explored. Our phone system has call transcription we never activated.",
          "Microsoft 365 Copilot is available but we haven't rolled it out. Our core banking platform added AI-powered fraud detection last quarter. Our document management system has AI search capabilities.",
        ],
      },
      { id: "currentAITools", label: "Are you currently using any AI tools, even informally?", type: "radio", options: ["No", "Yes — used informally by individuals", "Yes — used in some structured way"] },
      {
        id: "currentAIToolsDetails",
        label: "If yes, describe what tools and how they're being used",
        type: "textarea",
        showIf: { field: "currentAITools", condition: "notEqual", value: "No" },
        helperText: "Be honest about informal use. If people are copying data into ChatGPT, that's useful information for building the strategy.",
        examples: [
          "Several people use ChatGPT personally for drafting emails and summarizing documents. No company licenses or policies around it. Our dev team uses GitHub Copilot (company-paid). One analyst uses Claude for data analysis.",
          "We purchased 10 ChatGPT Team licenses for the leadership team. Usage is inconsistent — some people use it daily, others haven't logged in since the first week. No shared prompts or workflows.",
        ],
      },
      { id: "itSupportStructure", label: "What is your current IT support structure?", type: "radio", options: ["Internal IT team", "Outsourced / managed service provider", "No dedicated IT support", "Combination"] },
    ],
  },
  {
    title: "Workflows & Pain Points",
    shortTitle: "Workflows",
    fields: [
      {
        id: "timeConsumingTasks",
        label: "What are the most time-consuming or repetitive tasks in your organization?",
        type: "textarea",
        required: true,
        helperText: "Think about tasks where people spend hours on work that feels like it should be faster. Include volume and frequency — these are often the best AI quick-win candidates for your first quantifiable project.",
        examples: [
          "Proposal writing — our sales team spends 8-10 hours per proposal, mostly reformatting past proposals and customizing boilerplate language. We do about 15 proposals per month. Status reporting — project managers spend every Friday afternoon compiling weekly updates from 4 different systems into a single report.",
          "Invoice processing — our AP team manually keys data from PDFs into our accounting system, about 200 invoices per month. Each takes 15-20 minutes. Also, loan file preparation — assembling documents for underwriting takes a loan officer 3-4 hours per application.",
          "Employee onboarding paperwork — HR spends 6 hours per new hire manually preparing and routing documents. We hire about 8 people per month. Also, monthly compliance reporting — pulling data from 3 systems, cross-referencing, and formatting takes our compliance officer 2 full days.",
        ],
      },
      {
        id: "errorBottlenecks",
        label: "Where do errors, delays, or bottlenecks most commonly occur?",
        type: "textarea",
        helperText: "Where do mistakes happen? Where do things get stuck waiting for someone? These bottlenecks often reveal the highest-impact AI opportunities.",
        examples: [
          "Data entry errors in our CRM — reps enter information inconsistently, which breaks our reporting downstream. Approval bottlenecks — contracts sit in the VP's inbox for days because she can't review them fast enough alongside her other work.",
          "Handoffs between departments — when a project moves from sales to operations, critical details get lost because there's no structured transfer process. Also, month-end close takes 8 days because of manual reconciliation errors that have to be tracked down.",
        ],
      },
      { id: "manualProcesses", label: "Are there processes that rely heavily on manual data entry, document handling, or reporting?", type: "radio", options: ["Yes — extensively", "Yes — in some areas", "No"] },
      {
        id: "manualProcessesDetails",
        label: "If yes, describe those processes",
        type: "textarea",
        showIf: { field: "manualProcesses", condition: "notEqual", value: "No" },
        helperText: "Describe the volume, frequency, and business impact. Specifics like '500 records per week' are far more useful than 'we do manual data entry.'",
        examples: [
          "Monthly financial close requires pulling data from 3 systems into Excel, reconciling manually, and producing a board report. Takes the finance team 5 full days each month. One missed entry last quarter caused a $40K variance that took 2 days to find.",
          "Every new client engagement requires manually creating 12 different documents from templates, customizing each, routing for signatures, and filing. About 20 new engagements per quarter. Error rate is roughly 15% — wrong names, outdated terms, missing sections.",
        ],
      },
      {
        id: "highPotentialDepartments",
        label: "Which departments do you believe have the highest potential to benefit from AI?",
        type: "checkbox",
        options: ["Operations", "Sales & Marketing", "Finance & Accounting", "HR & People", "Customer Service", "IT", "Leadership / Executive", "Other"],
        helperText: "Choose the departments where AI would create the most visible impact. This helps prioritize which area gets the first quantifiable near-term project.",
      },
    ],
  },
  {
    title: "Goals & Success Metrics",
    shortTitle: "Goals",
    fields: [
      {
        id: "success3Months",
        label: "What does success look like for your AI initiative in the first 3 months?",
        type: "textarea",
        required: true,
        helperText: "Strong 3-month goals focus on: people becoming comfortable with AI tools, launching a communication hub for capturing ideas, forming an AI working group, and completing at least one project with quantifiable results.",
        examples: [
          "Every team member has used an AI tool at least weekly for a month. We have an active communication channel where people submit AI ideas and friction points. Our AI working group meets biweekly. We've automated our proposal first-draft process, saving 5+ hours per proposal.",
          "Our AI working group has met 6 times with participation from every department. We've launched a simple idea-capture channel and received 25+ submissions. We completed one pilot project: AI-assisted invoice processing that saves our AP team 15 hours per month. People are talking about AI at lunch — it's becoming part of the culture.",
          "Leadership can see a clear dashboard showing time saved from our first AI project. The communication hub has surfaced 3 ideas that we've added to our 6-month roadmap. Every department head has attended at least one AI working group session.",
        ],
      },
      {
        id: "success12Months",
        label: "What does success look like at 12-24 months?",
        type: "textarea",
        required: true,
        helperText: "Think in terms of measurable business impact: time saved, costs reduced, revenue influenced, or positions you didn't need to hire for. These should connect directly to your business priorities.",
        examples: [
          "3+ AI-powered workflows running in production, saving the equivalent of 1.5 FTEs. Our vendor AI features are actively used across Sales and Operations. Communication hub has surfaced 30+ ideas, 10 of which became projects. We avoided hiring 2 positions by automating their planned workload.",
          "AI is part of how we work, not a separate initiative. Proposal win rate has improved 20% because AI helps us respond faster and more thoroughly. Monthly close time is down from 8 days to 3 days. We've built 2 custom AI agents that handle routine customer inquiries.",
          "We can point to $200K+ in measurable value created through AI initiatives — a mix of time savings, error reduction, and revenue influence. Our AI working group has evolved into an innovation council that the board asks for updates on. We're exploring a new vendor partnership that came from our Phase 2 evaluation.",
        ],
      },
      {
        id: "topOutcomes",
        label: "Which outcomes matter most to your organization? Select your top 3.",
        type: "checkbox",
        maxSelect: 3,
        options: [
          "Time savings / efficiency", "Cost reduction", "Revenue growth",
          "Improved customer experience", "Employee satisfaction / reduced burnout",
          "Competitive differentiation", "Risk reduction / compliance", "Better decision-making / reporting",
        ],
        helperText: "Choose the outcomes leadership would use to justify the AI investment to the board. These drive your KPI framework.",
      },
      {
        id: "trackedKPIs",
        label: "Are there specific KPIs your leadership already tracks that you'd want AI to impact?",
        type: "textarea",
        helperText: "The best AI KPIs tie directly to business outcomes leadership already cares about — not just AI adoption metrics like 'number of tools used' or 'login frequency.'",
        examples: [
          "Revenue per employee, client onboarding time (days), proposal win rate, monthly close time (days), employee turnover rate",
          "Cost per acquisition, average handle time, customer satisfaction score (CSAT), time-to-hire, first-call resolution rate",
          "Loan processing time (days), cost per loan originated, regulatory exam findings, deposit growth rate, net interest margin",
        ],
      },
    ],
  },
  {
    title: "Governance & Risk",
    shortTitle: "Governance",
    fields: [
      {
        id: "sensitiveData",
        label: "Does your organization handle sensitive data requiring careful AI governance?",
        type: "radio",
        options: [
          "Yes — heavily regulated industry",
          "Yes — some sensitive data",
          "No — limited sensitivity concerns",
        ],
        helperText: "This determines how robust your AI governance framework needs to be. Heavily regulated industries need more guardrails upfront.",
      },
      {
        id: "complianceFrameworks",
        label: "Are there compliance frameworks your organization follows? e.g. HIPAA, SOC 2, GDPR",
        type: "text",
        helperText: "List any formal compliance standards your organization follows or is audited against.",
        examples: [
          "SOC 2 Type II, HIPAA (we handle PHI), state insurance regulations",
          "GDPR (EU customers), PCI DSS (payment processing), ISO 27001",
          "Bank regulatory exams (FDIC/OCC), BSA/AML, GLBA, state privacy laws",
        ],
      },
      { id: "riskConcernLevel", label: "How concerned is your leadership about AI-related risks?", type: "radio", options: [
        "Not a current concern",
        "Somewhat concerned — want guardrails",
        "Very concerned — this needs to be addressed upfront",
      ]},
      {
        id: "riskNotes",
        label: "Notes on specific risk concerns",
        type: "textarea",
        helperText: "What specific risks keep leadership up at night about AI? Being specific here produces much better governance recommendations in your plan.",
        examples: [
          "Concerned about employees putting client data into public AI tools without realizing the privacy implications. Board wants to understand our AI liability exposure before we scale up.",
          "Worried about AI-generated content being inaccurate in client-facing materials — a bad recommendation could damage our reputation. Also concerned about vendor data practices and whether our data is being used to train models.",
          "Biggest risk is regulatory — our examiners haven't published clear AI guidance yet, so we're operating in a gray area. We need to be able to demonstrate governance and controls if asked.",
        ],
      },
    ],
  },
  {
    title: "Budget & Resources",
    shortTitle: "Budget",
    fields: [
      { id: "budgetAllocated", label: "Has your organization allocated a budget for AI-related initiatives?", type: "radio", required: true, options: [
        "Yes — dedicated budget exists",
        "Partially — some funds available",
        "No — not yet",
      ],
        helperText: "Even if no formal budget exists, Phase 1 can often be done with existing tool subscriptions and time allocation. Don't let budget be a blocker.",
      },
      { id: "budgetRange", label: "If yes or partially, what is the approximate annual budget range?", type: "radio", showIf: { field: "budgetAllocated", condition: "notEqual", value: "No — not yet" }, options: [
        "Under $10,000", "$10,000 – $25,000", "$25,000 – $50,000",
        "$50,000 – $100,000", "$100,000+", "Prefer not to say",
      ],
        helperText: "This helps us right-size recommendations. A $10K budget leads to a very different plan than $100K+. We'll include per-phase budget tracking in your plan.",
      },
      {
        id: "implementationOwner",
        label: "Who will own implementation day-to-day?",
        type: "text",
        helperText: "This person manages day-to-day execution of the AI strategy. They don't need to be a technologist, but they need the authority, time allocation, and cross-functional visibility to drive progress.",
        examples: [
          "Director of Operations — has cross-functional visibility and the respect of department heads",
          "Chief of Staff — already coordinates strategic initiatives across the organization",
          "VP of Technology — manages vendor relationships and has budget authority for tools",
        ],
      },
      {
        id: "aiWorkingGroup",
        label: "Would leadership support forming an internal AI working group or committee?",
        type: "radio",
        options: ["Yes", "Maybe — needs discussion", "No"],
        helperText: "An AI working group is one of the most impactful Phase 1 actions. Meeting weekly or biweekly, it creates cross-functional visibility, captures ideas, tracks progress, and keeps a living strategic document up to date.",
      },
    ],
  },
  {
    title: "Open Reflection",
    shortTitle: "Reflection",
    fields: [
      {
        id: "biggestConcern",
        label: "What is your biggest concern about implementing AI in your organization?",
        type: "textarea",
        helperText: "Be candid. Your concerns directly shape the risk mitigation and change management strategies in your plan.",
        examples: [
          "I'm worried we'll spend money on AI tools that nobody actually uses. We've been burned before by technology investments that didn't stick because there was no adoption plan.",
          "Our team is already stretched thin. I don't know how we'll find time to learn new AI tools on top of everything else. I need this to save time, not create more work.",
          "My biggest concern is security and compliance. We handle sensitive client data, and I need to be 100% certain that AI tools won't create liability for us. Our board will ask tough questions.",
        ],
      },
      {
        id: "mostExciting",
        label: "What excites you most about the potential of AI for your organization?",
        type: "textarea",
        helperText: "Dream big here. What would you do with 10 extra hours per week? What problem would you solve if you could? This helps us prioritize the initiatives that will generate the most enthusiasm.",
        examples: [
          "If we could automate our reporting, our analysts could actually do analysis instead of compiling data. That would be transformative for our decision-making quality and speed.",
          "I think AI could help us punch above our weight. Right now, bigger competitors win because they have more people to throw at proposals and projects. AI could be the equalizer.",
          "The idea of a communication hub where anyone in the organization can surface an AI idea and it actually gets evaluated — that kind of bottom-up innovation would completely change our culture.",
        ],
      },
      {
        id: "additionalNotes",
        label: "Is there anything else you'd like us to know before your planning session?",
        type: "textarea",
        helperText: "Anything that would help us build a better plan — organizational dynamics, upcoming changes, constraints, or context that didn't fit in earlier questions.",
      },
    ],
  },
];

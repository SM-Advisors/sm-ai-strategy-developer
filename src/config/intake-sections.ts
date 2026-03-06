export type FieldType = "text" | "textarea" | "radio" | "checkbox";

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  optionsFn?: (formData: Record<string, unknown>) => string[];
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

/**
 * Returns industry-appropriate department options based on free-text industry input.
 * Matches keywords in the industry string to return contextually relevant options.
 */
export function getDepartmentOptions(industry: string): string[] {
  const lower = industry.toLowerCase();

  // Banking / Financial Services / Credit Union / Fintech
  if (
    lower.includes("bank") ||
    lower.includes("credit union") ||
    lower.includes("lending") ||
    lower.includes("mortgage") ||
    lower.includes("financial institution") ||
    lower.includes("community bank") ||
    lower.includes("fintech")
  ) {
    return [
      "Lending / Loan Operations",
      "Deposit Operations",
      "Compliance / BSA / Risk",
      "Commercial Banking / Business Development",
      "Retail / Branch Banking",
      "Finance & Accounting",
      "HR & People",
      "IT / Information Security",
      "Other",
    ];
  }

  // Healthcare / Medical / Hospital / Clinical
  if (
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("hospital") ||
    lower.includes("clinic") ||
    lower.includes("pharma") ||
    lower.includes("biotech") ||
    lower.includes("dental") ||
    lower.includes("therapy") ||
    lower.includes("behavioral health")
  ) {
    return [
      "Clinical Operations",
      "Revenue Cycle",
      "Compliance & Quality",
      "Patient Services",
      "Finance & Accounting",
      "HR & People",
      "IT & Informatics",
      "Research & Analytics",
      "Other",
    ];
  }

  // Technology / SaaS / Software / Tech
  if (
    lower.includes("software") ||
    lower.includes("saas") ||
    lower.includes("technology") ||
    lower.includes("tech") ||
    lower.includes("platform") ||
    lower.includes("app") ||
    lower.includes("digital") ||
    lower.includes("it services") ||
    lower.includes("cybersecurity")
  ) {
    return [
      "Engineering / Product",
      "Sales & Business Development",
      "Customer Success",
      "Marketing",
      "Finance & Accounting",
      "HR & People",
      "IT / Security",
      "Data & Analytics",
      "Other",
    ];
  }

  // Manufacturing / Industrial / Logistics / Supply Chain
  if (
    lower.includes("manufactur") ||
    lower.includes("industrial") ||
    lower.includes("logistics") ||
    lower.includes("supply chain") ||
    lower.includes("distribution") ||
    lower.includes("warehouse") ||
    lower.includes("production") ||
    lower.includes("plant")
  ) {
    return [
      "Operations & Production",
      "Quality & Compliance",
      "Supply Chain",
      "Sales & Business Development",
      "Finance & Accounting",
      "HR & People",
      "IT / OT Systems",
      "Engineering",
      "Other",
    ];
  }

  // Professional Services / Consulting / Legal / Accounting / Advisory
  if (
    lower.includes("consulting") ||
    lower.includes("advisory") ||
    lower.includes("legal") ||
    lower.includes("law") ||
    lower.includes("accounting") ||
    lower.includes("cpa") ||
    lower.includes("audit") ||
    lower.includes("professional services") ||
    lower.includes("staffing") ||
    lower.includes("recruiting")
  ) {
    return [
      "Client Services / Delivery",
      "Business Development",
      "Finance & Accounting",
      "HR & People",
      "Marketing",
      "IT & Systems",
      "Knowledge Management",
      "Operations",
      "Other",
    ];
  }

  // Real Estate / Construction / Property Management
  if (
    lower.includes("real estate") ||
    lower.includes("construction") ||
    lower.includes("property") ||
    lower.includes("contractor") ||
    lower.includes("architecture") ||
    lower.includes("engineering firm") ||
    lower.includes("developer")
  ) {
    return [
      "Operations & Project Management",
      "Finance & Accounting",
      "Sales & Leasing",
      "Property Management",
      "HR & People",
      "IT & Systems",
      "Legal & Compliance",
      "Estimating / Bidding",
      "Other",
    ];
  }

  // Retail / E-Commerce / Consumer Goods
  if (
    lower.includes("retail") ||
    lower.includes("e-commerce") ||
    lower.includes("ecommerce") ||
    lower.includes("consumer") ||
    lower.includes("store") ||
    lower.includes("restaurant") ||
    lower.includes("hospitality") ||
    lower.includes("food")
  ) {
    return [
      "Operations",
      "Sales & Merchandising",
      "Marketing",
      "Customer Service",
      "Finance & Accounting",
      "HR & People",
      "IT & Systems",
      "Supply Chain & Logistics",
      "Other",
    ];
  }

  // Education / Higher Ed / K-12 / Training
  if (
    lower.includes("education") ||
    lower.includes("school") ||
    lower.includes("university") ||
    lower.includes("college") ||
    lower.includes("learning") ||
    lower.includes("training") ||
    lower.includes("academic")
  ) {
    return [
      "Academic / Instruction",
      "Student Services",
      "Finance & Administration",
      "HR & People",
      "IT & Systems",
      "Marketing & Enrollment",
      "Compliance & Accreditation",
      "Other",
    ];
  }

  // Insurance
  if (
    lower.includes("insurance") ||
    lower.includes("underwriting") ||
    lower.includes("claims") ||
    lower.includes("actuarial")
  ) {
    return [
      "Underwriting",
      "Claims",
      "Actuarial & Analytics",
      "Sales & Distribution",
      "Compliance & Regulatory",
      "Finance & Accounting",
      "HR & People",
      "IT & Systems",
      "Other",
    ];
  }

  // Government / Nonprofit / Association
  if (
    lower.includes("government") ||
    lower.includes("nonprofit") ||
    lower.includes("non-profit") ||
    lower.includes("association") ||
    lower.includes("municipality") ||
    lower.includes("public sector") ||
    lower.includes("ngo")
  ) {
    return [
      "Program / Service Delivery",
      "Finance & Administration",
      "HR & People",
      "Communications & Outreach",
      "IT & Systems",
      "Compliance & Regulatory",
      "Fundraising / Development",
      "Other",
    ];
  }

  // Default — generic options that work for any industry
  return [
    "Operations",
    "Sales & Business Development",
    "Finance & Accounting",
    "HR & People",
    "Customer Service",
    "Marketing",
    "IT & Systems",
    "Legal & Compliance",
    "Other",
  ];
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
        ],
      },
      {
        id: "competitivePressure",
        label: "Are your competitors or peers actively using AI in ways that affect your competitive position?",
        type: "radio",
        options: [
          "Not that we are aware of",
          "We have heard of some activity but do not know the details",
          "Yes — competitors are visibly using AI and it is creating pressure",
          "Yes — we are falling behind and it is affecting our business",
        ],
        helperText: "This calibrates urgency. An organization facing competitive AI pressure needs a different near-term approach than one exploring proactively.",
      },
      {
        id: "customerExpectations",
        label: "Are your customers, clients, or stakeholders asking for AI-enhanced services or faster delivery?",
        type: "textarea",
        showIf: { field: "competitivePressure", condition: "notEqual", value: "Not that we are aware of" },
        helperText: "Examples: clients asking for faster turnaround, automated reporting, AI-powered products, or capabilities your competitors now offer.",
        examples: [
          "Several enterprise clients have asked us directly whether we use AI to accelerate our deliverables. One RFP last quarter specifically asked about our AI capabilities.",
          "Our borrowers are comparing our turnaround time to digital-native lenders. We are losing deals where speed is the deciding factor.",
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
        helperText: "This person champions the initiative, removes blockers, and communicates progress to the board. They need authority and willingness — not necessarily technical knowledge.",
        examples: [
          "Sarah Chen, COO — she owns operations and has budget authority for technology investments",
          "Marcus Williams, CEO — small enough organization that he drives all strategic initiatives directly",
        ],
      },
      {
        id: "leadershipAttitude",
        label: "How would you describe leadership's current attitude toward AI?",
        type: "radio",
        required: true,
        options: [
          "Skeptical — need to see proof before committing",
          "Curious — open to it but unsure where to start",
          "Supportive — leadership is on board and wants to move",
          "Urgent — leadership sees AI as a competitive necessity now",
        ],
      },
      {
        id: "priorAIExperience",
        label: "Has your organization had any formal AI discussions, training, or initiatives previously?",
        type: "radio",
        options: [
          "No",
          "Informal conversations only",
          "Some training or experimentation",
          "Yes, we have had structured initiatives",
        ],
        helperText: "Even individuals using ChatGPT on their own counts as experience. Do not undercount informal usage — it is a signal of readiness.",
      },
      {
        id: "priorAIDetails",
        label: "If yes, briefly describe your prior AI experience",
        type: "textarea",
        showIf: { field: "priorAIExperience", condition: "notEqual", value: "No" },
        helperText: "Include both formal programs and informal experimentation. What worked? What did not? This helps us avoid repeating mistakes.",
        examples: [
          "Our marketing team experimented with Jasper for content drafts last year. No formal training — individuals self-taught. Results were mixed because there was no strategy behind it and no shared prompts or best practices.",
          "We hired a data science consultant in 2023 who built a churn prediction model. It was technically sound but never got adopted because the sales team did not trust the outputs and were not involved in building it.",
        ],
      },
      {
        id: "techAdoptionComfort",
        label: "How comfortable is your team with adopting new technology in general?",
        type: "radio",
        options: [
          "Low — change is difficult here",
          "Medium — adoption happens but takes time",
          "High — our team embraces new tools readily",
        ],
      },
      {
        id: "technicalTalent",
        label: "Does your organization have anyone in a technical, data, or analytics role?",
        type: "radio",
        options: [
          "No — we are a non-technical organization",
          "Informally — someone who is good with technology but it is not their primary role",
          "Yes — we have dedicated IT, data, or analytics staff",
          "Yes — we have a data or analytics team or function",
        ],
        helperText: "This shapes the build vs. buy recommendations and determines who can own technical implementation of AI solutions.",
      },
      {
        id: "pastTechRollouts",
        label: "Describe a recent technology rollout or major process change at your organization. What went well? What did not?",
        type: "textarea",
        helperText: "This could be a new CRM, an ERP migration, a remote work transition, or any significant change. How it went tells us a lot about your organization's change readiness — and helps us design a Phase 1 that fits how your org actually operates.",
        examples: [
          "We rolled out Salesforce two years ago. The technology worked but adoption took 18 months because we did not have a training plan and managers were not enforcing usage. Eventually it stuck after we tied it to compensation reporting.",
          "Our Teams rollout during COVID was actually our biggest success. People embraced it quickly because they needed it. We have found that when the pain is clear and the tool is simple, our team adopts fast.",
        ],
      },
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
        helperText: "Many SaaS vendors have added AI features recently. If you are unsure, selecting Not sure is fine — we can help identify them.",
      },
      {
        id: "vendorAIDetails",
        label: "If yes, list the vendors and describe their AI features",
        type: "textarea",
        showIf: { field: "vendorsWithAI", condition: "equal", value: "Yes" },
        helperText: "Even if these features are not being used yet, list them. Activating existing vendor AI is often the fastest near-term win.",
        examples: [
          "Salesforce Einstein is available on our plan but nobody has turned it on. HubSpot has AI content generation we have not explored. Our phone system has call transcription we never activated.",
          "Microsoft 365 Copilot is available but we have not rolled it out. Our core banking platform added AI-powered fraud detection last quarter.",
        ],
      },
      {
        id: "currentAITools",
        label: "Are you currently using any AI tools, even informally?",
        type: "radio",
        options: ["No", "Yes — used informally by individuals", "Yes — used in some structured way"],
      },
      {
        id: "currentAIToolsDetails",
        label: "If yes, describe what tools and how they are being used",
        type: "textarea",
        showIf: { field: "currentAITools", condition: "notEqual", value: "No" },
        helperText: "Be honest about informal use. If people are copying data into ChatGPT, that is useful information for building the strategy.",
        examples: [
          "Several people use ChatGPT personally for drafting emails and summarizing documents. No company licenses or policies around it. Our dev team uses GitHub Copilot. One analyst uses Claude for data analysis.",
          "We purchased 10 ChatGPT Team licenses for the leadership team. Usage is inconsistent — some people use it daily, others have not logged in since the first week.",
        ],
      },
      {
        id: "itSupportStructure",
        label: "What is your current IT support structure?",
        type: "radio",
        options: ["Internal IT team", "Outsourced / managed service provider", "No dedicated IT support", "Combination"],
      },
      {
        id: "dataMaturity",
        label: "How would you describe your organization's data management practices?",
        type: "radio",
        helperText: "Data readiness is one of the most important factors in determining which AI use cases are feasible and how quickly you can move.",
        options: [
          "Ad hoc — data lives in spreadsheets and individual systems with little integration",
          "Developing — we have some centralized data but significant silos and manual assembly",
          "Structured — we have organized data systems with some reporting and analytics",
          "Advanced — integrated data platforms with dashboards, analytics, and clear data ownership",
        ],
      },
      {
        id: "dataQualityConcerns",
        label: "Where are your biggest data quality or accessibility challenges?",
        type: "textarea",
        showIf: { field: "dataMaturity", condition: "notEqual", value: "Advanced — integrated data platforms with dashboards, analytics, and clear data ownership" },
        helperText: "Think about: duplicate records, outdated information, data trapped in systems that do not talk to each other, or reports that require manual assembly from multiple sources.",
        examples: [
          "Our CRM data is a mess — reps enter information inconsistently and we have thousands of duplicate accounts. We cannot trust our sales pipeline reports without manual cleanup.",
          "Our data lives in four different systems that do not connect. Every month-end report requires an analyst to pull from each one and manually stitch them together in Excel. It takes 3 days and errors are common.",
        ],
      },
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
        ],
      },
      {
        id: "errorBottlenecks",
        label: "Where do errors, delays, or bottlenecks most commonly occur?",
        type: "textarea",
        helperText: "Where do mistakes happen? Where do things get stuck waiting for someone? These bottlenecks often reveal the highest-impact AI opportunities.",
        examples: [
          "Data entry errors in our CRM — reps enter information inconsistently, which breaks our reporting downstream. Approval bottlenecks — contracts sit in the VP's inbox for days because she cannot review them fast enough alongside her other work.",
          "Handoffs between departments — when a project moves from sales to operations, critical details get lost because there is no structured transfer process. Month-end close takes 8 days because of manual reconciliation errors that have to be tracked down.",
        ],
      },
      {
        id: "manualProcesses",
        label: "Are there processes that rely heavily on manual data entry, document handling, or reporting?",
        type: "radio",
        options: ["Yes — extensively", "Yes — in some areas", "No"],
      },
      {
        id: "manualProcessesDetails",
        label: "If yes, describe those processes",
        type: "textarea",
        showIf: { field: "manualProcesses", condition: "notEqual", value: "No" },
        helperText: "Describe the volume, frequency, and business impact. Specifics like 500 records per week are far more useful than we do manual data entry.",
        examples: [
          "Monthly financial close requires pulling data from 3 systems into Excel, reconciling manually, and producing a board report. Takes the finance team 5 full days each month. One missed entry last quarter caused a $40K variance that took 2 days to find.",
          "Every new client engagement requires manually creating 12 different documents from templates, customizing each, routing for signatures, and filing. About 20 new engagements per quarter. Error rate is roughly 15%.",
        ],
      },
      {
        id: "highPotentialDepartments",
        label: "Which departments do you believe have the highest potential to benefit from AI?",
        type: "checkbox",
        optionsFn: (formData) => getDepartmentOptions(String(formData.industry || "")),
        helperText: "Choose the departments where AI would create the most visible impact. This helps prioritize which area gets the first quantifiable near-term project.",
      },
      {
        id: "highPotentialDepartmentsDetails",
        label: "Are there any specific areas or processes within those departments that are top of mind?",
        type: "textarea",
        showIf: { field: "highPotentialDepartments", condition: "notEmpty" },
        helperText: "This is optional but very helpful. Even a quick note like loan doc prep takes forever gives us a strong starting point.",
        examples: [
          "In Lending, the biggest pain is pulling together loan packages — it takes hours of copying from multiple systems. Compliance spends 2 days a month just on CTR filing prep.",
          "Our branch staff spend a lot of time answering the same account questions. Commercial bankers waste time on CRM data entry instead of calling on prospects.",
        ],
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
          "Every team member has used an AI tool at least weekly for a month. We have an active communication channel where people submit AI ideas and friction points. Our AI working group meets biweekly. We have automated our proposal first-draft process, saving 5+ hours per proposal.",
          "Our AI working group has met 6 times with participation from every department. We have launched a simple idea-capture channel and received 25+ submissions. We completed one pilot project: AI-assisted invoice processing that saves our AP team 15 hours per month.",
        ],
      },
      {
        id: "success6Months",
        label: "What does success look like at 6-9 months?",
        type: "textarea",
        required: true,
        helperText: "This phase typically focuses on completing your first automation, building on Phase 1 momentum, and beginning to leverage AI features available through your existing vendors.",
        examples: [
          "We have completed our first internal automation and it is saving 4 hours per package. We have activated AI features in our core platforms. The AI working group has evaluated 3 vendor AI tools and rolled out one organization-wide.",
          "Our first use case is running reliably and has been presented to the board as a success story. We are piloting a second project. We have reviewed every vendor contract for available AI features and activated the top 3.",
        ],
      },
      {
        id: "success12Months",
        label: "What does success look like at 12-24 months?",
        type: "textarea",
        required: true,
        helperText: "Think in terms of measurable business impact: time saved, costs reduced, revenue influenced, or positions you did not need to hire for. These should connect directly to your business priorities.",
        examples: [
          "3+ AI-powered workflows running in production, saving the equivalent of 1.5 FTEs. Our vendor AI features are actively used across Sales and Operations. Communication hub has surfaced 30+ ideas, 10 of which became projects. We avoided hiring 2 positions by automating their planned workload.",
          "AI is part of how we work, not a separate initiative. Proposal win rate has improved 20% because AI helps us respond faster and more thoroughly. Monthly close time is down from 8 days to 3 days.",
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
        label: "Are there specific KPIs your leadership already tracks that you would want AI to impact?",
        type: "textarea",
        helperText: "The best AI KPIs tie directly to business outcomes leadership already cares about — not just AI adoption metrics like number of tools used or login frequency.",
        examples: [
          "Revenue per employee, client onboarding time (days), proposal win rate, monthly close time (days), employee turnover rate",
          "Cost per acquisition, average handle time, customer satisfaction score (CSAT), time-to-hire, first-call resolution rate",
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
      {
        id: "riskConcernLevel",
        label: "How concerned is your leadership about AI-related risks?",
        type: "radio",
        options: [
          "Not a current concern",
          "Somewhat concerned — want guardrails",
          "Very concerned — this needs to be addressed upfront",
        ],
      },
      {
        id: "riskNotes",
        label: "Notes on specific risk concerns",
        type: "textarea",
        helperText: "What specific risks keep leadership up at night about AI? Being specific here produces much better governance recommendations in your plan.",
        examples: [
          "Concerned about employees putting client data into public AI tools without realizing the privacy implications. Board wants to understand our AI liability exposure before we scale up.",
          "Worried about AI-generated content being inaccurate in client-facing materials — a bad recommendation could damage our reputation. Also concerned about vendor data practices.",
          "Biggest risk is regulatory — our examiners have not published clear AI guidance yet, so we are operating in a gray area. We need to be able to demonstrate governance and controls if asked.",
        ],
      },
    ],
  },
  {
    title: "Budget & Resources",
    shortTitle: "Budget",
    fields: [
      {
        id: "budgetAllocated",
        label: "Has your organization allocated a budget for AI-related initiatives?",
        type: "radio",
        required: true,
        options: [
          "Yes — dedicated budget exists",
          "Partially — some funds available",
          "No — not yet",
        ],
        helperText: "Even if no formal budget exists, Phase 1 can often be done with existing tool subscriptions and time allocation. Do not let budget be a blocker.",
      },
      {
        id: "budgetRange",
        label: "If yes or partially, what is the approximate annual budget range?",
        type: "radio",
        showIf: { field: "budgetAllocated", condition: "notEqual", value: "No — not yet" },
        options: [
          "Under $10,000", "$10,000 – $25,000", "$25,000 – $50,000",
          "$50,000 – $100,000", "$100,000+", "Prefer not to say",
        ],
        helperText: "This helps us right-size recommendations. A $10K budget leads to a very different plan than $100K+.",
      },
      {
        id: "implementationOwner",
        label: "Who will own implementation day-to-day?",
        type: "text",
        helperText: "This person manages day-to-day execution of the AI strategy. They need authority, time allocation, and cross-functional visibility.",
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
    title: "Final Thoughts",
    shortTitle: "Reflection",
    fields: [
      {
        id: "biggestConcern",
        label: "What is your biggest concern about implementing AI in your organization?",
        type: "textarea",
        helperText: "Be candid. Your concerns directly shape the risk mitigation and change management strategies in your plan.",
        examples: [
          "I am worried we will spend money on AI tools that nobody actually uses. We have been burned before by technology investments that did not stick because there was no adoption plan.",
          "Our team is already stretched thin. I do not know how we will find time to learn new AI tools on top of everything else. I need this to save time, not create more work.",
          "My biggest concern is security and compliance. We handle sensitive client data, and I need to be 100% certain that AI tools will not create liability for us.",
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
        ],
      },
      {
        id: "additionalNotes",
        label: "Is there anything else you would like us to know before your planning session?",
        type: "textarea",
        helperText: "Anything that would help us build a better plan — organizational dynamics, upcoming changes, constraints, or context that did not fit in earlier questions.",
      },
    ],
  },
];

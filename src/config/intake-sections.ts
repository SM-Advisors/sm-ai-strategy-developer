export type FieldType = "text" | "textarea" | "radio" | "checkbox";

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  maxSelect?: number;
  showIf?: { field: string; condition: "notEqual" | "equal" | "notEmpty"; value?: string };
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
      { id: "industry", label: "Industry / sector", type: "text", required: true },
      { id: "employeeCount", label: "Number of employees", type: "radio", required: true, options: ["1–10", "11–50", "51–200", "201–500", "500+"] },
      { id: "departmentCount", label: "Number of departments or business units", type: "text" },
      { id: "companyDescription", label: "Briefly describe what your company does and who it serves", type: "textarea", required: true },
      { id: "businessPriorities", label: "What are your top 2-3 business priorities for the next 12-24 months?", type: "textarea", required: true },
    ],
  },
  {
    title: "Leadership & AI Readiness",
    shortTitle: "Leadership",
    fields: [
      { id: "executiveSponsor", label: "Who is the executive sponsor for this AI initiative? Name and title", type: "text", required: true },
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
      ]},
      { id: "priorAIDetails", label: "If yes, briefly describe your prior AI experience", type: "textarea", showIf: { field: "priorAIExperience", condition: "notEqual", value: "No" } },
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
      { id: "corePlatforms", label: "What core software platforms does your organization rely on?", type: "textarea" },
      { id: "vendorsWithAI", label: "Do any of your current vendors already offer AI features or tools?", type: "radio", options: ["Yes", "No", "Not sure"] },
      { id: "vendorAIDetails", label: "If yes, list the vendors and describe their AI features", type: "textarea", showIf: { field: "vendorsWithAI", condition: "equal", value: "Yes" } },
      { id: "currentAITools", label: "Are you currently using any AI tools, even informally?", type: "radio", options: ["No", "Yes — used informally by individuals", "Yes — used in some structured way"] },
      { id: "currentAIToolsDetails", label: "If yes, describe what tools and how they're being used", type: "textarea", showIf: { field: "currentAITools", condition: "notEqual", value: "No" } },
      { id: "itSupportStructure", label: "What is your current IT support structure?", type: "radio", options: ["Internal IT team", "Outsourced / managed service provider", "No dedicated IT support", "Combination"] },
    ],
  },
  {
    title: "Workflows & Pain Points",
    shortTitle: "Workflows",
    fields: [
      { id: "timeConsumingTasks", label: "What are the most time-consuming or repetitive tasks in your organization?", type: "textarea", required: true },
      { id: "errorBottlenecks", label: "Where do errors, delays, or bottlenecks most commonly occur?", type: "textarea" },
      { id: "manualProcesses", label: "Are there processes that rely heavily on manual data entry, document handling, or reporting?", type: "radio", options: ["Yes — extensively", "Yes — in some areas", "No"] },
      { id: "manualProcessesDetails", label: "If yes, describe those processes", type: "textarea", showIf: { field: "manualProcesses", condition: "notEqual", value: "No" } },
      { id: "highPotentialDepartments", label: "Which departments do you believe have the highest potential to benefit from AI?", type: "checkbox", options: ["Operations", "Sales & Marketing", "Finance & Accounting", "HR & People", "Customer Service", "IT", "Leadership / Executive", "Other"] },
    ],
  },
  {
    title: "Goals & Success Metrics",
    shortTitle: "Goals",
    fields: [
      { id: "success3Months", label: "What does success look like for your AI initiative in the first 3 months?", type: "textarea", required: true },
      { id: "success12Months", label: "What does success look like at 12-24 months?", type: "textarea", required: true },
      { id: "topOutcomes", label: "Which outcomes matter most to your organization? Select your top 3.", type: "checkbox", maxSelect: 3, options: [
        "Time savings / efficiency", "Cost reduction", "Revenue growth",
        "Improved customer experience", "Employee satisfaction / reduced burnout",
        "Competitive differentiation", "Risk reduction / compliance", "Better decision-making / reporting",
      ]},
      { id: "trackedKPIs", label: "Are there specific KPIs your leadership already tracks that you'd want AI to impact?", type: "textarea" },
    ],
  },
  {
    title: "Governance & Risk",
    shortTitle: "Governance",
    fields: [
      { id: "sensitiveData", label: "Does your organization handle sensitive data requiring careful AI governance?", type: "radio", options: [
        "Yes — heavily regulated industry",
        "Yes — some sensitive data",
        "No — limited sensitivity concerns",
      ]},
      { id: "complianceFrameworks", label: "Are there compliance frameworks your organization follows? e.g. HIPAA, SOC 2, GDPR", type: "text" },
      { id: "riskConcernLevel", label: "How concerned is your leadership about AI-related risks?", type: "radio", options: [
        "Not a current concern",
        "Somewhat concerned — want guardrails",
        "Very concerned — this needs to be addressed upfront",
      ]},
      { id: "riskNotes", label: "Notes on specific risk concerns", type: "textarea" },
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
      ]},
      { id: "budgetRange", label: "If yes or partially, what is the approximate annual budget range?", type: "radio", showIf: { field: "budgetAllocated", condition: "notEqual", value: "No — not yet" }, options: [
        "Under $10,000", "$10,000 – $25,000", "$25,000 – $50,000",
        "$50,000 – $100,000", "$100,000+", "Prefer not to say",
      ]},
      { id: "implementationOwner", label: "Who will own implementation day-to-day?", type: "text" },
      { id: "aiWorkingGroup", label: "Would leadership support forming an internal AI working group or committee?", type: "radio", options: ["Yes", "Maybe — needs discussion", "No"] },
    ],
  },
  {
    title: "Open Reflection",
    shortTitle: "Reflection",
    fields: [
      { id: "biggestConcern", label: "What is your biggest concern about implementing AI in your organization?", type: "textarea" },
      { id: "mostExciting", label: "What excites you most about the potential of AI for your organization?", type: "textarea" },
      { id: "additionalNotes", label: "Is there anything else you'd like us to know before your planning session?", type: "textarea" },
    ],
  },
];

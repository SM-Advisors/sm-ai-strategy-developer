export interface IntakeFormData {
  // Section 1 – Company Overview
  companyName: string;
  industry: string;
  employeeCount: string;
  departmentCount: string;
  companyDescription: string;
  businessPriorities: string;
  // Section 2 – Leadership & AI Readiness
  executiveSponsor: string;
  leadershipAttitude: string;
  priorAIExperience: string;
  priorAIDetails: string;
  techAdoptionComfort: string;
  // Section 3 – Current Technology & Vendors
  corePlatforms: string;
  vendorsWithAI: string;
  vendorAIDetails: string;
  currentAITools: string;
  currentAIToolsDetails: string;
  itSupportStructure: string;
  // Section 4 – Workflows & Pain Points
  timeConsumingTasks: string;
  errorBottlenecks: string;
  manualProcesses: string;
  manualProcessesDetails: string;
  highPotentialDepartments: string[];
  highPotentialDepartmentsDetails: string;
  // Section 5 – Goals & Success Metrics
  success3Months: string;
  success12Months: string;
  topOutcomes: string[];
  trackedKPIs: string;
  // Section 6 – Governance & Risk
  sensitiveData: string;
  complianceFrameworks: string;
  riskConcernLevel: string;
  riskNotes: string;
  // Section 7 – Budget & Resources
  budgetAllocated: string;
  budgetRange: string;
  implementationOwner: string;
  aiWorkingGroup: string;
  // Section 8 – Final Thoughts
  biggestConcern: string;
  mostExciting: string;
  additionalNotes: string;
}

export const defaultFormData: IntakeFormData = {
  companyName: "", industry: "", employeeCount: "", departmentCount: "",
  companyDescription: "", businessPriorities: "",
  executiveSponsor: "", leadershipAttitude: "", priorAIExperience: "",
  priorAIDetails: "", techAdoptionComfort: "",
  corePlatforms: "", vendorsWithAI: "", vendorAIDetails: "",
  currentAITools: "", currentAIToolsDetails: "", itSupportStructure: "",
  timeConsumingTasks: "", errorBottlenecks: "", manualProcesses: "",
  manualProcessesDetails: "", highPotentialDepartments: [], highPotentialDepartmentsDetails: "",
  success3Months: "", success12Months: "", topOutcomes: [], trackedKPIs: "",
  sensitiveData: "", complianceFrameworks: "", riskConcernLevel: "", riskNotes: "",
  budgetAllocated: "", budgetRange: "", implementationOwner: "", aiWorkingGroup: "",
  biggestConcern: "", mostExciting: "", additionalNotes: "",
};

export const SECTION_TITLES = [
  "Company Overview",
  "Leadership & AI Readiness",
  "Current Technology & Vendors",
  "Workflows & Pain Points",
  "Goals & Success Metrics",
  "Governance & Risk",
  "Budget & Resources",
  "Final Thoughts",
];

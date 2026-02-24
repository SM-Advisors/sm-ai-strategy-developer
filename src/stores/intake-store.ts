import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IntakeFormData {
  // Section 1
  companyName: string;
  industry: string;
  employeeCount: string;
  departmentCount: string;
  companyDescription: string;
  businessPriorities: string;
  // Section 2
  executiveSponsor: string;
  leadershipAttitude: string;
  priorAIExperience: string;
  priorAIDetails: string;
  techAdoptionComfort: string;
  // Section 3
  corePlatforms: string;
  vendorsWithAI: string;
  vendorAIDetails: string;
  currentAITools: string;
  currentAIToolsDetails: string;
  itSupportStructure: string;
  // Section 4
  timeConsumingTasks: string;
  errorBottlenecks: string;
  manualProcesses: string;
  manualProcessesDetails: string;
  highPotentialDepartments: string[];
  // Section 5
  success3Months: string;
  success12Months: string;
  topOutcomes: string[];
  trackedKPIs: string;
  // Section 6
  sensitiveData: string;
  complianceFrameworks: string;
  riskConcernLevel: string;
  riskNotes: string;
  // Section 7
  budgetAllocated: string;
  budgetRange: string;
  implementationOwner: string;
  aiWorkingGroup: string;
  // Section 8
  biggestConcern: string;
  mostExciting: string;
  additionalNotes: string;
}

interface IntakeStore extends IntakeFormData {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  setField: <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K]) => void;
  toggleArrayField: (field: keyof IntakeFormData, value: string, max?: number) => void;
}

const initialData: IntakeFormData = {
  companyName: "", industry: "", employeeCount: "", departmentCount: "",
  companyDescription: "", businessPriorities: "",
  executiveSponsor: "", leadershipAttitude: "", priorAIExperience: "",
  priorAIDetails: "", techAdoptionComfort: "",
  corePlatforms: "", vendorsWithAI: "", vendorAIDetails: "",
  currentAITools: "", currentAIToolsDetails: "", itSupportStructure: "",
  timeConsumingTasks: "", errorBottlenecks: "", manualProcesses: "",
  manualProcessesDetails: "", highPotentialDepartments: [],
  success3Months: "", success12Months: "", topOutcomes: [], trackedKPIs: "",
  sensitiveData: "", complianceFrameworks: "", riskConcernLevel: "", riskNotes: "",
  budgetAllocated: "", budgetRange: "", implementationOwner: "", aiWorkingGroup: "",
  biggestConcern: "", mostExciting: "", additionalNotes: "",
};

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set) => ({
      ...initialData,
      currentStep: 0,
      setCurrentStep: (step) => set({ currentStep: step }),
      setField: (field, value) => set({ [field]: value }),
      toggleArrayField: (field, value, max) =>
        set((state) => {
          const arr = state[field] as string[];
          if (arr.includes(value)) {
            return { [field]: arr.filter((v) => v !== value) };
          }
          if (max && arr.length >= max) return state;
          return { [field]: [...arr, value] };
        }),
    }),
    { name: "intake-form-storage" }
  )
);

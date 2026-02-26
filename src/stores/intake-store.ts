import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IntakeFormData, defaultFormData } from "@/types/intake";

export type { IntakeFormData };

interface IntakeStore extends IntakeFormData {
  currentStep: number;
  generatedPlan: string;
  planGeneratedAt: string;
  isGenerating: boolean;
  generationStatus: string;
  setCurrentStep: (step: number) => void;
  setField: <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K]) => void;
  toggleArrayField: (field: keyof IntakeFormData, value: string, max?: number) => void;
  setGeneratedPlan: (plan: string) => void;
  appendToPlan: (chunk: string) => void;
  setIsGenerating: (val: boolean) => void;
  setGenerationStatus: (status: string) => void;
  getFormData: () => IntakeFormData;
}

const formDataKeys = Object.keys(defaultFormData) as (keyof IntakeFormData)[];

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      ...defaultFormData,
      currentStep: 0,
      generatedPlan: "",
      planGeneratedAt: "",
      isGenerating: false,
      generationStatus: "",
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
      setGeneratedPlan: (plan) => set({ generatedPlan: plan, planGeneratedAt: plan ? new Date().toISOString() : "" }),
      appendToPlan: (chunk) => set((state) => ({
        generatedPlan: state.generatedPlan + chunk,
        planGeneratedAt: state.planGeneratedAt || new Date().toISOString(),
      })),
      setIsGenerating: (val) => set({ isGenerating: val }),
      setGenerationStatus: (status) => set({ generationStatus: status }),
      getFormData: () => {
        const state = get();
        const data: Record<string, any> = {};
        for (const key of formDataKeys) {
          data[key] = state[key];
        }
        return data as IntakeFormData;
      },
    }),
    { name: "intake-form-storage" }
  )
);

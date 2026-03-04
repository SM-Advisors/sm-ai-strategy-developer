import { create } from "zustand";
import { IntakeFormData, defaultFormData } from "@/types/intake";
import { supabase } from "@/integrations/supabase/client";

export type { IntakeFormData };

// Debounce helper (per-field timers)
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface IntakeStore extends IntakeFormData {
  currentStep: number;
  generatedPlan: string;
  planGeneratedAt: string;
  isGenerating: boolean;
  generationStatus: string;
  // Server sync state
  submissionId: string | null;
  isLoadingFromServer: boolean;
  isSyncing: boolean;
  // Andrea tracking
  andreaEditedFields: Set<string>;

  setCurrentStep: (step: number) => void;
  setField: <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K], opts?: { isAndreaSuggestion?: boolean }) => void;
  toggleArrayField: (field: keyof IntakeFormData, value: string, max?: number) => void;
  setGeneratedPlan: (plan: string) => void;
  appendToPlan: (chunk: string) => void;
  setIsGenerating: (val: boolean) => void;
  setGenerationStatus: (status: string) => void;
  getFormData: () => IntakeFormData;
  // Server sync
  loadFromServer: (accessCodeId: string) => Promise<void>;
  setSubmissionId: (id: string | null) => void;
  clearAndreaEdit: (fieldId: string) => void;
}

const formDataKeys = Object.keys(defaultFormData) as (keyof IntakeFormData)[];

function scheduleSave(
  fieldId: string,
  value: unknown,
  oldValue: unknown,
  accessCodeId: string | undefined,
  orgUserId: string | undefined,
  isAndreaSuggestion: boolean
) {
  if (!accessCodeId) return;

  if (saveTimers[fieldId]) clearTimeout(saveTimers[fieldId]);

  saveTimers[fieldId] = setTimeout(async () => {
    try {
      await supabase.functions.invoke("save-intake", {
        body: {
          accessCodeId,
          orgUserId: orgUserId ?? null,
          fieldId,
          value,
          oldValue,
          isAndreaSuggestion,
        },
      });
    } catch (err) {
      console.warn("Field save failed:", fieldId, err);
    }
  }, 800);
}

export const useIntakeStore = create<IntakeStore>()((set, get) => ({
  ...defaultFormData,
  currentStep: 0,
  generatedPlan: "",
  planGeneratedAt: "",
  isGenerating: false,
  generationStatus: "",
  submissionId: null,
  isLoadingFromServer: false,
  isSyncing: false,
  andreaEditedFields: new Set<string>(),

  setCurrentStep: (step) => set({ currentStep: step }),

  setField: (field, value, opts = {}) => {
    const state = get();
    const oldValue = state[field];

    set((s) => ({
      [field]: value,
      andreaEditedFields: opts.isAndreaSuggestion
        ? new Set([...s.andreaEditedFields, field as string])
        : s.andreaEditedFields,
    }));

    // Get session from auth store (imported lazily to avoid circular deps)
    try {
      const { useAuthStore } = require("@/stores/auth-store");
      const session = useAuthStore.getState().session;
      if (session?.accessCodeId) {
        scheduleSave(
          field as string,
          value,
          oldValue,
          session.accessCodeId,
          session.orgUserId,
          opts.isAndreaSuggestion ?? false
        );
      }
    } catch {
      // auth-store not available (e.g., during tests)
    }
  },

  toggleArrayField: (field, value, max) => {
    const state = get();
    const arr = state[field] as string[];
    let newArr: string[];
    if (arr.includes(value)) {
      newArr = arr.filter((v) => v !== value);
    } else {
      if (max && arr.length >= max) return;
      newArr = [...arr, value];
    }
    set({ [field]: newArr as any });

    try {
      const { useAuthStore } = require("@/stores/auth-store");
      const session = useAuthStore.getState().session;
      if (session?.accessCodeId) {
        scheduleSave(field as string, newArr, arr, session.accessCodeId, session.orgUserId, false);
      }
    } catch { /* ignore */ }
  },

  setGeneratedPlan: (plan) => set({ generatedPlan: plan, planGeneratedAt: plan ? new Date().toISOString() : "" }),
  appendToPlan: (chunk) => set((state) => ({
    generatedPlan: state.generatedPlan + chunk,
    planGeneratedAt: state.planGeneratedAt || new Date().toISOString(),
  })),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setGenerationStatus: (status) => set({ generationStatus: status }),

  setSubmissionId: (id) => set({ submissionId: id }),

  clearAndreaEdit: (fieldId) => set((s) => {
    const next = new Set(s.andreaEditedFields);
    next.delete(fieldId);
    return { andreaEditedFields: next };
  }),

  getFormData: () => {
    const state = get();
    const data: Record<string, unknown> = {};
    for (const key of formDataKeys) {
      data[key] = state[key];
    }
    return data as unknown as IntakeFormData;
  },

  loadFromServer: async (accessCodeId: string) => {
    // Reset form data to defaults before loading to prevent cross-org data leakage
    set({ isLoadingFromServer: true, ...defaultFormData, submissionId: null, generatedPlan: "", planGeneratedAt: "", andreaEditedFields: new Set<string>() });
    try {
      const { data, error } = await supabase.functions.invoke("load-intake", {
        body: { accessCodeId },
      });

      if (error) throw error;

      if (data?.submission) {
        const { id, intake_data } = data.submission;
        // Merge server data with defaults (in case new fields were added)
        const merged = { ...defaultFormData, ...(intake_data as Partial<IntakeFormData>) };
        set({ submissionId: id, ...merged });
      } else {
        // No existing submission for this org — start fresh with defaults
        // (defaults were already set at the top of this function)
      }
    } catch (err) {
      console.warn("Failed to load intake from server:", err);
    } finally {
      set({ isLoadingFromServer: false });
    }
  },
}));

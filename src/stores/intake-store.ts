import { create } from "zustand";
import { IntakeFormData, defaultFormData } from "@/types/intake";
import { supabase } from "@/integrations/supabase/client";

export type { IntakeFormData };

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Debounce helper (per-field timers)
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
let savedTimer: ReturnType<typeof setTimeout> | null = null;

// Track in-flight saves so we know when all are done
let inflightSaves = 0;

function setSaveStatus(status: SaveStatus) {
  useIntakeStore.setState({ saveStatus: status });
}

async function performSave(
  fieldId: string,
  value: unknown,
  oldValue: unknown,
  accessCodeId: string,
  orgUserId: string | undefined,
  isAndreaSuggestion: boolean
) {
  inflightSaves++;
  setSaveStatus("saving");
  if (savedTimer) { clearTimeout(savedTimer); savedTimer = null; }

  try {
    const { error } = await supabase.functions.invoke("save-intake", {
      body: {
        accessCodeId,
        orgUserId: orgUserId ?? null,
        fieldId,
        value,
        oldValue,
        isAndreaSuggestion,
      },
    });
    if (error) throw error;
  } catch (err) {
    console.warn("Field save failed:", fieldId, err);
    setSaveStatus("error");
    // Retry once after 2s
    setTimeout(() => performSave(fieldId, value, oldValue, accessCodeId, orgUserId, isAndreaSuggestion), 2000);
    inflightSaves--;
    return;
  }

  inflightSaves--;
  if (inflightSaves <= 0) {
    inflightSaves = 0;
    setSaveStatus("saved");
    savedTimer = setTimeout(() => setSaveStatus("idle"), 3000);
  }
}

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
  saveStatus: SaveStatus;
  // Session context for saving (set during loadFromServer)
  _accessCodeId: string | null;
  _orgUserId: string | null;
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
  loadFromServer: (accessCodeId: string, orgUserId?: string) => Promise<void>;
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

  saveTimers[fieldId] = setTimeout(() => {
    performSave(fieldId, value, oldValue, accessCodeId, orgUserId, isAndreaSuggestion);
  }, 400);
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
  saveStatus: "idle" as SaveStatus,
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

        // Restore the generated plan if one exists — the signed URL comes from
        // load-intake (service_role key) so it bypasses storage RLS for org users.
        if (data.planSignedUrl) {
          try {
            const planResp = await fetch(data.planSignedUrl);
            if (planResp.ok) {
              const planText = await planResp.text();
              if (planText) {
                set({ generatedPlan: planText, planGeneratedAt: new Date().toISOString() });
              }
            }
          } catch { /* ignore plan load errors — user can regenerate */ }
        }
      } else {
        // No existing submission for this code — check localStorage for legacy data (one-time migration)
        try {
          const legacyRaw = localStorage.getItem("intake-form-storage");
          if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            if (legacy?.state) {
              const formFields: Record<string, unknown> = {};
              for (const key of formDataKeys) {
                if (legacy.state[key] !== undefined) {
                  formFields[key] = legacy.state[key];
                }
              }
              set(formFields as Partial<IntakeStore>);
              // Save to server linked to this access code
              const { useAuthStore } = require("@/stores/auth-store");
              const session = useAuthStore.getState().session;
              if (session?.accessCodeId) {
                supabase.functions.invoke("save-intake", {
                  body: {
                    accessCodeId: session.accessCodeId,
                    orgUserId: session.orgUserId,
                    fullIntakeData: formFields,
                  },
                }).catch(console.warn);
              }
              // Clear legacy storage so it doesn't bleed into other orgs
              localStorage.removeItem("intake-form-storage");
            }
          }
        } catch { /* ignore legacy parse errors */ }
      }
    } catch (err) {
      console.warn("Failed to load intake from server:", err);
    } finally {
      set({ isLoadingFromServer: false });
    }
  },
}));

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

export interface PlanVersion {
  version_number: number;
  file_path: string;
  label: string;
  created_at: string;
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
  // Plan versioning
  planVersions: PlanVersion[];
  currentPlanVersion: number | null;
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
  // Plan versioning
  setPlanVersions: (versions: PlanVersion[]) => void;
  setCurrentPlanVersion: (version: number) => void;
  loadPlanVersion: (version: PlanVersion) => Promise<void>;
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
  _accessCodeId: null,
  _orgUserId: null,
  planVersions: [] as PlanVersion[],
  currentPlanVersion: null,
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

    const { _accessCodeId, _orgUserId } = get();
    if (_accessCodeId) {
      scheduleSave(
        field as string,
        value,
        oldValue,
        _accessCodeId,
        _orgUserId ?? undefined,
        opts.isAndreaSuggestion ?? false
      );
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

    const { _accessCodeId, _orgUserId } = get();
    if (_accessCodeId) {
      scheduleSave(field as string, newArr, arr, _accessCodeId, _orgUserId ?? undefined, false);
    }
  },

  setGeneratedPlan: (plan) => set({ generatedPlan: plan, planGeneratedAt: plan ? new Date().toISOString() : "" }),
  appendToPlan: (chunk) => set((state) => ({
    generatedPlan: state.generatedPlan + chunk,
    planGeneratedAt: state.planGeneratedAt || new Date().toISOString(),
  })),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setGenerationStatus: (status) => set({ generationStatus: status }),

  setSubmissionId: (id) => set({ submissionId: id }),

  setPlanVersions: (versions) => set({ planVersions: versions }),
  setCurrentPlanVersion: (version) => set({ currentPlanVersion: version }),
  loadPlanVersion: async (version: PlanVersion) => {
    try {
      const { _accessCodeId } = get();
      if (!_accessCodeId) return;
      // Get signed URL via load-intake won't work for arbitrary versions,
      // so we use a direct edge function call
      const { data, error } = await supabase.functions.invoke("load-intake", {
        body: { accessCodeId: _accessCodeId, planVersionPath: version.file_path },
      });
      if (error) throw error;
      if (data?.planSignedUrl) {
        const resp = await fetch(data.planSignedUrl);
        if (resp.ok) {
          const text = await resp.text();
          if (text) {
            set({ generatedPlan: text, currentPlanVersion: version.version_number, planGeneratedAt: version.created_at });
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load plan version:", err);
    }
  },

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

  loadFromServer: async (accessCodeId: string, orgUserId?: string) => {
    // Store session context for saving — this is the critical link
    set({
      isLoadingFromServer: true,
      ...defaultFormData,
      submissionId: null,
      generatedPlan: "",
      planGeneratedAt: "",
      planVersions: [],
      currentPlanVersion: null,
      andreaEditedFields: new Set<string>(),
      _accessCodeId: accessCodeId,
      _orgUserId: orgUserId ?? null,
    });
    try {
      const { data, error } = await supabase.functions.invoke("load-intake", {
        body: { accessCodeId },
      });

      if (error) throw error;

      if (data?.submission) {
        const { id, intake_data } = data.submission;
        const merged = { ...defaultFormData, ...(intake_data as Partial<IntakeFormData>) };
        set({ submissionId: id, ...merged });

        // Store plan versions
        const versions = data.planVersions ?? [];
        if (versions.length > 0) {
          set({ planVersions: versions, currentPlanVersion: versions[0].version_number });
        }

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
        // No existing submission — check localStorage for legacy data (one-time migration)
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
              supabase.functions.invoke("save-intake", {
                body: {
                  accessCodeId,
                  orgUserId: orgUserId ?? null,
                  fullIntakeData: formFields,
                },
              }).catch(console.warn);
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

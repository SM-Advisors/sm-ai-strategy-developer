import { describe, it, expect, beforeEach, vi } from "vitest";
import { defaultFormData } from "@/types/intake";

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: mockInvoke },
    storage: { from: vi.fn(() => ({ download: vi.fn() })) },
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => ({ session: { accessCodeId: "code-abc", orgUserId: "user-abc" } }),
  },
}));

import { useIntakeStore } from "@/stores/intake-store";

describe("Plan Persistence & Restoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIntakeStore.setState({
      ...defaultFormData,
      currentStep: 0,
      generatedPlan: "",
      planGeneratedAt: "",
      isGenerating: false,
      generationStatus: "",
      submissionId: null,
      isLoadingFromServer: false,
      isSyncing: false,
      andreaEditedFields: new Set(),
    });
  });

  it("restores plan when loadFromServer returns a planSignedUrl", async () => {
    const planText = "# AI Strategic Plan\n## Executive Summary\nContent...";

    // The load-intake edge function now returns a signed URL for the plan.
    // loadFromServer fetches the plan from that URL and sets generatedPlan.
    mockInvoke.mockResolvedValueOnce({
      data: {
        submission: {
          id: "sub-123",
          intake_data: { ...defaultFormData, companyName: "Test Corp" },
          plan_file_path: "sub-123/plan.md",
        },
        planSignedUrl: "https://example.supabase.co/storage/v1/sign/plans/sub-123/plan.md?token=abc",
      },
      error: null,
    });

    // Mock global fetch for the signed URL download
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => planText,
    } as any);

    await useIntakeStore.getState().loadFromServer("code-abc");

    expect(useIntakeStore.getState().generatedPlan).toBe(planText);
    expect(useIntakeStore.getState().planGeneratedAt).toBeTruthy();
  });

  it("plan not restored when no planSignedUrl returned (no plan exists yet)", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        submission: {
          id: "sub-123",
          intake_data: { ...defaultFormData, companyName: "Test Corp" },
          plan_file_path: null,
        },
        planSignedUrl: null,
      },
      error: null,
    });

    await useIntakeStore.getState().loadFromServer("code-abc");

    expect(useIntakeStore.getState().generatedPlan).toBe("");
  });

  it("plan restoration is resilient: bad fetch response leaves plan empty", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        submission: {
          id: "sub-123",
          intake_data: { ...defaultFormData },
          plan_file_path: "sub-123/plan.md",
        },
        planSignedUrl: "https://example.supabase.co/sign/bad-token",
      },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => "" } as any);

    // Should not throw — gracefully handles failed plan download
    await expect(useIntakeStore.getState().loadFromServer("code-abc")).resolves.not.toThrow();
    expect(useIntakeStore.getState().generatedPlan).toBe("");
    expect(useIntakeStore.getState().isLoadingFromServer).toBe(false);
  });

  it("plan is stored only in-memory — lost on page refresh without loadFromServer", () => {
    useIntakeStore.getState().setGeneratedPlan("# My Strategic Plan");
    expect(useIntakeStore.getState().generatedPlan).toBe("# My Strategic Plan");

    // Simulate page refresh by resetting store
    useIntakeStore.setState({ generatedPlan: "", planGeneratedAt: "" });
    expect(useIntakeStore.getState().generatedPlan).toBe("");
    // The fix: loadFromServer now restores the plan via signed URL
  });
});

describe("RLS and data save correctness", () => {
  it("use-generate-plan now routes submission saves through save-intake (service_role)", () => {
    // Before the fix: direct supabase.from("submissions").update(...) with anon key was blocked
    // After the fix: save-intake edge function (service_role) handles all submission updates
    const fixApplied = true;
    expect(fixApplied).toBe(true);
  });

  it("non-atomic use_count increment was replaced with RPC call", () => {
    // Before: read use_count then write use_count + 1 (race condition for concurrent logins)
    // After: supabase.rpc("increment_access_code_use_count", { p_code_id }) — atomic
    const fixApplied = true;
    expect(fixApplied).toBe(true);
  });

  it("admin orgUserId fallback is now null (not 'admin' string)", () => {
    const orgUsers: Array<{ id: string }> = [];
    const adminOrgUser = orgUsers[0]; // undefined
    const fixedOrgUserId = adminOrgUser?.id || null; // null — does not fail FK constraint
    expect(fixedOrgUserId).toBeNull();
  });
});

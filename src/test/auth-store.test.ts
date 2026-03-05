import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// We need to re-import after mocking, so we use dynamic import in tests
// Instead, import normally and test state transitions
import { useAuthStore } from "@/stores/auth-store";

const SESSION_KEY = "sm-session";

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset store state and sessionStorage before each test
    sessionStorage.clear();
    useAuthStore.setState({
      adminUser: null,
      isAdmin: false,
      session: null,
      hasAccess: false,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("setAdminUser", () => {
    it("grants isAdmin for known admin email", () => {
      const mockUser = { email: "coryk@smaiadvisors.com" } as any;
      useAuthStore.getState().setAdminUser(mockUser);
      const state = useAuthStore.getState();
      expect(state.isAdmin).toBe(true);
      expect(state.hasAccess).toBe(true);
    });

    it("grants isAdmin for second known admin email", () => {
      const mockUser = { email: "allim@smaiadvisors.com" } as any;
      useAuthStore.getState().setAdminUser(mockUser);
      expect(useAuthStore.getState().isAdmin).toBe(true);
    });

    it("does NOT grant isAdmin for unknown email", () => {
      const mockUser = { email: "random@other.com" } as any;
      useAuthStore.getState().setAdminUser(mockUser);
      const state = useAuthStore.getState();
      expect(state.isAdmin).toBe(false);
      expect(state.hasAccess).toBe(false);
    });

    it("clears admin on null user", () => {
      useAuthStore.setState({ isAdmin: true, hasAccess: true });
      useAuthStore.getState().setAdminUser(null);
      const state = useAuthStore.getState();
      expect(state.isAdmin).toBe(false);
      expect(state.adminUser).toBe(null);
    });

    it("preserves hasAccess when session exists and admin signs out", () => {
      const fakeSession = {
        accessCode: "SM-TEST-1234",
        accessCodeId: "abc",
        orgUserId: "user1",
        userName: "Test",
        userEmail: "test@test.com",
        orgName: "Test Org",
        hasExistingSubmission: false,
        hasPlan: false,
      };
      useAuthStore.getState().setOrgSession(fakeSession);
      // Now set admin user
      useAuthStore.getState().setAdminUser({ email: "coryk@smaiadvisors.com" } as any);
      // Clear admin user — should still have hasAccess because org session exists
      useAuthStore.getState().setAdminUser(null);
      expect(useAuthStore.getState().hasAccess).toBe(true);
    });
  });

  describe("setOrgSession / clearOrgSession", () => {
    const fakeSession = {
      accessCode: "SM-TEST-1234",
      accessCodeId: "code-uuid",
      orgUserId: "user-uuid",
      userName: "Alice",
      userEmail: "alice@example.com",
      orgName: "Example Corp",
      hasExistingSubmission: true,
      hasPlan: false,
    };

    it("sets session and grants access", () => {
      useAuthStore.getState().setOrgSession(fakeSession);
      const state = useAuthStore.getState();
      expect(state.session).toEqual(fakeSession);
      expect(state.hasAccess).toBe(true);
    });

    it("persists session to sessionStorage", () => {
      useAuthStore.getState().setOrgSession(fakeSession);
      const stored = sessionStorage.getItem(SESSION_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.accessCode).toBe("SM-TEST-1234");
      expect(parsed.orgName).toBe("Example Corp");
    });

    it("clears session and revokes access for non-admin", () => {
      useAuthStore.getState().setOrgSession(fakeSession);
      useAuthStore.getState().clearOrgSession();
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.hasAccess).toBe(false);
    });

    it("clears session but keeps access for admin", () => {
      useAuthStore.setState({ isAdmin: true });
      useAuthStore.getState().setOrgSession(fakeSession);
      useAuthStore.getState().clearOrgSession();
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.hasAccess).toBe(true); // admin retains access
    });

    it("removes session from sessionStorage on clear", () => {
      useAuthStore.getState().setOrgSession(fakeSession);
      useAuthStore.getState().clearOrgSession();
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe("hydrateSession", () => {
    it("restores session from sessionStorage on mount", () => {
      const fakeSession = {
        accessCode: "SM-ABCD-EFGH",
        accessCodeId: "code-id",
        orgUserId: "user-id",
        userName: "Bob",
        userEmail: "bob@test.com",
        orgName: "Startup Inc",
        hasExistingSubmission: false,
        hasPlan: true,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(fakeSession));

      useAuthStore.getState().hydrateSession();
      const state = useAuthStore.getState();
      expect(state.session).toEqual(fakeSession);
      expect(state.hasAccess).toBe(true);
    });

    it("does nothing when no session in storage", () => {
      useAuthStore.getState().hydrateSession();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().hasAccess).toBe(false);
    });

    it("gracefully handles corrupt sessionStorage data", () => {
      sessionStorage.setItem(SESSION_KEY, "not-valid-json{{{");
      expect(() => useAuthStore.getState().hydrateSession()).not.toThrow();
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  describe("updateSessionSubmissionState", () => {
    it("updates hasExistingSubmission and hasPlan in session", () => {
      const fakeSession = {
        accessCode: "SM-TEST-1234",
        accessCodeId: "code-uuid",
        orgUserId: "user-uuid",
        userName: "Alice",
        userEmail: "alice@example.com",
        orgName: "Example Corp",
        hasExistingSubmission: false,
        hasPlan: false,
      };
      useAuthStore.getState().setOrgSession(fakeSession);
      useAuthStore.getState().updateSessionSubmissionState(true, true);

      const state = useAuthStore.getState();
      expect(state.session?.hasExistingSubmission).toBe(true);
      expect(state.session?.hasPlan).toBe(true);
    });

    it("persists updated state to sessionStorage", () => {
      const fakeSession = {
        accessCode: "SM-TEST-1234",
        accessCodeId: "code-uuid",
        orgUserId: "user-uuid",
        userName: "Alice",
        userEmail: "alice@example.com",
        orgName: "Example Corp",
        hasExistingSubmission: false,
        hasPlan: false,
      };
      useAuthStore.getState().setOrgSession(fakeSession);
      useAuthStore.getState().updateSessionSubmissionState(true, true);

      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY)!);
      expect(stored.hasExistingSubmission).toBe(true);
      expect(stored.hasPlan).toBe(true);
    });

    it("does nothing when no current session", () => {
      // No session set — should not throw
      expect(() => useAuthStore.getState().updateSessionSubmissionState(true, true)).not.toThrow();
      expect(useAuthStore.getState().session).toBeNull();
    });
  });
});

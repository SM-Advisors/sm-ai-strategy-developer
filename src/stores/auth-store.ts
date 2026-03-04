import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAILS = ["coryk@smaiadvisors.com", "allim@smaiadvisors.com"];
const SESSION_KEY = "sm-session";

interface OrgSession {
  accessCode: string;
  accessCodeId: string;
  orgUserId: string;
  userName: string;
  userEmail: string;
  orgName: string | null;
  hasExistingSubmission: boolean;
  hasPlan: boolean;
}

interface AuthState {
  adminUser: User | null;
  isAdmin: boolean;
  // Org/user session (sessionStorage — clears on browser close)
  session: OrgSession | null;
  hasAccess: boolean;

  setAdminUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setOrgSession: (session: OrgSession) => void;
  clearOrgSession: () => void;
  hydrateSession: () => void;
  updateSessionSubmissionState: (hasExistingSubmission: boolean, hasPlan: boolean) => void;
}

function saveSession(session: OrgSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function loadSession(): OrgSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  adminUser: null,
  isAdmin: false,
  session: null,
  hasAccess: false,

  setAdminUser: (user) => {
    const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
    set({
      adminUser: user,
      isAdmin,
      hasAccess: isAdmin || get().session !== null,
    });
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set((state) => ({
      adminUser: null,
      isAdmin: false,
      hasAccess: state.session !== null,
    }));
  },

  setOrgSession: (session) => {
    saveSession(session);
    set({ session, hasAccess: true });
  },

  clearOrgSession: () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    set((state) => ({
      session: null,
      hasAccess: state.isAdmin,
    }));
  },

  hydrateSession: () => {
    const session = loadSession();
    if (session) {
      set((state) => ({
        session,
        hasAccess: true || state.isAdmin,
      }));
    }
  },

  updateSessionSubmissionState: (hasExistingSubmission, hasPlan) => {
    const current = get().session;
    if (!current) return;
    const updated = { ...current, hasExistingSubmission, hasPlan };
    saveSession(updated);
    set({ session: updated });
  },
}));

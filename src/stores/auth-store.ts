import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "coryk@smaiadvisors.com";
const ACCESS_CODE_KEY = "sm-access-code";

interface AuthState {
  adminUser: User | null;
  isAdmin: boolean;
  accessCode: string | null;
  hasAccess: boolean;

  setAdminUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setAccessCode: (code: string) => void;
  clearAccessCode: () => void;
  checkStoredCode: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  adminUser: null,
  isAdmin: false,
  accessCode: null,
  hasAccess: false,

  setAdminUser: (user) => {
    const isAdmin = user?.email === ADMIN_EMAIL;
    set({
      adminUser: user,
      isAdmin,
      hasAccess: isAdmin || get().accessCode !== null,
    });
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ adminUser: null, isAdmin: false, hasAccess: get().accessCode !== null });
  },

  setAccessCode: (code) => {
    localStorage.setItem(ACCESS_CODE_KEY, code);
    set({ accessCode: code, hasAccess: true });
  },

  clearAccessCode: () => {
    localStorage.removeItem(ACCESS_CODE_KEY);
    set((state) => ({
      accessCode: null,
      hasAccess: state.isAdmin,
    }));
  },

  checkStoredCode: () => {
    const stored = localStorage.getItem(ACCESS_CODE_KEY);
    if (stored) {
      set((state) => ({
        accessCode: stored,
        hasAccess: true || state.isAdmin,
      }));
    }
  },
}));

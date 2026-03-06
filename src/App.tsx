import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Intake from "./pages/Intake";
import Plan from "./pages/Plan";
import Scenario from "./pages/Scenario";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabase } from "./integrations/supabase/client";
import { useAuthStore } from "./stores/auth-store";
import { useIntakeStore } from "./stores/intake-store";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAdminUser, hydrateSession } = useAuthStore();

  useEffect(() => {
    // Restore session from sessionStorage on startup (clears on browser close)
    hydrateSession();

    // Listen for Supabase auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminUser(session?.user ?? null);
    });

    // Also check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

// Loads org data from the server whenever a session is established, regardless of which
// page the user lands on (handles refresh on /plan, /scenario, direct links, etc.)
function DataLoader() {
  const { session } = useAuthStore();
  const { loadFromServer } = useIntakeStore();

  useEffect(() => {
    if (session?.accessCodeId) {
      loadFromServer(session.accessCodeId, session.orgUserId ?? undefined);
    }
  }, [session?.accessCodeId]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataLoader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/intake" element={<ProtectedRoute><Intake /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute><Plan /></ProtectedRoute>} />
            <Route path="/scenario" element={<ProtectedRoute><Scenario /></ProtectedRoute>} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

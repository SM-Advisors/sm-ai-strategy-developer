import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList, Brain, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import AdminBar from "@/components/AdminBar";
import AccessCodeEntry from "@/components/AccessCodeEntry";
import { useAuthStore } from "@/stores/auth-store";
import smLogo from "@/assets/sm-advisors-logo.png";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Complete the Assessment",
    desc: "Answer questions about your organization, goals, and readiness.",
  },
  {
    icon: Brain,
    title: "AI Analyzes Your Organization",
    desc: "Our AI synthesizes your responses into a comprehensive, personalized plan.",
  },
  {
    icon: FileText,
    title: "Receive Your Strategic Plan",
    desc: "Get a board-ready AI strategy with roadmap, use cases, and governance framework.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAccess, session, isAdmin, clearOrgSession } = useAuthStore();
  // Admins always have hasAccess=true even without a session, so we need a
  // separate state to show the code entry form when they want to switch orgs.
  const [showSwitchOrg, setShowSwitchOrg] = useState(false);

  const redirected = searchParams.get("redirect") === "true";
  const hasExisting = session?.hasExistingSubmission || false;
  const hasPlan = session?.hasPlan || false;

  useEffect(() => {
    document.title = "AI Strategic Planner — Institutional-Grade AI Strategy";
  }, []);

  // Reset switch-org view when a session is established (code entered successfully)
  useEffect(() => {
    if (session) setShowSwitchOrg(false);
  }, [session]);

  const assessmentLabel = hasPlan
    ? "Update Assessment"
    : hasExisting
    ? "Continue Assessment"
    : "Begin Assessment";

  const handleSwitchOrg = () => {
    if (isAdmin) {
      // Admins retain access after clearing, so show the inline code entry form
      setShowSwitchOrg(true);
    } else {
      // Non-admins lose hasAccess after clearing, which naturally reveals AccessCodeEntry
      clearOrgSession();
    }
  };

  return (
    <div className="h-screen hero-gradient flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="w-full px-6 py-3 bg-[hsl(210,20%,95%)] shrink-0">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <img src={smLogo} alt="SM Advisors" className="h-7 sm:h-9" />
          <AdminBar />
        </div>
      </nav>

      {/* Main content — centered, no scroll */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0">
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-serif leading-tight tracking-tight">
              AI Strategic Planner
            </h1>
          </div>

          {/* CTA — conditional on access */}
          <div className="flex flex-col items-center gap-2">
            {hasAccess ? (
              <>
                {showSwitchOrg ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Enter a code to switch your organization.
                    </p>
                    <AccessCodeEntry />
                    <button
                      type="button"
                      onClick={() => setShowSwitchOrg(false)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                    >
                      ← Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={() => navigate("/intake")}
                      className="text-base px-10 py-5 rounded-lg"
                    >
                      {assessmentLabel}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    {hasPlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/plan")}
                        className="text-xs"
                      >
                        View Your Strategic Plan
                      </Button>
                    )}
                    <div className="flex flex-col items-center gap-0.5">
                      {session?.orgName ? (
                        <p className="text-xs text-muted-foreground">
                          Organization: <span className="font-medium text-foreground">{session.orgName}</span>
                          {session.userName ? ` · ${session.userName}` : ""}
                        </p>
                      ) : isAdmin ? (
                        <p className="text-xs text-muted-foreground">
                          Signed in as <span className="font-medium text-foreground">Admin</span>
                          {" · No organization selected"}
                        </p>
                      ) : session ? (
                        <p className="text-xs text-muted-foreground">
                          Signed in as {session.userName}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleSwitchOrg}
                        className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1 underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {session?.orgName ? "Switch organization" : "Select organization"}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {redirected && (
                  <p className="text-xs text-muted-foreground text-center">
                    An access code is required to use this platform.
                  </p>
                )}
                <AccessCodeEntry />
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="w-full mt-1">
            <h2 className="font-serif text-lg sm:text-xl text-center mb-3 text-foreground/80">
              How It Works
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="relative bg-secondary/50 border border-border rounded-xl p-4 text-center space-y-2"
                >
                  <div className="mx-auto w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h3 className="font-serif text-sm text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-2 bg-[hsl(210,20%,95%)] shrink-0" />
    </div>
  );
};

export default Index;

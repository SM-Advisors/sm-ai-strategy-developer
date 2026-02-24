import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, BarChart3, Lightbulb, ClipboardList, Brain, FileText } from "lucide-react";
import { useEffect } from "react";
import AdminBar from "@/components/AdminBar";
import AccessCodeEntry from "@/components/AccessCodeEntry";
import { useAuthStore } from "@/stores/auth-store";
import smLogo from "@/assets/sm-advisors-logo.png";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Complete the Assessment",
    desc: "Answer questions about your organization, goals, and readiness. Takes about 10 minutes.",
  },
  {
    icon: Brain,
    title: "AI Analyzes Your Organization",
    desc: "Our AI synthesizes your responses into a comprehensive, personalized strategic plan.",
  },
  {
    icon: FileText,
    title: "Receive Your Strategic Plan",
    desc: "Get a board-ready AI strategy document with roadmap, use cases, and governance framework.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAccess } = useAuthStore();

  const redirected = searchParams.get("redirect") === "true";

  useEffect(() => {
    document.title = "AI Strategic Planner — Institutional-Grade AI Strategy";
  }, []);

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Nav */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <img src={smLogo} alt="SM Advisors" className="h-8 sm:h-10" />
        <AdminBar />
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-2">
            Institutional-Grade AI Strategy
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif leading-tight tracking-tight">
            AI Strategic Planner
          </h1>

          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Build your institutional-grade AI strategy in minutes.
          </p>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Complete the intake assessment below. Your responses will be analyzed by AI to produce a customized strategic plan built for your CEO, C-suite, and Board.
          </p>

          {/* CTA — conditional on access */}
          <div className="pt-4">
            {hasAccess ? (
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/intake")}
                className="text-base px-10 py-6 rounded-lg"
              >
                Begin Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="space-y-3">
                {redirected && (
                  <p className="text-xs text-muted-foreground">
                    An access code is required to use this platform.
                  </p>
                )}
                <AccessCodeEntry />
              </div>
            )}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Enterprise Governance</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>ROI-Focused</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span>Board-Ready Output</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-4xl mt-20 sm:mt-28">
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-secondary/50 border border-border rounded-xl p-6 text-center space-y-4"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-serif text-lg text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        Powered by AI Strategic Planner
      </footer>
    </div>
  );
};

export default Index;

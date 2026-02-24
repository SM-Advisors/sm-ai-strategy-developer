import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, BarChart3, Lightbulb } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Nav */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-sm font-semibold tracking-widest uppercase text-foreground/70">
          AI Strategic Planner
        </span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
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

          <div className="pt-4">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/intake")}
              className="text-base px-10 py-6 rounded-lg"
            >
              Begin Assessment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-muted-foreground text-sm">
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
      </main>
    </div>
  );
};

export default Index;

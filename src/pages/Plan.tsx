import { useNavigate } from "react-router-dom";
import { useIntakeStore } from "@/stores/intake-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Plan = () => {
  const navigate = useNavigate();
  const { generatedPlan } = useIntakeStore();

  if (!generatedPlan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-serif text-3xl">Your Strategic Plan</h1>
          <p className="text-muted-foreground">
            No plan has been generated yet. Complete the intake assessment first.
          </p>
          <Button variant="outline-light" onClick={() => navigate("/intake")} className="gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" />
            Go to Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-semibold tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors"
          >
            AI Strategic Planner
          </button>
          <div className="flex items-center gap-3">
            <Button variant="outline-light" size="sm" onClick={() => navigate("/intake")} className="gap-2">
              <ArrowLeft className="w-3 h-3" />
              Edit Assessment
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 pb-20">
        <div className="bg-card rounded-xl p-6 sm:p-10 card-elevated">
          <article className="prose prose-slate max-w-none
            prose-headings:font-serif prose-headings:text-card-foreground
            prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[hsl(var(--card-border))] prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-card-foreground/80 prose-p:leading-relaxed
            prose-li:text-card-foreground/80
            prose-strong:text-card-foreground
            prose-table:text-sm
            prose-th:bg-muted prose-th:text-card-foreground prose-th:p-3
            prose-td:p-3 prose-td:border-[hsl(var(--card-border))]
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedPlan}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </div>
  );
};

export default Plan;

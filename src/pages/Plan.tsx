import { useNavigate } from "react-router-dom";
import { useIntakeStore } from "@/stores/intake-store";
import { useGeneratePlan } from "@/hooks/use-generate-plan";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, FileDown, FileType, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PlanTocSidebar from "@/components/plan/PlanTocSidebar";
import { downloadMarkdown, downloadDocx, downloadPdf } from "@/lib/export-plan";
import { useCallback, useEffect, useRef, useState } from "react";

const Plan = () => {
  const navigate = useNavigate();
  const { generatedPlan, companyName } = useIntakeStore();
  const { generate } = useGeneratePlan();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Observe headings for active TOC tracking
  useEffect(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll("h1, h2, h3");
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [generatedPlan]);

  const generateHeadingId = useCallback((children: React.ReactNode) => {
    const text = typeof children === "string"
      ? children
      : Array.isArray(children)
      ? children.map((c) => (typeof c === "string" ? c : "")).join("")
      : "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, []);

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
      {/* Header */}
      <header className="print-hidden border-b border-border px-6 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold tracking-widest uppercase text-foreground/50 hover:text-foreground transition-colors shrink-0"
            >
              AI Strategic Planner
            </button>
            <span className="text-border">|</span>
            <span className="text-sm font-medium text-foreground truncate">
              {companyName || "Organization"} — AI Strategic Plan
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/intake")}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Assessment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generate()}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <Button
              variant="outline-light"
              size="sm"
              onClick={() => downloadMarkdown(generatedPlan, companyName)}
              className="gap-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.md</span>
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => downloadDocx(generatedPlan, companyName)}
              className="gap-1.5 text-xs"
            >
              <FileType className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.docx</span>
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => downloadPdf("plan-content", companyName)}
              className="gap-1.5 text-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.pdf</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout with TOC + Content */}
      <div className="max-w-6xl mx-auto flex gap-8 px-6 py-10">
        <PlanTocSidebar markdown={generatedPlan} activeId={activeHeading} />

        <main className="flex-1 min-w-0">
          <div
            id="plan-content"
            ref={contentRef}
            className="plan-content-area bg-card rounded-xl p-6 sm:p-10 lg:p-12 card-elevated"
            style={{ maxWidth: "800px" }}
          >
            <article
              className="plan-article prose prose-slate max-w-none
                prose-headings:plan-heading-serif prose-headings:text-card-foreground
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:leading-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-[hsl(var(--plan-section-divider))]
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
                prose-p:text-card-foreground/80 prose-p:leading-relaxed prose-p:text-[15px]
                prose-li:text-card-foreground/80 prose-li:text-[15px]
                prose-strong:text-card-foreground
                prose-table:text-sm prose-table:border-collapse
                prose-th:bg-[hsl(220,15%,96%)] prose-th:text-card-foreground prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-[hsl(var(--card-border))]
                prose-td:p-3 prose-td:border prose-td:border-[hsl(var(--card-border))] prose-td:align-top
                prose-hr:border-[hsl(var(--plan-section-divider))]
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1 id={generateHeadingId(children)} {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 id={generateHeadingId(children)} {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 id={generateHeadingId(children)} {...props}>
                      {children}
                    </h3>
                  ),
                }}
              >
                {generatedPlan}
              </ReactMarkdown>
            </article>
          </div>

          {/* Footer */}
          <div className="text-center py-10 text-xs text-muted-foreground">
            Powered by AI Strategic Planner
          </div>
        </main>
      </div>
    </div>
  );
};

export default Plan;

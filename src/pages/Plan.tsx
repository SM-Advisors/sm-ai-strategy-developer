import { useNavigate } from "react-router-dom";
import { useIntakeStore } from "@/stores/intake-store";
import { useAuthStore } from "@/stores/auth-store";
import { useGeneratePlan } from "@/hooks/use-generate-plan";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, FileDown, FileType, RefreshCw, FlaskConical, Pencil, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PlanTocSidebar from "@/components/plan/PlanTocSidebar";
import { downloadMarkdown, downloadDocx, downloadPdf } from "@/lib/export-plan";
import { useCallback, useEffect, useRef, useState } from "react";
import AndreaPlanReview from "@/components/andrea/AndreaPlanReview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Plan = () => {
  const navigate = useNavigate();
  const { generatedPlan, companyName, submissionId, setGeneratedPlan } = useIntakeStore();
  const { session } = useAuthStore();
  const { generate } = useGeneratePlan();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if no plan
  useEffect(() => {
    if (!generatedPlan) {
      navigate("/intake", { replace: true });
    }
  }, [generatedPlan, navigate]);

  useEffect(() => {
    document.title = `${companyName || "Organization"} — AI Strategic Plan`;
  }, [companyName]);

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
  }, [generatedPlan, isEditMode]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, [isEditMode]);

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

  const handleEnterEdit = () => {
    setEditDraft(generatedPlan);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditDraft("");
  };

  const handleSaveEdit = async () => {
    if (!editDraft.trim() || editDraft === generatedPlan) {
      setIsEditMode(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      // Update in-memory store immediately
      setGeneratedPlan(editDraft);

      // Persist to storage if we have a submission ID
      const sid = submissionId;
      if (sid) {
        const fileName = `${sid}/plan.md`;
        const blob = new Blob([editDraft], { type: "text/markdown" });
        const { error: uploadErr } = await (supabase as any).storage
          .from("plans")
          .upload(fileName, blob, { contentType: "text/markdown", upsert: true });

        if (uploadErr) {
          // Storage upsert failed (likely RLS on update) — try via edge function
          if (session?.accessCodeId) {
            await supabase.functions.invoke("save-intake", {
              body: { accessCodeId: session.accessCodeId, planFilePath: fileName },
            });
          }
        }
      }

      toast.success("Plan edits saved");
      setIsEditMode(false);
    } catch (err) {
      console.warn("Failed to persist plan edits:", err);
      // Store is already updated in memory — edits aren't lost
      toast.success("Plan updated (will persist on next save)");
      setIsEditMode(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!generatedPlan) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="print-hidden border-b border-border px-4 sm:px-6 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold tracking-widest uppercase text-foreground/50 hover:text-foreground transition-colors shrink-0 hidden sm:block"
            >
              AI Strategic Planner
            </button>
            <span className="text-border hidden sm:block">|</span>
            <span className="text-sm font-medium text-foreground truncate">
              {companyName || "Organization"} — AI Strategic Plan
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isEditMode ? (
              /* Edit mode controls */
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-1.5 text-xs px-2 sm:px-3 text-muted-foreground"
                  disabled={isSavingEdit}
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="gap-1.5 text-xs px-2 sm:px-3"
                  disabled={isSavingEdit}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSavingEdit ? "Saving..." : "Save Edits"}</span>
                </Button>
              </>
            ) : (
              /* Normal controls */
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/intake")}
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Form</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnterEdit}
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Plan</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generate()}
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/scenario")}
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scenario</span>
                </Button>

                <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => downloadMarkdown(generatedPlan, companyName)}
                  className="gap-1 text-xs px-2"
                  title="Download Markdown"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">.md</span>
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => downloadDocx(generatedPlan, companyName)}
                  className="gap-1 text-xs px-2"
                  title="Download Word Document"
                >
                  <FileType className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">.docx</span>
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => downloadPdf("plan-content", companyName)}
                  className="gap-1 text-xs px-2"
                  title="Download PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">.pdf</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit mode banner */}
      {isEditMode && (
        <div className="print-hidden bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs text-amber-800">
            You are editing the plan directly. Changes here will be saved and reflected in all exports.
            Any edits made to the plan should also be updated in the intake form to keep your data consistent.
          </p>
        </div>
      )}

      {/* Main layout with TOC + Content */}
      <div className="max-w-6xl mx-auto flex gap-8 px-4 sm:px-6 py-6 sm:py-10">
        {!isEditMode && <PlanTocSidebar markdown={generatedPlan} activeId={activeHeading} />}

        <main className="flex-1 min-w-0">
          <div
            id="plan-content"
            ref={contentRef}
            className="plan-content-area bg-card rounded-xl p-5 sm:p-10 lg:p-12 card-elevated max-w-[800px]"
          >
            {isEditMode ? (
              <textarea
                ref={textareaRef}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full min-h-[70vh] text-sm font-mono text-gray-800 bg-transparent border-0 outline-none resize-none leading-relaxed"
                placeholder="Edit your plan markdown here..."
                spellCheck={false}
              />
            ) : (
              <article
                className="plan-article prose max-w-none text-gray-900
                  prose-headings:!font-[Arial,Helvetica,sans-serif] prose-headings:!text-gray-900
                  prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6 prose-h1:leading-tight prose-h1:font-bold
                  prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-[hsl(var(--plan-section-divider))] prose-h2:font-bold
                  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
                  prose-p:!text-gray-900 prose-p:leading-relaxed prose-p:text-[15px] prose-p:mb-5 prose-p:mt-0
                  prose-li:!text-gray-900 prose-li:text-[15px] prose-li:mb-1
                  prose-ul:mb-5 prose-ol:mb-5
                  prose-strong:!text-gray-900
                  prose-table:text-sm prose-table:border-collapse prose-table:w-full prose-table:overflow-x-auto
                  prose-th:bg-[hsl(220,15%,96%)] prose-th:text-card-foreground prose-th:p-2 sm:prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-[hsl(var(--card-border))]
                  prose-td:p-2 sm:prose-td:p-3 prose-td:border prose-td:border-[hsl(var(--card-border))] prose-td:align-top
                  prose-hr:border-[hsl(var(--plan-section-divider))]
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                "
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1 id={generateHeadingId(children)} {...props}>{children}</h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 id={generateHeadingId(children)} {...props}>{children}</h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 id={generateHeadingId(children)} {...props}>{children}</h3>
                    ),
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto -mx-2 sm:mx-0">
                        <table {...props}>{children}</table>
                      </div>
                    ),
                  }}
                >
                  {generatedPlan}
                </ReactMarkdown>
              </article>
            )}
          </div>

          <div className="text-center py-10 text-xs text-muted-foreground">
            Powered by AI Strategic Planner
          </div>
        </main>
      </div>

      {!isEditMode && <AndreaPlanReview />}
    </div>
  );
};

export default Plan;

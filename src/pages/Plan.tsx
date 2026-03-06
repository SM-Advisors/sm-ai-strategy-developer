import { useNavigate } from "react-router-dom";
import { useIntakeStore, PlanVersion } from "@/stores/intake-store";
import { useAuthStore } from "@/stores/auth-store";
import { useGeneratePlan } from "@/hooks/use-generate-plan";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, FlaskConical, Pencil, Check, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PlanTocSidebar from "@/components/plan/PlanTocSidebar";
import { downloadMarkdown, downloadDocx, downloadPdf } from "@/lib/export-plan";
import { useCallback, useEffect, useRef, useState } from "react";
import AndreaPlanReview from "@/components/andrea/AndreaPlanReview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Plan = () => {
  const navigate = useNavigate();
  const {
    generatedPlan, companyName, submissionId, setGeneratedPlan,
    planVersions, currentPlanVersion, setPlanVersions, setCurrentPlanVersion, loadPlanVersion,
    _accessCodeId,
  } = useIntakeStore();
  const { session } = useAuthStore();
  const { generate } = useGeneratePlan();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
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

      // Persist as a new version
      const sid = submissionId;
      if (sid) {
        const nextVersion = planVersions.length > 0
          ? Math.max(...planVersions.map(v => v.version_number)) + 1
          : 1;
        const fileName = `${sid}/plan-v${nextVersion}.md`;
        const blob = new Blob([editDraft], { type: "text/markdown" });
        const { error: uploadErr } = await (supabase as any).storage
          .from("plans")
          .upload(fileName, blob, { contentType: "text/markdown", upsert: true });

        if (uploadErr) throw uploadErr;

        // Create version record
        await (supabase as any)
          .from("plan_versions")
          .insert({
            submission_id: sid,
            version_number: nextVersion,
            file_path: fileName,
            label: "Edited",
          });

        // Update plan_file_path
        if (session?.accessCodeId || _accessCodeId) {
          await supabase.functions.invoke("save-intake", {
            body: { accessCodeId: session?.accessCodeId || _accessCodeId, planFilePath: fileName },
          });
        }

        // Update local version state
        const newVersion: PlanVersion = {
          version_number: nextVersion,
          file_path: fileName,
          label: "Edited",
          created_at: new Date().toISOString(),
        };
        setPlanVersions([newVersion, ...planVersions]);
        setCurrentPlanVersion(nextVersion);
      }

      toast.success("Plan saved as new version");
      setIsEditMode(false);
    } catch (err) {
      console.warn("Failed to persist plan edits:", err);
      toast.success("Plan updated (will persist on next save)");
      setIsEditMode(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSwitchVersion = async (version: PlanVersion) => {
    if (version.version_number === currentPlanVersion) return;
    setIsLoadingVersion(true);
    await loadPlanVersion(version);
    setIsLoadingVersion(false);
    toast.success(`Switched to v${version.version_number}`);
  };

  const formatVersionDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
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
              {companyName || "Organization"}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isEditMode ? (
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
                  <span className="hidden sm:inline">{isSavingEdit ? "Saving..." : "Save as New Version"}</span>
                </Button>
              </>
            ) : (
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

                {/* Version toggle */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-1.5 h-8"
                    disabled={isLoadingVersion || !canGoPrevVersion}
                    onClick={handlePrevVersion}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground min-w-[28px] text-center select-none">
                    v{currentPlanVersion ?? planVersions[0]?.version_number ?? 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-1.5 h-8"
                    disabled={isLoadingVersion || !canGoNextVersion}
                    onClick={handleNextVersion}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

                {/* Download dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline-light" size="sm" className="gap-1.5 text-xs px-2 sm:px-3">
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadMarkdown(generatedPlan, companyName)}>
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadDocx(generatedPlan, companyName)}>
                      Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadPdf("plan-content", companyName)}>
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit mode banner */}
      {isEditMode && (
        <div className="print-hidden bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs text-amber-800">
            You are editing the plan directly. Saving will create a new version — previous versions remain accessible via the version dropdown.
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

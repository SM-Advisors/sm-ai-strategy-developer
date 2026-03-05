import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { useAuthStore } from "@/stores/auth-store";
import { sections } from "@/config/intake-sections";
import ProgressBar from "@/components/intake/ProgressBar";
import FormField from "@/components/intake/FormField";
import ReviewStep from "@/components/intake/ReviewStep";
import GeneratingOverlay from "@/components/intake/GeneratingOverlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, FileText, Loader2 } from "lucide-react";
import { useGeneratePlan } from "@/hooks/use-generate-plan";
import AndreaChat from "@/components/andrea/AndreaChat";
import SaveIndicator from "@/components/intake/SaveIndicator";

const TOTAL_STEPS = sections.length + 1; // sections + review

// Width of Andrea's side panel when open
const ANDREA_PANEL_WIDTH = 400;

const Intake = () => {
  const navigate = useNavigate();
  const store = useIntakeStore();
  const { currentStep, setCurrentStep, isGenerating, generatedPlan, isLoadingFromServer, loadFromServer } = store;
  const { session } = useAuthStore();
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const { generate } = useGeneratePlan();

  // Andrea side panel state (lifted so layout can respond)
  const [andreaOpen, setAndreaOpen] = useState(false);

  // Detect whether Andrea's bubble would overlap the Next button
  const navRowRef = useRef<HTMLDivElement>(null);
  const [dimAndrea, setDimAndrea] = useState(false);

  const isReviewStep = currentStep === sections.length;
  const section = isReviewStep ? null : sections[currentStep];
  const isLastFormStep = currentStep === sections.length - 1;
  const isFirstStep = currentStep === 0;

  // Load shared form data from server on mount
  useEffect(() => {
    if (session?.accessCodeId) {
      loadFromServer(session.accessCodeId, session.orgUserId);
    }
  }, [session?.accessCodeId]);

  useEffect(() => {
    document.title = isReviewStep
      ? "Review Answers — AI Strategic Planner"
      : `${section?.title || "Assessment"} — AI Strategic Planner`;
  }, [currentStep, isReviewStep, section]);

  // Check if Andrea's bubble position (bottom-6 right-6 = 96px from right, 24px from bottom)
  // overlaps with the nav row where Next lives
  useEffect(() => {
    if (andreaOpen) {
      setDimAndrea(false);
      return;
    }

    const checkOverlap = () => {
      if (!navRowRef.current) return;
      const rect = navRowRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // Andrea bubble: ~96px wide, ~96px tall, anchored bottom-6 right-6
      const bubbleBottom = vh - 24;  // bottom-6 = 24px from bottom
      const bubbleRight = vw - 24;   // right-6 = 24px from right
      const bubbleTop = bubbleBottom - 96;
      const bubbleLeft = bubbleRight - 96;

      // Check if nav row overlaps with bubble region
      const overlaps =
        rect.bottom >= bubbleTop &&
        rect.top <= bubbleBottom &&
        rect.right >= bubbleLeft &&
        rect.left <= bubbleRight;

      setDimAndrea(overlaps);
    };

    checkOverlap();
    window.addEventListener("scroll", checkOverlap, { passive: true });
    window.addEventListener("resize", checkOverlap, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkOverlap);
      window.removeEventListener("resize", checkOverlap);
    };
  }, [andreaOpen, currentStep]);

  const visibleFields = useMemo(() => {
    if (!section) return [];
    return section.fields.filter((field) => {
      if (!field.showIf) return true;
      const condVal = store[field.showIf.field as keyof IntakeFormData] as string;
      if (field.showIf.condition === "notEqual") return condVal !== field.showIf.value;
      if (field.showIf.condition === "equal") return condVal === field.showIf.value;
      return !!condVal;
    });
  }, [section, store]);

  const validateStep = (): boolean => {
    if (isReviewStep) return true;
    const newErrors = new Set<string>();
    visibleFields.forEach((field) => {
      if (field.required) {
        const val = store[field.id as keyof IntakeFormData];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          newErrors.add(field.id);
        }
      }
    });
    setErrors(newErrors);
    return newErrors.size === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (isReviewStep) {
      generate();
    } else {
      setCurrentStep(currentStep + 1);
      setErrors(new Set());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
      setErrors(new Set());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditSection = (sectionIndex: number) => {
    setCurrentStep(sectionIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isGenerating) {
    return <GeneratingOverlay />;
  }

  if (isLoadingFromServer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your assessment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main content — shifts left when Andrea panel is open */}
      <div
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginRight: andreaOpen ? `${ANDREA_PANEL_WIDTH}px` : 0 }}
      >
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="text-sm font-semibold tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors"
            >
              AI Strategic Planner
            </button>
            <div className="flex items-center gap-3">
              {generatedPlan && (
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => navigate("/plan")}
                  className="gap-1.5 text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Plan
                </Button>
              )}
              <SaveIndicator />
              <span className="text-xs text-muted-foreground">Intake Assessment</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} onStepClick={(step) => { setCurrentStep(step); setErrors(new Set()); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

          <div className="bg-card rounded-xl p-6 sm:p-8 card-elevated animate-fade-in" key={currentStep}>
            {isReviewStep ? (
              <ReviewStep onEditSection={handleEditSection} />
            ) : (
              <>
                <h2 className="font-serif text-2xl text-card-foreground mb-1">{section!.title}</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Section {currentStep + 1} of {sections.length}
                </p>
                <div className="space-y-6">
                  {section!.fields.map((field, idx) => (
                    <FormField key={field.id} field={field} error={errors.has(field.id)} questionNumber={idx + 1} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div ref={navRowRef} className="flex items-center justify-between pb-12">
            <Button variant="outline-light" onClick={handleBack} disabled={isFirstStep} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              variant={isReviewStep ? "hero" : "default"}
              onClick={handleNext}
              className="gap-2"
            >
              {isReviewStep ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate My AI Strategic Plan
                </>
              ) : isLastFormStep ? (
                <>
                  Review Answers
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </main>
      </div>

      <AndreaChat
        isOpen={andreaOpen}
        onOpen={() => setAndreaOpen(true)}
        onClose={() => setAndreaOpen(false)}
        dimBubble={dimAndrea}
      />
    </div>
  );
};

export default Intake;

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";
import ProgressBar from "@/components/intake/ProgressBar";
import FormField from "@/components/intake/FormField";
import ReviewStep from "@/components/intake/ReviewStep";
import GeneratingOverlay from "@/components/intake/GeneratingOverlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useGeneratePlan } from "@/hooks/use-generate-plan";
import AndreaChat from "@/components/andrea/AndreaChat";

const TOTAL_STEPS = sections.length + 1; // sections + review

const Intake = () => {
  const navigate = useNavigate();
  const store = useIntakeStore();
  const { currentStep, setCurrentStep, isGenerating } = store;
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const { generate } = useGeneratePlan();

  const isReviewStep = currentStep === sections.length;
  const section = isReviewStep ? null : sections[currentStep];
  const isLastFormStep = currentStep === sections.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    document.title = isReviewStep
      ? "Review Answers — AI Strategic Planner"
      : `${section?.title || "Assessment"} — AI Strategic Planner`;
  }, [currentStep, isReviewStep, section]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-semibold tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors"
          >
            AI Strategic Planner
          </button>
          <span className="text-xs text-muted-foreground">Intake Assessment</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

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
                {section!.fields.map((field) => (
                  <FormField key={field.id} field={field} error={errors.has(field.id)} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pb-12">
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

      <AndreaChat />
    </div>
  );
};

export default Intake;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";
import ProgressBar from "@/components/intake/ProgressBar";
import FormField from "@/components/intake/FormField";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const Intake = () => {
  const navigate = useNavigate();
  const store = useIntakeStore();
  const { currentStep, setCurrentStep } = store;
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const section = sections[currentStep];
  const isLastStep = currentStep === sections.length - 1;
  const isFirstStep = currentStep === 0;

  const visibleFields = useMemo(() => {
    return section.fields.filter((field) => {
      if (!field.showIf) return true;
      const condVal = store[field.showIf.field as keyof IntakeFormData] as string;
      if (field.showIf.condition === "notEqual") return condVal !== field.showIf.value;
      if (field.showIf.condition === "equal") return condVal === field.showIf.value;
      return !!condVal;
    });
  }, [section, store]);

  const validateStep = (): boolean => {
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
    if (isLastStep) {
      navigate("/plan");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <ProgressBar currentStep={currentStep} />

        {/* Section Card */}
        <div className="bg-card rounded-xl p-6 sm:p-8 card-elevated animate-fade-in" key={currentStep}>
          <h2 className="font-serif text-2xl text-card-foreground mb-1">{section.title}</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Section {currentStep + 1} of {sections.length}
          </p>

          <div className="space-y-6">
            {section.fields.map((field) => (
              <FormField
                key={field.id}
                field={field}
                error={errors.has(field.id)}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pb-12">
          <Button
            variant="outline-light"
            onClick={handleBack}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            variant={isLastStep ? "hero" : "default"}
            onClick={handleNext}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate My AI Strategic Plan
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
  );
};

export default Intake;

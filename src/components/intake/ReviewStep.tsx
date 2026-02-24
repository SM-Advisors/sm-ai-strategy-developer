import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ReviewStepProps {
  onEditSection: (index: number) => void;
}

const ReviewStep = ({ onEditSection }: ReviewStepProps) => {
  const store = useIntakeStore();

  const getDisplayValue = (fieldId: string): string => {
    const val = store[fieldId as keyof IntakeFormData];
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "—";
    return (val as string)?.trim() || "—";
  };

  const isFieldVisible = (field: { showIf?: { field: string; condition: string; value?: string } }): boolean => {
    if (!field.showIf) return true;
    const condVal = store[field.showIf.field as keyof IntakeFormData] as string;
    if (field.showIf.condition === "notEqual") return condVal !== field.showIf.value;
    if (field.showIf.condition === "equal") return condVal === field.showIf.value;
    return !!condVal;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-2">
        <h2 className="font-serif text-2xl text-card-foreground">Review Your Answers</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your responses below. Click "Edit" to make changes to any section.
        </p>
      </div>

      {sections.map((section, sIdx) => {
        const visibleFields = section.fields.filter(isFieldVisible);
        if (visibleFields.length === 0) return null;

        return (
          <div key={section.title} className="border border-[hsl(var(--card-border))] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-card-foreground">{section.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditSection(sIdx)}
                className="gap-1.5 text-xs text-primary hover:text-primary"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            </div>

            <div className="space-y-3">
              {visibleFields.map((field) => {
                const val = getDisplayValue(field.id);
                return (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr,1.5fr] gap-1 sm:gap-4 text-sm">
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {field.label}
                    </span>
                    <span className="text-card-foreground leading-relaxed break-words">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewStep;

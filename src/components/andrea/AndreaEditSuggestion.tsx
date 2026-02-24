import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { sections } from "@/config/intake-sections";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import type { FieldEdit } from "@/hooks/use-andrea-chat";

interface AndreaEditSuggestionProps {
  edit: FieldEdit;
  editKey: string;
  isApplied: boolean;
  onApply: () => void;
}

export default function AndreaEditSuggestion({
  edit,
  editKey,
  isApplied,
  onApply,
}: AndreaEditSuggestionProps) {
  // Read the current value of the field from the store
  const currentValue = useIntakeStore(
    (s) => s[edit.fieldId as keyof IntakeFormData]
  );

  // Determine which section this field belongs to
  const fieldSectionIndex = sections.findIndex((s) =>
    s.fields.some((f) => f.id === edit.fieldId)
  );
  const currentStep = useIntakeStore((s) => s.currentStep);
  const isOtherSection =
    fieldSectionIndex !== -1 && fieldSectionIndex !== currentStep;

  const displayCurrent = currentValue
    ? Array.isArray(currentValue)
      ? currentValue.join(", ")
      : String(currentValue)
    : "";

  const displayProposed = Array.isArray(edit.suggestedValue)
    ? edit.suggestedValue.join(", ")
    : edit.suggestedValue;

  return (
    <div className="mt-2 border border-primary/20 rounded-lg p-3 bg-primary/5 space-y-2 text-card-foreground">
      {/* Field label */}
      <div className="flex items-center gap-2">
        <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold">{edit.fieldLabel}</span>
      </div>

      {/* Current → Proposed */}
      <div className="space-y-1">
        {displayCurrent && (
          <div className="text-xs">
            <span className="text-muted-foreground">Current: </span>
            <span className="text-card-foreground/70">{displayCurrent}</span>
          </div>
        )}
        <div className="text-xs">
          <span className="text-muted-foreground">Suggested: </span>
          <span className="font-medium text-primary">{displayProposed}</span>
        </div>
      </div>

      {/* Reason */}
      <p className="text-xs text-muted-foreground italic">{edit.reason}</p>

      {/* Section indicator */}
      {isOtherSection && (
        <p className="text-xs text-muted-foreground">
          Section {fieldSectionIndex + 1}: {sections[fieldSectionIndex].title}
        </p>
      )}

      {/* Apply / Applied button */}
      {isApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <Check className="h-3.5 w-3.5" />
          Applied
        </div>
      ) : (
        <Button size="sm" onClick={onApply} className="h-7 text-xs gap-1.5">
          <Check className="h-3 w-3" />
          Apply
        </Button>
      )}
    </div>
  );
}

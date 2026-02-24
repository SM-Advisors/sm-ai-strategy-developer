import { FieldConfig } from "@/config/intake-sections";
import { useIntakeStore, IntakeFormData } from "@/stores/intake-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  field: FieldConfig;
  error?: boolean;
  questionNumber?: number;
}

const FormField = ({ field, error, questionNumber }: FormFieldProps) => {
  const store = useIntakeStore();
  const value = store[field.id as keyof IntakeFormData];

  // Check showIf condition
  const isConditional = !!field.showIf;
  if (field.showIf) {
    const conditionValue = store[field.showIf.field as keyof IntakeFormData] as string;
    if (field.showIf.condition === "notEqual" && conditionValue === field.showIf.value) return null;
    if (field.showIf.condition === "equal" && conditionValue !== field.showIf.value) return null;
    if (field.showIf.condition === "notEmpty" && !conditionValue) return null;
  }

  const handleChange = (val: string) => {
    store.setField(field.id as keyof IntakeFormData, val as any);
  };

  return (
    <div className={cn(
      "space-y-2.5",
      isConditional ? "animate-slide-down overflow-hidden" : "animate-fade-in"
    )}>
      <Label className="text-sm font-medium text-card-foreground leading-relaxed">
        {questionNumber != null && <span className="text-muted-foreground mr-1.5">{questionNumber}.</span>}
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {field.maxSelect && (
          <span className="text-muted-foreground font-normal ml-1">(max {field.maxSelect})</span>
        )}
      </Label>

      {error && (
        <p className="text-destructive text-xs">This field is required</p>
      )}

      {field.type === "text" && (
        <Input
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "bg-card border-[hsl(var(--card-border))] text-card-foreground placeholder:text-muted-foreground focus:ring-primary",
            error && "border-destructive"
          )}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          rows={3}
          className={cn(
            "bg-card border-[hsl(var(--card-border))] text-card-foreground placeholder:text-muted-foreground focus:ring-primary resize-none",
            error && "border-destructive"
          )}
        />
      )}

      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label
              key={option}
              onClick={() => handleChange(option)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                value === option
                  ? "border-primary bg-primary/5"
                  : "border-[hsl(var(--card-border))] hover:border-primary/40"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                value === option ? "border-primary" : "border-muted-foreground/40"
              )}>
                {value === option && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-card-foreground">{option}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2">
          {field.options?.map((option) => {
            const arr = value as string[];
            const checked = arr.includes(option);
            const disabled = !checked && field.maxSelect ? arr.length >= field.maxSelect : false;
            return (
              <label
                key={option}
                onClick={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  store.toggleArrayField(field.id as keyof IntakeFormData, option, field.maxSelect);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-[hsl(var(--card-border))] hover:border-primary/40",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {checked && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-card-foreground">{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormField;

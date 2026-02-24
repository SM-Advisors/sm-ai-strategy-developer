import { sections } from "@/config/intake-sections";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const total = totalSteps || sections.length;
  const isReview = currentStep === sections.length;
  const progress = isReview ? 100 : ((currentStep + 1) / total) * 100;
  const sectionLabels = [...sections.map((s) => s.shortTitle), "Review"];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>
          {isReview ? "Review" : `Section ${currentStep + 1} of ${sections.length}`}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-accent overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="hidden md:flex items-center gap-1">
        {sectionLabels.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 text-center text-[11px] py-1.5 rounded transition-colors duration-300",
              i === currentStep
                ? "text-primary font-semibold bg-primary/10"
                : i < currentStep || isReview
                ? "text-foreground/60"
                : "text-muted-foreground"
            )}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;

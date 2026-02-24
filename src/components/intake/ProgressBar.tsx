import { sections } from "@/config/intake-sections";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  const progress = ((currentStep + 1) / sections.length) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Overall progress bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Section {currentStep + 1} of {sections.length}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-accent overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section labels */}
      <div className="hidden md:flex items-center gap-1">
        {sections.map((section, i) => (
          <div
            key={section.shortTitle}
            className={cn(
              "flex-1 text-center text-[11px] py-1.5 rounded transition-colors duration-300",
              i === currentStep
                ? "text-primary font-semibold bg-primary/10"
                : i < currentStep
                ? "text-foreground/60"
                : "text-muted-foreground"
            )}
          >
            {section.shortTitle}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;

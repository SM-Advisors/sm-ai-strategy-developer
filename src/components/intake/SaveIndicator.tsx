import { useIntakeStore } from "@/stores/intake-store";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

const SaveIndicator = () => {
  const saveStatus = useIntakeStore((s) => s.saveStatus);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-300",
        saveStatus === "idle" && "opacity-0",
        saveStatus !== "idle" && "opacity-100"
      )}
    >
      {saveStatus === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <Cloud className="w-3 h-3 text-primary" />
          <Check className="w-3 h-3 text-primary -ml-1" />
          <span className="text-primary">Saved</span>
        </>
      )}
      {saveStatus === "error" && (
        <>
          <AlertCircle className="w-3 h-3 text-destructive" />
          <span className="text-destructive">Save failed — retrying…</span>
        </>
      )}
    </div>
  );
};

export default SaveIndicator;

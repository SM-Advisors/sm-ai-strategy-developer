import { useState } from "react";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const AccessCodeEntry = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAccessCode } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-code", {
        body: { code: code.trim().toUpperCase() },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        setAccessCode(code.trim().toUpperCase());
        toast.success("Access granted. Welcome!");
      } else {
        setError("Invalid or inactive code. Please check with your consultant.");
      }
    } catch (err) {
      console.error("Code validation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-secondary/50 border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Enter Your Access Code</p>
            <p className="text-xs text-muted-foreground">Provided by your SM Advisors consultant</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="SM-XXXX-XXXX"
            className="font-mono tracking-widest text-center text-sm uppercase"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            variant="hero"
            className="w-full text-sm py-5"
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Unlock Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AccessCodeEntry;

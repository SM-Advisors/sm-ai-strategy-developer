import { useState } from "react";
import { KeyRound, ArrowRight, Loader2, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import ForgotCodeDialog from "@/components/ForgotCodeDialog";

type Step = "code" | "identity";

interface CodeCheckResult {
  codeId: string;
  orgName: string | null;
}

const AccessCodeEntry = () => {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeResult, setCodeResult] = useState<CodeCheckResult | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { setOrgSession } = useAuthStore();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-code", {
        body: { mode: "check", code: code.trim().toUpperCase() },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        setCodeResult({ codeId: data.codeId, orgName: data.orgName });
        setStep("identity");
      } else {
        setError("Invalid or inactive code. Please check with your SM Advisors consultant.");
      }
    } catch (err) {
      console.error("Code validation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !codeResult) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-code", {
        body: {
          mode: "login",
          code: code.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        setOrgSession({
          accessCode: code.trim().toUpperCase(),
          accessCodeId: data.codeId,
          orgUserId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          orgName: data.orgName,
          hasExistingSubmission: data.hasExistingSubmission,
          hasPlan: data.hasPlan,
        });
        toast.success(data.isNewUser ? `Welcome, ${data.userName}!` : `Welcome back, ${data.userName}!`);
      } else {
        setError(data?.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <>
        <ForgotCodeDialog open={forgotOpen} onOpenChange={setForgotOpen} />
        <div className="w-full max-w-sm mx-auto space-y-2">
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

            <form onSubmit={handleCodeSubmit} className="space-y-3">
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

              {error && <p className="text-xs text-destructive text-center">{error}</p>}

              <Button
                type="submit"
                variant="hero"
                className="w-full text-sm py-5"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
          >
            Forgot your access code?
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-secondary/50 border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {codeResult?.orgName ? `Welcome to ${codeResult.orgName}` : "Welcome"}
          </p>
          <p className="text-xs text-muted-foreground">
            Enter your name and email to access the platform.
          </p>
        </div>

        <form onSubmit={handleIdentitySubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Your name"
                className="pl-8 text-sm"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@company.com"
                className="pl-8 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            variant="hero"
            className="w-full text-sm py-5"
            disabled={loading || !name.trim() || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Access Platform
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("code"); setError(""); setCodeResult(null); }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            ← Use a different code
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessCodeEntry;

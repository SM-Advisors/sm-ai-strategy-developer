import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ForgotCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotCodeDialog({ open, onOpenChange }: ForgotCodeDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("forgot-code", {
        body: { name: name.trim(), email: email.trim(), companyName: companyName.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err) {
      console.error("Forgot code error:", err);
      setError("Something went wrong. Please try again or email coryk@smaiadvisors.com directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setName("");
      setEmail("");
      setCompanyName("");
      setSubmitted(false);
      setError("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif">Request Your Access Code</DialogTitle>
              <DialogDescription>
                Fill out the form below and an SM Advisors consultant will follow up with your code.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email Address *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your organization"
                  disabled={loading}
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !name.trim() || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending request...
                  </>
                ) : (
                  "Send Request"
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif">Request Sent</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-foreground">
                Your request has been sent to the SM Advisors team. They'll follow up with your access code shortly.
              </p>
              <Button variant="outline" onClick={handleClose} className="mt-2">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

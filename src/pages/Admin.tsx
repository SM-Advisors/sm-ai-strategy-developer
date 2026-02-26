import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  Download,
  RefreshCw,
  FileX,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { IntakeFormData } from "@/types/intake";

interface AccessCode {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  use_count: number;
  created_at: string;
}

interface Submission {
  id: string;
  company_name: string | null;
  industry: string | null;
  num_employees: string | null;
  intake_data: IntakeFormData;
  plan_file_path: string | null;
  created_at: string;
}

// Generate a code in SM-XXXX-XXXX format
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SM-${segment()}-${segment()}`;
}

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, adminUser } = useAuthStore();
  const [labelInput, setLabelInput] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"codes" | "submissions">("codes");

  useEffect(() => {
    document.title = "Admin Panel — AI Strategic Planner";
  }, []);

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  // Fetch all access codes
  const { data: codes = [], isLoading: codesLoading } = useQuery<AccessCode[]>({
    queryKey: ["access-codes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AccessCode[];
    },
    enabled: isAdmin,
  });

  // Fetch all submissions
  const { data: submissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("submissions")
        .select("id, company_name, industry, num_employees, intake_data, plan_file_path, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
    enabled: isAdmin && activeTab === "submissions",
  });

  // Generate new code mutation
  const generateMutation = useMutation({
    mutationFn: async (label: string) => {
      const code = generateCode();
      const { data, error } = await (supabase as any)
        .from("access_codes")
        .insert({ code, label: label.trim() || null })
        .select()
        .single();
      if (error) throw error;
      return data as AccessCode;
    },
    onSuccess: (data) => {
      setNewCode(data.code);
      setLabelInput("");
      queryClient.invalidateQueries({ queryKey: ["access-codes"] });
      toast.success("Access code generated");
    },
    onError: () => toast.error("Failed to generate code. Please try again."),
  });

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("access_codes")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access-codes"] }),
    onError: () => toast.error("Failed to update code status."),
  });

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (submission: Submission) => {
    if (!submission.plan_file_path) return;
    setDownloadingId(submission.id);
    try {
      const { data, error } = await (supabase as any).storage
        .from("plans")
        .createSignedUrl(submission.plan_file_path, 60);
      if (error) throw error;
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = submission.plan_file_path.split("/").pop() || "plan.md";
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Failed to generate download link.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRegenerate = async (submission: Submission) => {
    setRegeneratingId(submission.id);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ formData: submission.intake_data }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      // Consume the SSE stream and accumulate plan text
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let planText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              planText += parsed.delta.text;
            }
          } catch { /* skip */ }
        }
      }

      if (!planText) throw new Error("No plan content received");

      // Upload to storage and update submission
      const fileName = `${submission.id}/plan.md`;
      const blob = new Blob([planText], { type: "text/markdown" });
      const { error: uploadErr } = await (supabase as any).storage
        .from("plans")
        .upload(fileName, blob, { contentType: "text/markdown", upsert: true });
      if (uploadErr) throw uploadErr;

      await (supabase as any)
        .from("submissions")
        .update({ plan_file_path: fileName })
        .eq("id", submission.id);

      clearTimeout(timeout);
      toast.success("Plan regenerated successfully");
      await refetchSubmissions();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        toast.error("Regeneration timed out. Please try again.");
      } else {
        toast.error(`Regeneration failed: ${err.message}`);
      }
    } finally {
      setRegeneratingId(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-foreground/60 hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-sm font-semibold tracking-wide">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{adminUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              {codes.filter((c) => c.is_active).length} active code{codes.filter((c) => c.is_active).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-secondary/40 border border-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("codes")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "codes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Access Codes
            </span>
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "submissions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Submissions
            </span>
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {activeTab === "codes" && (
          <>
            {/* Generate New Code */}
            <section className="bg-secondary/40 border border-border rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-serif text-xl text-foreground mb-1">Generate Access Code</h2>
                <p className="text-sm text-muted-foreground">
                  Create a reusable code to share with a client. Codes are active until you deactivate them.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Label (optional) — e.g. Acme Corp, Q1 Pilot"
                  className="flex-1 text-sm"
                  disabled={generateMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") generateMutation.mutate(labelInput);
                  }}
                />
                <Button
                  onClick={() => generateMutation.mutate(labelInput)}
                  disabled={generateMutation.isPending}
                  className="shrink-0"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4 mr-2" />
                  )}
                  Generate Code
                </Button>
              </div>

              {newCode && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">New access code</p>
                    <p className="font-mono text-lg font-bold tracking-widest text-primary">{newCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newCode, "new")}
                    className="shrink-0 border-primary/30 hover:border-primary/60"
                  >
                    {copiedId === "new" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </section>

            {/* Codes Table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">All Access Codes</h2>
                <span className="text-xs text-muted-foreground">{codes.length} total</span>
              </div>

              {codesLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading codes...</span>
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <KeyRound className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No access codes yet. Generate your first one above.</p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_4rem_5rem_5rem_6rem] gap-4 px-5 py-3 bg-secondary/60 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Code</span>
                    <span>Label</span>
                    <span className="text-center">Uses</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">Created</span>
                    <span className="text-center">Actions</span>
                  </div>

                  {codes.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr_1fr_4rem_5rem_5rem_6rem] gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center hover:bg-secondary/20 transition-colors"
                    >
                      <span className="font-mono text-sm font-semibold tracking-widest text-foreground">
                        {c.code}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {c.label ?? <span className="italic opacity-40">—</span>}
                      </span>
                      <span className="text-sm text-center text-muted-foreground">{c.use_count}</span>
                      <div className="flex justify-center">
                        <Badge
                          variant={c.is_active ? "default" : "secondary"}
                          className={c.is_active ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20" : ""}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <span className="text-xs text-center text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d")}
                      </span>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          title="Copy code"
                          onClick={() => copyToClipboard(c.code, c.id)}
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          title={c.is_active ? "Deactivate" : "Activate"}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ id: c.id, is_active: c.is_active })}
                        >
                          {c.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "submissions" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">All Submissions</h2>
              <span className="text-xs text-muted-foreground">{submissions.length} total</span>
            </div>

            {submissionsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading submissions...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No submissions yet.</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_6rem_8rem_12rem] gap-4 px-5 py-3 bg-secondary/60 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Company</span>
                  <span>Industry</span>
                  <span>Employees</span>
                  <span>Submitted</span>
                  <span className="text-center">Actions</span>
                </div>

                {submissions.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_1fr_6rem_8rem_12rem] gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center hover:bg-secondary/20 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {s.company_name || <span className="italic text-muted-foreground opacity-60">Unknown</span>}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {s.industry || <span className="italic opacity-40">—</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {s.num_employees || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "MMM d, yyyy")}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {s.plan_file_path ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          disabled={downloadingId === s.id}
                          onClick={() => handleDownload(s)}
                        >
                          {downloadingId === s.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          Download
                        </Button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground/60 italic">
                          <FileX className="w-3 h-3" />
                          Plan Unavailable
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                        disabled={regeneratingId === s.id}
                        onClick={() => handleRegenerate(s)}
                      >
                        {regeneratingId === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Regen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;

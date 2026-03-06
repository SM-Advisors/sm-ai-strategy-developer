import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env vars");

    const { accessCodeId, planVersionPath } = await req.json();
    if (!accessCodeId) {
      return new Response(
        JSON.stringify({ error: "accessCodeId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: submission, error } = await supabase
      .from("submissions")
      .select("id, intake_data, plan_file_path, company_name, industry, num_employees, last_edited_at")
      .eq("access_code_id", accessCodeId)
      .maybeSingle();

    if (error) throw error;

    // Load plan versions for this submission
    let planVersions: Array<{ version_number: number; file_path: string; label: string; created_at: string }> = [];
    let planSignedUrl: string | null = null;
    let scenarioResults: Array<{ stakeholder: string; industry: string; result_data: unknown }> = [];

    if (submission) {
      const { data: versions } = await supabase
        .from("plan_versions")
        .select("version_number, file_path, label, created_at")
        .eq("submission_id", submission.id)
        .order("version_number", { ascending: false });

      if (versions && versions.length > 0) {
        planVersions = versions;
        // If a specific version path was requested, use that; otherwise latest
        const targetPath = planVersionPath || versions[0].file_path;
        const { data: signedData, error: signErr } = await supabase.storage
          .from("plans")
          .createSignedUrl(targetPath, 300);
        if (!signErr && signedData?.signedUrl) {
          planSignedUrl = signedData.signedUrl;
        }
      } else if (submission.plan_file_path) {
        // Legacy: no versioned entries but plan_file_path exists
        const { data: signedData, error: signErr } = await supabase.storage
          .from("plans")
          .createSignedUrl(submission.plan_file_path, 300);
        if (!signErr && signedData?.signedUrl) {
          planSignedUrl = signedData.signedUrl;
        }
      }

      // Load scenario results for this submission
      const { data: scenarios } = await supabase
        .from("scenario_results")
        .select("stakeholder, industry, result_data")
        .eq("submission_id", submission.id);
      if (scenarios && scenarios.length > 0) {
        scenarioResults = scenarios;
      }
    }

    return new Response(
      JSON.stringify({ submission: submission ?? null, planSignedUrl, planVersions, scenarioResults }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("load-intake error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

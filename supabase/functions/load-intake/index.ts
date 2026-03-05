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

    const { accessCodeId } = await req.json();
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

    // If there's a saved plan, generate a short-lived signed URL so the client
    // can download the plan text and restore it in memory (storage RLS blocks
    // anon/org-user direct access to the plans bucket).
    let planSignedUrl: string | null = null;
    if (submission?.plan_file_path) {
      const { data: signedData, error: signErr } = await supabase.storage
        .from("plans")
        .createSignedUrl(submission.plan_file_path, 300); // 5-minute TTL
      if (!signErr && signedData?.signedUrl) {
        planSignedUrl = signedData.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({ submission: submission ?? null, planSignedUrl }),
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

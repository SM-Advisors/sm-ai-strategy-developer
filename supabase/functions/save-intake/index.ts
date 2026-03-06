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

    const {
      accessCodeId, orgUserId, fieldId, value, oldValue, isAndreaSuggestion,
      fullIntakeData, planFilePath,
      // Plan versioning: insert a new plan_versions record
      planVersionData,
      // Scenario: clear all scenario results for a submission
      clearScenarioResults,
    } = await req.json();

    if (!accessCodeId) {
      return new Response(
        JSON.stringify({ error: "accessCodeId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get company_name / industry / num_employees from fullIntakeData if provided
    const companyName = fullIntakeData?.companyName ?? null;
    const industry = fullIntakeData?.industry ?? null;
    const numEmployees = fullIntakeData?.employeeCount ?? null;

    // Upsert submission for this org — one submission per access_code_id
    // If fieldId is provided, patch only that field in intake_data using jsonb_set
    // If fullIntakeData is provided (first load / bulk save), set entire intake_data
    let upsertData: Record<string, unknown>;

    if (fullIntakeData) {
      // For fullIntakeData: check if submission already exists and UPDATE it,
      // otherwise fall through to INSERT. This prevents duplicate submissions.
      const { data: existingForFull } = await supabase
        .from("submissions")
        .select("id")
        .eq("access_code_id", accessCodeId)
        .maybeSingle();

      if (existingForFull) {
        const { error: fullUpdateErr } = await supabase
          .from("submissions")
          .update({
            intake_data: fullIntakeData,
            company_name: companyName,
            industry: industry,
            num_employees: numEmployees,
            last_edited_by: orgUserId ?? null,
            last_edited_at: new Date().toISOString(),
            ...(planFilePath !== undefined ? { plan_file_path: planFilePath } : {}),
          })
          .eq("id", existingForFull.id);

        if (fullUpdateErr) throw fullUpdateErr;

        return new Response(
          JSON.stringify({ ok: true, submissionId: existingForFull.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      upsertData = {
        access_code_id: accessCodeId,
        intake_data: fullIntakeData,
        company_name: companyName,
        industry: industry,
        num_employees: numEmployees,
        last_edited_by: orgUserId ?? null,
        last_edited_at: new Date().toISOString(),
        ...(planFilePath !== undefined ? { plan_file_path: planFilePath } : {}),
      };
    } else if (planFilePath !== undefined && !fieldId) {
      // Plan-only update: just set plan_file_path on existing submission
      const { data: existingForPlan } = await supabase
        .from("submissions")
        .select("id")
        .eq("access_code_id", accessCodeId)
        .maybeSingle();

      if (!existingForPlan) {
        return new Response(
          JSON.stringify({ error: "No submission found for this access code" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: planUpdateErr } = await supabase
        .from("submissions")
        .update({ plan_file_path: planFilePath })
        .eq("id", existingForPlan.id);

      if (planUpdateErr) throw planUpdateErr;

      return new Response(
        JSON.stringify({ ok: true, submissionId: existingForPlan.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (fieldId !== undefined) {
      // Partial update: patch just this field inside intake_data
      // We'll do a select-then-update to safely merge
      const { data: existing } = await supabase
        .from("submissions")
        .select("id, intake_data, company_name, industry, num_employees")
        .eq("access_code_id", accessCodeId)
        .maybeSingle();

      if (existing) {
        const updatedIntakeData = { ...(existing.intake_data as Record<string, unknown>), [fieldId]: value };
        const { error: updateErr } = await supabase
          .from("submissions")
          .update({
            intake_data: updatedIntakeData,
            company_name: fieldId === "companyName" ? value : (existing.company_name ?? companyName),
            industry: fieldId === "industry" ? value : (existing.industry ?? industry),
            num_employees: fieldId === "employeeCount" ? value : (existing.num_employees ?? numEmployees),
            last_edited_by: orgUserId ?? null,
            last_edited_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateErr) throw updateErr;

        // Log the edit
        if (orgUserId) {
          await supabase.from("field_edit_log").insert({
            submission_id: existing.id,
            field_id: fieldId,
            old_value: oldValue !== undefined ? String(oldValue ?? "") : null,
            new_value: value !== undefined ? String(value ?? "") : null,
            edited_by: orgUserId,
            edited_by_andrea: isAndreaSuggestion ?? false,
          });
        }

        return new Response(
          JSON.stringify({ ok: true, submissionId: existing.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No existing submission — create with this one field
      upsertData = {
        access_code_id: accessCodeId,
        intake_data: { [fieldId]: value },
        last_edited_by: orgUserId ?? null,
        last_edited_at: new Date().toISOString(),
      };
    } else if (planVersionData || clearScenarioResults) {
      // Operations that require an existing submission
      const { data: existingForOp } = await supabase
        .from("submissions")
        .select("id")
        .eq("access_code_id", accessCodeId)
        .maybeSingle();

      if (!existingForOp) {
        return new Response(
          JSON.stringify({ error: "No submission found for this access code" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (planVersionData) {
        const { version_number, file_path, label } = planVersionData as {
          version_number: number; file_path: string; label: string;
        };
        await supabase.from("plan_versions").insert({
          submission_id: existingForOp.id,
          version_number,
          file_path,
          label: label || "Generated",
        });
      }

      if (clearScenarioResults) {
        await supabase
          .from("scenario_results")
          .delete()
          .eq("submission_id", existingForOp.id);
      }

      return new Response(
        JSON.stringify({ ok: true, submissionId: existingForOp.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "fieldId or fullIntakeData required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new submission
    const { data: newSubmission, error: insertErr } = await supabase
      .from("submissions")
      .insert(upsertData)
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ ok: true, submissionId: newSubmission.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("save-intake error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

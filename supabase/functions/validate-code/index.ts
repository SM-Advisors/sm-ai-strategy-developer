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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    const body = await req.json();
    const { mode, code, name, email } = body;

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "No code provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the code
    const { data: codeRow, error: codeError } = await supabase
      .from("access_codes")
      .select("id, code, label, org_name, is_active, use_count")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (codeError || !codeRow) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!codeRow.is_active) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode "check": just validate the code exists, return org info
    if (!mode || mode === "check") {
      return new Response(
        JSON.stringify({
          valid: true,
          codeId: codeRow.id,
          orgName: codeRow.org_name ?? codeRow.label ?? null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode "login": register/identify user and return session data
    if (mode === "login") {
      if (!name || !email || typeof name !== "string" || typeof email !== "string") {
        return new Response(
          JSON.stringify({ valid: false, error: "Name and email are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Upsert org_user: find existing or create new
      const { data: existingUser } = await supabase
        .from("org_users")
        .select("id, name, email")
        .eq("access_code_id", codeRow.id)
        .eq("email", normalizedEmail)
        .single();

      let orgUser = existingUser;
      let isNewUser = false;

      if (!orgUser) {
        const { data: newUser, error: insertError } = await supabase
          .from("org_users")
          .insert({ access_code_id: codeRow.id, name: name.trim(), email: normalizedEmail })
          .select("id, name, email")
          .single();

        if (insertError || !newUser) {
          throw new Error("Failed to register user");
        }
        orgUser = newUser;
        isNewUser = true;
      }

      // Check if this org already has a submission
      const { data: existingSubmission } = await supabase
        .from("submissions")
        .select("id, plan_file_path")
        .eq("access_code_id", codeRow.id)
        .maybeSingle();

      // Increment use_count on code
      await supabase
        .from("access_codes")
        .update({ use_count: codeRow.use_count + 1 })
        .eq("id", codeRow.id);

      return new Response(
        JSON.stringify({
          valid: true,
          codeId: codeRow.id,
          userId: orgUser.id,
          userName: orgUser.name,
          userEmail: orgUser.email,
          orgName: codeRow.org_name ?? codeRow.label ?? null,
          isNewUser,
          hasExistingSubmission: !!existingSubmission,
          hasPlan: !!(existingSubmission?.plan_file_path),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: false, error: "Unknown mode" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("validate-code error:", e);
    return new Response(
      JSON.stringify({ valid: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

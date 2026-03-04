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

    const { submissionId, fieldId, orgUserId, noteText } = await req.json();

    if (!submissionId || !fieldId || !orgUserId) {
      return new Response(
        JSON.stringify({ error: "submissionId, fieldId, and orgUserId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!noteText || !noteText.trim()) {
      // Delete the note if empty text
      const { error } = await supabase
        .from("field_notes")
        .delete()
        .eq("submission_id", submissionId)
        .eq("field_id", fieldId)
        .eq("org_user_id", orgUserId);

      if (error) throw error;
      return new Response(
        JSON.stringify({ ok: true, deleted: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert note (one per user per field)
    const { data, error } = await supabase
      .from("field_notes")
      .upsert(
        {
          submission_id: submissionId,
          field_id: fieldId,
          org_user_id: orgUserId,
          note_text: noteText.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "submission_id,field_id,org_user_id" }
      )
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, noteId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("save-field-note error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

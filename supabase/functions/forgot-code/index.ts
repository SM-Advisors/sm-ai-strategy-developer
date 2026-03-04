import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = ["coryk@smaiadvisors.com", "allim@smaiadvisors.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const { name, email, companyName } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = `Access Code Request: ${name} (${companyName || "Unknown company"})`;
    const body = `
A user has requested their access code for the SM AI Strategic Planner.

Name: ${name}
Email: ${email}
Company: ${companyName || "Not provided"}
Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}

Please reply to this email or contact them directly with their access code.
    `.trim();

    if (!RESEND_API_KEY) {
      // Log and acknowledge even without email configured
      console.log("FORGOT CODE REQUEST:", { name, email, companyName });
      console.warn("RESEND_API_KEY not configured — logging request only");
      return new Response(
        JSON.stringify({ ok: true, note: "Request logged (email not configured)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email to all admin addresses
    const emailPromises = ADMIN_EMAILS.map((adminEmail) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AI Strategic Planner <noreply@smaiadvisors.com>",
          to: adminEmail,
          reply_to: email,
          subject,
          text: body,
        }),
      })
    );

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("forgot-code error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

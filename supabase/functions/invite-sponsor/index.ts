import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const { recipientName, recipientEmail, accessCode, orgName, platformUrl } = await req.json();

    if (!recipientEmail || !accessCode) {
      return new Response(
        JSON.stringify({ error: "recipientEmail and accessCode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const greeting = recipientName ? `Hi ${recipientName},` : "Hello,";
    const orgLine = orgName ? ` for <strong>${orgName}</strong>` : "";
    const url = platformUrl || "https://app.smaiadvisors.com";

    const textBody = `${recipientName ? `Hi ${recipientName},` : "Hello,"}

Your AI Strategic Plan${orgName ? ` for ${orgName}` : ""} is ready to build.

SM Advisors has set up your access to the AI Strategic Planner — a platform that will generate a comprehensive, board-ready AI strategy tailored to your organization.

Your Access Code: ${accessCode}

To get started:
1. Visit ${url}
2. Enter your access code: ${accessCode}
3. Complete the assessment (takes about 20 minutes)
4. Receive your customized AI Strategic Plan

The assessment covers your organization's current technology, priorities, risk appetite, and goals. The more detail you provide, the more precise your plan will be.

If you have any questions, reply to this email or reach out to your SM Advisors consultant directly.

Looking forward to building your AI strategy,
The SM Advisors Team`.trim();

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 15px; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
    .header { background: #1a2744; padding: 28px 32px; }
    .header-title { color: #ffffff; font-size: 18px; font-weight: bold; margin: 0; }
    .header-sub { color: #a0b0cc; font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px; }
    .code-box { background: #f0f4ff; border: 2px solid #3b5bdb; border-radius: 8px; padding: 18px 24px; margin: 24px 0; text-align: center; }
    .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 6px; }
    .code-value { font-family: 'Courier New', monospace; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #1a2744; margin: 0; }
    .cta-btn { display: inline-block; background: #3b5bdb; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 8px 0 24px; }
    .footer { padding: 20px 32px; background: #f8f9fa; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">AI Strategic Planner</p>
      <p class="header-sub">Powered by SM Advisors</p>
    </div>
    <div class="body">
      <p>${greeting}</p>
      <p>Your AI Strategic Plan${orgLine} is ready to build. SM Advisors has set up your access to the AI Strategic Planner — a platform that generates a comprehensive, board-ready AI strategy tailored to your organization.</p>
      <div class="code-box">
        <p class="code-label">Your Access Code</p>
        <p class="code-value">${accessCode}</p>
      </div>
      <p style="text-align:center;">
        <a href="${url}" class="cta-btn">Open the Platform &rarr;</a>
      </p>
      <p><strong>To get started:</strong></p>
      <ol>
        <li>Visit the platform and enter your access code</li>
        <li>Complete the assessment — about 20 minutes</li>
        <li>Receive your customized AI Strategic Plan</li>
      </ol>
      <p style="margin-top:24px; color:#555; font-size:14px;">The assessment covers your organization's current technology, priorities, risk appetite, and goals. The more detail you provide, the more precise your plan will be.</p>
      <p style="color:#555; font-size:14px;">Questions? Reply to this email or reach out to your SM Advisors consultant directly.</p>
      <p style="margin-top:28px;">Looking forward to building your AI strategy,<br><strong>The SM Advisors Team</strong></p>
    </div>
    <div class="footer">
      This invitation was sent by SM Advisors. Your access code is unique to your organization.
    </div>
  </div>
</body>
</html>`;

    if (!RESEND_API_KEY) {
      console.log("INVITE SPONSOR (no email key):", { recipientEmail, accessCode, orgName });
      return new Response(
        JSON.stringify({ ok: true, note: "Invite logged (email not configured)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SM Advisors <noreply@smaiadvisors.com>",
        to: recipientEmail,
        subject: `Your AI Strategic Plan Access${orgName ? ` — ${orgName}` : ""}`,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", resp.status, errText);
      throw new Error(`Email send failed: ${resp.status}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("invite-sponsor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

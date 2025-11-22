export const runtime = "nodejs";

import { Resend } from "resend";

export async function POST(req) {
  // ✅ FIX: Initialize Resend INSIDE the function.
  // This prevents the "Missing API Key" error during 'npm run build'.
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const arrayBuffer = await req.arrayBuffer();
    const payload = Buffer.from(arrayBuffer).toString();

    const headers = {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    };

    // Verify the webhook using the secret
    const event = resend.webhooks.verify({
      payload,
      headers,
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });

    if (event.type === "email.received") {
      const emailId = event.data.email_id;

      // Fetch the full email content
      const { data: email } = await resend.emails.receiving.get(emailId);

      // Forward the email
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: process.env.TO_EMAIL,
        subject: email.subject || "(No subject)",
        text: email.text || "",
        html: email.html || "",
      });

      return new Response(JSON.stringify({ status: "forwarded" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Event type not handled" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);

    return new Response(JSON.stringify({ message: "Invalid webhook" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
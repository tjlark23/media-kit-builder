import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Short-term: every submission routes here regardless of which kit generated it.
// Per-kit routing is documented in /FORM-ROUTING-NOTES.md.
const RECIPIENT = "tj@tjlarkin.com";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sponsorName, company, email, message, kitName, contactEmail } = body;

  if (!sponsorName || !company || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);

  try {
    await resend.emails.send({
      from: "Media Kit <onboarding@resend.dev>",
      to: RECIPIENT,
      replyTo: email,
      subject: `Media Kit Inquiry: ${company} re: ${kitName || "Untitled Kit"}`,
      text: [
        `New inquiry from media kit: ${kitName || "Untitled"}`,
        contactEmail ? `Kit's listed contact email (not used for routing yet): ${contactEmail}` : "",
        "",
        `Name: ${sponsorName}`,
        `Company: ${company}`,
        `Email: ${email}`,
        "",
        message ? `Message:\n${message}` : "(No message provided)",
        "",
        "---",
        "Sent via Media Kit Builder - Local Media HQ",
      ].filter(Boolean).join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}

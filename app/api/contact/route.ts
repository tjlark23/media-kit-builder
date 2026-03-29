import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sponsorName, company, email, message, kitName, contactEmail } = body;

  if (!sponsorName || !company || !email || !contactEmail) {
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
      to: contactEmail,
      replyTo: email,
      subject: `Media Kit Inquiry: ${company} re: ${kitName}`,
      text: [
        `New inquiry from your media kit for ${kitName}`,
        "",
        `Name: ${sponsorName}`,
        `Company: ${company}`,
        `Email: ${email}`,
        "",
        message ? `Message:\n${message}` : "(No message provided)",
        "",
        "---",
        "Sent via Media Kit Builder - Local Media HQ",
      ].join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}

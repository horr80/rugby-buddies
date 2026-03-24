import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body as { name: string; email: string; message: string };

    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
    }

    const config = await prisma.contactConfig.findFirst({
      orderBy: { id: "asc" },
    });

    if (!config?.adminEmail) {
      return NextResponse.json({ error: "Contact is not configured" }, { status: 503 });
    }

    const html = `
      <p><strong>From:</strong> ${escapeHtml(String(name))} &lt;${escapeHtml(String(email))}&gt;</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(String(message)).replace(/\n/g, "<br/>")}</p>
    `;

    await sendEmail({
      to: config.adminEmail,
      subject: `Website contact: ${String(name)}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

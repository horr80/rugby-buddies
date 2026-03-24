import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { blastEmailTemplate, sendEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

type RecipientFilter = "all" | "ageGroup" | "block";

async function resolveRecipients(filter: RecipientFilter, filterId?: string) {
  if (filter === "all") {
    return prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  if (filter === "ageGroup") {
    if (!filterId) {
      throw new Error("filterId is required for ageGroup filter");
    }
    return prisma.user.findMany({
      where: {
        isActive: true,
        children: { some: { ageGroupId: filterId } },
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  if (filter === "block") {
    if (!filterId) {
      throw new Error("filterId is required for block filter");
    }
    const bookings = await prisma.booking.findMany({
      where: {
        blockId: filterId,
        status: { not: "CANCELLED" },
      },
      select: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
        },
      },
    });

    const byId = new Map<string, { id: string; email: string; firstName: string; lastName: string }>();
    for (const b of bookings) {
      if (b.user.isActive) {
        byId.set(b.user.id, {
          id: b.user.id,
          email: b.user.email,
          firstName: b.user.firstName,
          lastName: b.user.lastName,
        });
      }
    }
    return Array.from(byId.values());
  }

  throw new Error("Invalid recipient filter");
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { subject, body: htmlBody, recipientFilter, filterId } = body as {
      subject: string;
      body: string;
      recipientFilter: RecipientFilter;
      filterId?: string;
    };

    if (!subject || !htmlBody || !recipientFilter) {
      return NextResponse.json({ error: "subject, body, and recipientFilter are required" }, { status: 400 });
    }

    if (recipientFilter !== "all" && !filterId) {
      return NextResponse.json({ error: "filterId is required for this filter" }, { status: 400 });
    }

    let recipients: { email: string; firstName: string; lastName: string }[];
    try {
      recipients = await resolveRecipients(recipientFilter, filterId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid filter";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const html = blastEmailTemplate(String(subject), String(htmlBody));
    let sent = 0;
    const errors: string[] = [];

    for (const r of recipients) {
      try {
        await sendEmail({ to: r.email, subject: String(subject), html });
        sent++;
      } catch (e) {
        console.error(e);
        errors.push(r.email);
      }
    }

    return NextResponse.json({ sent, failed: errors.length, failedEmails: errors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send email blast" }, { status: 500 });
  }
}

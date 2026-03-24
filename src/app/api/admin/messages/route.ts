import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

export async function GET() {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const senderId = (gate.session.user as { id?: string }).id;
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.message.findMany({
      where: { senderId },
      orderBy: { sentAt: "desc" },
      take: 400,
    });

    const groups = new Map<
      string,
      { subject: string; body: string; sentAt: string; recipientCount: number }
    >();

    for (const r of rows) {
      const key = `${r.sentAt.toISOString()}\0${r.subject}\0${r.body}`;
      const prev = groups.get(key);
      if (prev) prev.recipientCount += 1;
      else
        groups.set(key, {
          subject: r.subject,
          body: r.body,
          sentAt: r.sentAt.toISOString(),
          recipientCount: 1,
        });
    }

    const batches = Array.from(groups.values()).sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );

    return NextResponse.json(batches);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sent messages" }, { status: 500 });
  }
}

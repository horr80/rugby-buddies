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

    const reminders = await prisma.reminder.findMany({
      include: {
        block: {
          include: {
            term: true,
            ageGroup: true,
            sessions: true,
          },
        },
        sentReminders: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { sentAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reminders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { blockId, sendBeforeDays, message, isActive } = body as {
      blockId: string;
      sendBeforeDays?: number;
      message: string;
      isActive?: boolean;
    };

    if (!blockId || !message) {
      return NextResponse.json({ error: "blockId and message are required" }, { status: 400 });
    }

    const block = await prisma.block.findUnique({ where: { id: blockId } });
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        blockId: String(blockId),
        sendBeforeDays: sendBeforeDays != null ? Number(sendBeforeDays) : 2,
        message: String(message),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        block: {
          include: {
            term: true,
            ageGroup: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}

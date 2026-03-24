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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: { recipientId: userId },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const senderId = (gate.session.user as { id?: string }).id;
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, body: messageBody, recipientIds } = body as {
      subject: string;
      body: string;
      recipientIds: string[];
    };

    if (!subject || !messageBody || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "subject, body, and recipientIds are required" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true },
    });

    if (users.length !== recipientIds.length) {
      return NextResponse.json({ error: "One or more recipients not found" }, { status: 400 });
    }

    await prisma.$transaction(
      recipientIds.map((recipientId) =>
        prisma.message.create({
          data: {
            subject: String(subject),
            body: String(messageBody),
            senderId,
            recipientId,
          },
        })
      )
    );

    return NextResponse.json({ sent: recipientIds.length }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send messages" }, { status: 500 });
  }
}

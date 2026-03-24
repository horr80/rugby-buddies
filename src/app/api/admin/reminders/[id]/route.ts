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

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.reminder.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: { blockId?: string; sendBeforeDays?: number; message?: string; isActive?: boolean } = {};

    if (body.blockId !== undefined) {
      const block = await prisma.block.findUnique({ where: { id: String(body.blockId) } });
      if (!block) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 });
      }
      data.blockId = String(body.blockId);
    }
    if (body.sendBeforeDays !== undefined) data.sendBeforeDays = Number(body.sendBeforeDays);
    if (body.message !== undefined) data.message = String(body.message);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data,
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

    return NextResponse.json(reminder);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.reminder.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    await prisma.reminder.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}

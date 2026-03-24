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

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const block = await prisma.block.findUnique({
      where: { id: params.id },
      include: {
        sessions: true,
        ageGroup: true,
        term: true,
        bookings: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
            child: true,
          },
        },
        reminders: true,
        _count: { select: { bookings: true } },
      },
    });

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    return NextResponse.json(block);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load block" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.block.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const body = await request.json();
    const sessionsPayload = body.sessions as
      | { date: string; startTime: string; endTime: string }[]
      | undefined;

    if (sessionsPayload !== undefined) {
      if (!Array.isArray(sessionsPayload) || sessionsPayload.length === 0) {
        return NextResponse.json(
          { error: "sessions must be a non-empty array when provided" },
          { status: 400 }
        );
      }
      await prisma.$transaction([
        prisma.session.deleteMany({ where: { blockId: params.id } }),
        prisma.session.createMany({
          data: sessionsPayload.map((s) => ({
            blockId: params.id,
            date: new Date(s.date),
            startTime: String(s.startTime),
            endTime: String(s.endTime),
          })),
        }),
      ]);
    }

    const allowed = [
      "title",
      "description",
      "termId",
      "ageGroupId",
      "locationName",
      "locationAddress",
      "maxSlots",
      "priceInPence",
      "paymentLink",
      "paymentProvider",
      "isActive",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0 && sessionsPayload === undefined) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const block =
      Object.keys(data).length > 0
        ? await prisma.block.update({
            where: { id: params.id },
            data,
            include: {
              sessions: true,
              ageGroup: true,
              term: true,
              _count: { select: { bookings: true } },
            },
          })
        : await prisma.block.findUniqueOrThrow({
            where: { id: params.id },
            include: {
              sessions: true,
              ageGroup: true,
              term: true,
              _count: { select: { bookings: true } },
            },
          });

    return NextResponse.json(block);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.block.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await prisma.block.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete block" }, { status: 500 });
  }
}

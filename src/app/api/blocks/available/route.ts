import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BookingStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const [blocks, children, existingBookings, counts] = await Promise.all([
      prisma.block.findMany({
        where: {
          isActive: true,
          term: { isActive: true },
        },
        include: {
          term: true,
          ageGroup: true,
          sessions: { orderBy: { date: "asc" } },
        },
        orderBy: [{ term: { startDate: "asc" } }, { title: "asc" }],
      }),
      prisma.child.findMany({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          ageGroupId: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.booking.findMany({
        where: {
          userId,
          status: { not: BookingStatus.CANCELLED },
        },
        select: { blockId: true, childId: true },
      }),
      prisma.booking.groupBy({
        by: ["blockId"],
        where: { status: BookingStatus.CONFIRMED },
        _count: { _all: true },
      }),
    ]);

    const confirmedByBlock = Object.fromEntries(
      counts.map((c) => [c.blockId, c._count._all])
    );

    const blocksWithCounts = blocks.map((b) => ({
      ...b,
      _count: {
        confirmedBookings: confirmedByBlock[b.id] ?? 0,
      },
    }));

    return NextResponse.json({
      blocks: blocksWithCounts,
      children,
      existingBookings,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load available blocks" }, { status: 500 });
  }
}

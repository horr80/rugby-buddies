import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const termId = searchParams.get("termId");

  const where: Record<string, unknown> = { isActive: true };
  if (termId) where.termId = termId;

  const blocks = await prisma.block.findMany({
    where,
    select: {
      id: true,
      title: true,
      maxSlots: true,
      ageGroup: { select: { id: true, name: true, sortOrder: true } },
      term: { select: { id: true, name: true } },
      _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
    },
    orderBy: [{ ageGroup: { sortOrder: "asc" } }, { title: "asc" }],
  });

  const result = blocks.map((b) => ({
    id: b.id,
    title: b.title,
    maxSlots: b.maxSlots,
    booked: b._count.bookings,
    available: Math.max(0, b.maxSlots - b._count.bookings),
    ageGroup: b.ageGroup,
    term: b.term,
  }));

  return NextResponse.json(result);
}

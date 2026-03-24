import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bookingInclude = {
  block: {
    include: {
      sessions: { orderBy: { date: "asc" as const } },
      ageGroup: true,
      term: true,
    },
  },
  child: true,
} as const;

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

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load your bookings" }, { status: 500 });
  }
}

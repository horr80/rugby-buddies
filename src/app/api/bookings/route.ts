import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BookingStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bookingInclude = {
  user: { select: { firstName: true, lastName: true, email: true } },
  block: {
    include: {
      sessions: true,
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

    const role = (session.user as { role?: string }).role;
    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = role === "ADMIN" ? {} : { userId };

    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { childId, blockId } = body;

    if (!childId || !blockId) {
      return NextResponse.json({ error: "childId and blockId are required" }, { status: 400 });
    }

    const child = await prisma.child.findFirst({
      where: { id: childId, userId },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found or access denied" }, { status: 403 });
    }

    const block = await prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block || !block.isActive) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const confirmedCount = await prisma.booking.count({
      where: {
        blockId,
        status: BookingStatus.CONFIRMED,
      },
    });

    if (confirmedCount >= block.maxSlots) {
      return NextResponse.json({ error: "This block is full" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        childId,
        blockId,
      },
      include: bookingInclude,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (e: unknown) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "This child is already booked on this block" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

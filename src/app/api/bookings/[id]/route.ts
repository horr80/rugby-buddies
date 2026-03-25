import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAdmin = role === "ADMIN";
    const isOwner = booking.userId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, paymentStatus, paymentReference } = body as {
      status?: string;
      paymentStatus?: string;
      paymentReference?: string | null;
    };

    if (status !== undefined && !isAdmin) {
      return NextResponse.json({ error: "Only admins can change booking status" }, { status: 403 });
    }

    const data: {
      status?: string;
      paymentStatus?: string;
      paymentReference?: string | null;
    } = {};

    if (status !== undefined) data.status = status;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (paymentReference !== undefined) data.paymentReference = paymentReference;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data,
      include: bookingInclude,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (role !== "ADMIN" && booking.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
      include: bookingInclude,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}

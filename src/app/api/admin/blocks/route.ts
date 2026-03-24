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

    const blocks = await prisma.block.findMany({
      include: {
        sessions: true,
        ageGroup: true,
        term: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blocks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const {
      title,
      description,
      termId,
      ageGroupId,
      locationName,
      locationAddress,
      maxSlots,
      priceInPence,
      paymentLink,
      paymentProvider,
      sessions,
    } = body as {
      title: string;
      description?: string | null;
      termId: string;
      ageGroupId: string;
      locationName: string;
      locationAddress?: string | null;
      maxSlots: number;
      priceInPence: number;
      paymentLink?: string | null;
      paymentProvider?: string | null;
      sessions: { date: string; startTime: string; endTime: string }[];
    };

    if (!title || !termId || !ageGroupId || !locationName || maxSlots == null || priceInPence == null) {
      return NextResponse.json({ error: "Missing required block fields" }, { status: 400 });
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "At least one session is required" }, { status: 400 });
    }

    const block = await prisma.block.create({
      data: {
        title: String(title),
        description: description != null ? String(description) : null,
        termId: String(termId),
        ageGroupId: String(ageGroupId),
        locationName: String(locationName),
        locationAddress: locationAddress != null ? String(locationAddress) : null,
        maxSlots: Number(maxSlots),
        priceInPence: Number(priceInPence),
        paymentLink: paymentLink != null ? String(paymentLink) : null,
        paymentProvider: paymentProvider != null ? String(paymentProvider) : null,
        sessions: {
          create: sessions.map((s) => ({
            date: new Date(s.date),
            startTime: String(s.startTime),
            endTime: String(s.endTime),
          })),
        },
      },
      include: {
        sessions: true,
        ageGroup: true,
        term: true,
        _count: { select: { bookings: true } },
      },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create block" }, { status: 500 });
  }
}

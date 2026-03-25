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

    const terms = await prisma.term.findMany({
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(terms);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { name, type, startDate, endDate, isActive } = body as {
      name: string;
      type: string;
      startDate: string;
      endDate: string;
      isActive?: boolean;
    };

    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json({ error: "name, type, startDate, and endDate are required" }, { status: 400 });
    }

    if (!["AUTUMN", "WINTER", "SUMMER"].includes(type)) {
      return NextResponse.json({ error: "Invalid term type" }, { status: 400 });
    }

    const term = await prisma.term.create({
      data: {
        name: String(name),
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
  }
}

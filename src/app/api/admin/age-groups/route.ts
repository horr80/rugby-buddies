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

    const ageGroups = await prisma.ageGroup.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(ageGroups);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load age groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { name, minAge, maxAge, sortOrder } = body as {
      name: string;
      minAge: number;
      maxAge: number;
      sortOrder?: number;
    };

    if (!name || minAge == null || maxAge == null) {
      return NextResponse.json({ error: "name, minAge, and maxAge are required" }, { status: 400 });
    }

    const ageGroup = await prisma.ageGroup.create({
      data: {
        name: String(name),
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(ageGroup, { status: 201 });
  } catch (e: unknown) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "An age group with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create age group" }, { status: 500 });
  }
}

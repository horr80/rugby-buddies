import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
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

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const { searchParams } = new URL(request.url);
    const ageGroupId = searchParams.get("ageGroupId");
    const search = searchParams.get("search");

    const clauses: Prisma.UserWhereInput[] = [];

    if (ageGroupId) {
      clauses.push({ children: { some: { ageGroupId } } });
    }

    if (search?.trim()) {
      const q = search.trim();
      clauses.push({
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.UserWhereInput =
      clauses.length > 1 ? { AND: clauses } : clauses[0] ?? {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        children: {
          include: { ageGroup: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

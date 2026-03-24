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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    if (body.isActive === undefined) {
      return NextResponse.json({ error: "isActive is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: Boolean(body.isActive) },
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
    });

    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

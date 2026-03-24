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

    const existing = await prisma.ageGroup.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Age group not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: { name?: string; minAge?: number; maxAge?: number; sortOrder?: number } = {};

    if (body.name !== undefined) data.name = String(body.name);
    if (body.minAge !== undefined) data.minAge = Number(body.minAge);
    if (body.maxAge !== undefined) data.maxAge = Number(body.maxAge);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const ageGroup = await prisma.ageGroup.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(ageGroup);
  } catch (e: unknown) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "An age group with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update age group" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.ageGroup.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Age group not found" }, { status: 404 });
    }

    await prisma.ageGroup.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete age group" }, { status: 500 });
  }
}

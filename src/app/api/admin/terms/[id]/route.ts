import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TermType } from "@prisma/client";
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

    const existing = await prisma.term.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      name?: string;
      type?: TermType;
      startDate?: Date;
      endDate?: Date;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) data.name = String(body.name);
    if (body.type !== undefined) {
      if (!Object.values(TermType).includes(body.type)) {
        return NextResponse.json({ error: "Invalid term type" }, { status: 400 });
      }
      data.type = body.type;
    }
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = new Date(body.endDate);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const term = await prisma.term.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(term);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update term" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.term.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    await prisma.term.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete term" }, { status: 500 });
  }
}

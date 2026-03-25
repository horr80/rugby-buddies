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

    const existing = await prisma.mediaItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      type?: string;
      url?: string;
      thumbnailUrl?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (body.title !== undefined) data.title = String(body.title);
    if (body.type !== undefined) {
      if (!["VIDEO", "PHOTO"].includes(body.type)) {
        return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
      }
      data.type = body.type;
    }
    if (body.url !== undefined) data.url = String(body.url);
    if (body.thumbnailUrl !== undefined) data.thumbnailUrl = body.thumbnailUrl;
    if (body.description !== undefined) data.description = body.description;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const item = await prisma.mediaItem.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update media item" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.mediaItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    await prisma.mediaItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete media item" }, { status: 500 });
  }
}

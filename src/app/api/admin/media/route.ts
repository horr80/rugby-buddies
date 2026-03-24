import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { MediaType } from "@prisma/client";
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

    const items = await prisma.mediaItem.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { title, type, url, thumbnailUrl, description, sortOrder } = body as {
      title: string;
      type: MediaType;
      url: string;
      thumbnailUrl?: string | null;
      description?: string | null;
      sortOrder?: number;
    };

    if (!title || !type || !url) {
      return NextResponse.json({ error: "title, type, and url are required" }, { status: 400 });
    }

    if (!Object.values(MediaType).includes(type)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const item = await prisma.mediaItem.create({
      data: {
        title: String(title),
        type,
        url: String(url),
        thumbnailUrl: thumbnailUrl != null ? String(thumbnailUrl) : null,
        description: description != null ? String(description) : null,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create media item" }, { status: 500 });
  }
}

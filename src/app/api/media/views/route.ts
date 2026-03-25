import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { mediaItemId } = (await request.json()) as { mediaItemId?: string };
    if (!mediaItemId) {
      return NextResponse.json({ error: "mediaItemId required" }, { status: 400 });
    }

    const item = await prisma.mediaItem.findUnique({ where: { id: mediaItemId } });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.mediaView.create({ data: { mediaItemId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

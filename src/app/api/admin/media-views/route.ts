import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const views = await prisma.mediaView.groupBy({
    by: ["mediaItemId"],
    where: { viewedAt: { gte: since } },
    _count: { id: true },
  });

  const mediaIds = views.map((v) => v.mediaItemId);
  const mediaItems = await prisma.mediaItem.findMany({
    where: { id: { in: mediaIds } },
    select: { id: true, title: true, type: true },
  });

  const mediaMap = new Map(mediaItems.map((m) => [m.id, m]));
  const totalViews = views.reduce((sum, v) => sum + v._count.id, 0);

  const breakdown = views
    .map((v) => ({
      mediaItemId: v.mediaItemId,
      title: mediaMap.get(v.mediaItemId)?.title ?? "Unknown",
      type: mediaMap.get(v.mediaItemId)?.type ?? "VIDEO",
      views: v._count.id,
    }))
    .sort((a, b) => b.views - a.views);

  return NextResponse.json({ totalViews, breakdown, days });
}

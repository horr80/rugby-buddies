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
    const profile = await prisma.coachProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(profile);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load coach profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.coachProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const body = await request.json();
    const allowed = [
      "name",
      "title",
      "bio",
      "photoUrl",
      "careerHighlights",
      "stats",
      "achievements",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (!existing) {
      if (body.name == null || body.bio == null) {
        return NextResponse.json(
          { error: "name and bio are required to create the coach profile" },
          { status: 400 }
        );
      }
      const profile = await prisma.coachProfile.create({
        data: {
          name: String(body.name),
          title: body.title ?? null,
          bio: String(body.bio),
          photoUrl: body.photoUrl ?? null,
          careerHighlights: body.careerHighlights ?? null,
          stats: body.stats ?? null,
          achievements: body.achievements ?? null,
        },
      });
      return NextResponse.json(profile);
    }

    const profile = await prisma.coachProfile.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json(profile);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update coach profile" }, { status: 500 });
  }
}

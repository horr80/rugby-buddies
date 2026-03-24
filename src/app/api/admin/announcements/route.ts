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

    const announcements = await prisma.announcement.findMany({
      orderBy: { publishDate: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(announcements);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const userId = (gate.session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, publishDate, isActive } = body as {
      title: string;
      content: string;
      publishDate?: string;
      isActive?: boolean;
    };

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title),
        content: String(content),
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

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

    const rows = await prisma.siteSettings.findMany();
    const pairs: Record<string, string> = {};
    for (const row of rows) {
      pairs[row.key] = row.value;
    }

    return NextResponse.json(pairs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (key == null || value == null) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const setting = await prisma.siteSettings.upsert({
      where: { key: String(key) },
      create: { key: String(key), value: String(value) },
      update: { value: String(value) },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}

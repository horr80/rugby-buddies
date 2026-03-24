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

    const config = await prisma.contactConfig.findFirst({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(config);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load contact config" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate) return gate.error;

    const existing = await prisma.contactConfig.findFirst({
      orderBy: { id: "asc" },
    });

    const body = await request.json();
    const data: {
      adminEmail?: string;
      phone?: string | null;
      address?: string | null;
      mapEmbedUrl?: string | null;
      additionalInfo?: string | null;
    } = {};

    if (body.adminEmail !== undefined) data.adminEmail = String(body.adminEmail);
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.address !== undefined) data.address = body.address;
    if (body.mapEmbedUrl !== undefined) data.mapEmbedUrl = body.mapEmbedUrl;
    if (body.additionalInfo !== undefined) data.additionalInfo = body.additionalInfo;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const config = existing
      ? await prisma.contactConfig.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.contactConfig.create({
          data: {
            adminEmail: String(body.adminEmail ?? ""),
            phone: body.phone ?? null,
            address: body.address ?? null,
            mapEmbedUrl: body.mapEmbedUrl ?? null,
            additionalInfo: body.additionalInfo ?? null,
            ...data,
          },
        });

    return NextResponse.json(config);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update contact config" }, { status: 500 });
  }
}

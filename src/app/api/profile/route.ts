import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        children: {
          orderBy: { createdAt: "asc" },
          include: {
            ageGroup: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, mobile } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobile?: string | null;
    };

    if (firstName !== undefined && !String(firstName).trim()) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (lastName !== undefined && !String(lastName).trim()) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    }
    if (email !== undefined && !String(email).trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail =
      email !== undefined ? String(email).trim().toLowerCase() : undefined;

    if (normalizedEmail) {
      const taken = await prisma.user.findFirst({
        where: { email: normalizedEmail, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobile?: string | null;
    } = {};

    if (firstName !== undefined) data.firstName = String(firstName).trim();
    if (lastName !== undefined) data.lastName = String(lastName).trim();
    if (normalizedEmail !== undefined) data.email = normalizedEmail;
    if (mobile !== undefined) {
      const m = mobile == null ? null : String(mobile).trim();
      data.mobile = m || null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        children: {
          orderBy: { createdAt: "asc" },
          include: {
            ageGroup: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

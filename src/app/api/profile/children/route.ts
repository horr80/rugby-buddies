import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, dateOfBirth } = body as {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !dateOfBirth) {
      return NextResponse.json(
        { error: "firstName, lastName, and dateOfBirth are required" },
        { status: 400 }
      );
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }

    const child = await prisma.child.create({
      data: {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
      },
      include: {
        ageGroup: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(child, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add child" }, { status: 500 });
  }
}

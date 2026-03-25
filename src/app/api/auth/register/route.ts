import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      mobile,
      childFirstName,
      childLastName,
      childDateOfBirth,
    } = body;

    if (!email || !password || !firstName || !lastName || !childFirstName || !childLastName || !childDateOfBirth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(String(password), 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        firstName: String(firstName),
        lastName: String(lastName),
        mobile: mobile != null ? String(mobile) : null,
        role: "PARENT",
        children: {
          create: {
            firstName: String(childFirstName),
            lastName: String(childLastName),
            dateOfBirth: new Date(childDateOfBirth),
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        children: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

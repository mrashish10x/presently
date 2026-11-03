
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
}

function createSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "college"}-${randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schoolName = String(body.schoolName ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    // Validate required fields
    if (!schoolName || !adminName || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (schoolName.length > 120 || adminName.length > 100) {
      return NextResponse.json(
        { success: false, message: "School name or admin name is too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already registered. Please log in." },
        { status: 409 }
      );
    }

    // Securely hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create School and Admin together
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug: createSlug(schoolName),
          status: "active",
        },
      });

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email,
          passwordHash,
          role: "ADMIN",
          status: "active",
          phone,
          schoolId: school.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          schoolId: true,
        },
      });

      return { school, admin };
    });

    return NextResponse.json(
      {
        success: true,
        message: "School and Admin account created successfully.",
        admin: result.admin,
        school: {
          id: result.school.id,
          name: result.school.name,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

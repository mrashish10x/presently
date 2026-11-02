import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function createSlug(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "college"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const otp = String(body.otp ?? "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ message: "Enter your email and 6-digit OTP." }, { status: 400 });
    }

    const pending = await prisma.emailVerification.findUnique({ where: { email } });

    if (!pending) {
      return NextResponse.json({ message: "No pending verification found. Please register again." }, { status: 404 });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await prisma.emailVerification.delete({ where: { email } });
      return NextResponse.json({ message: "OTP expired. Please register again." }, { status: 410 });
    }

    if (pending.attempts >= 5) {
      await prisma.emailVerification.delete({ where: { email } });
      return NextResponse.json({ message: "Too many incorrect attempts. Please request a new OTP." }, { status: 429 });
    }

    const valid = await bcrypt.compare(otp, pending.otpHash);

    if (!valid) {
      await prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ message: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      await prisma.emailVerification.deleteMany({ where: { email } });
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: pending.schoolName,
          slug: createSlug(pending.schoolName),
          status: "active",
        },
      });

      const admin = await tx.user.create({
        data: {
          name: pending.adminName,
          email: pending.email,
          passwordHash: pending.passwordHash,
          role: "ADMIN",
          status: "active",
          emailVerifiedAt: new Date(),
          phone: pending.phone,
          schoolId: school.id,
        },
        select: { id: true, name: true, email: true, role: true, schoolId: true },
      });

      await tx.emailVerification.delete({ where: { email } });

      return { school, admin };
    });

    return NextResponse.json({
      success: true,
      message: "Email verified. College and Admin account created successfully. You can now log in.",
      admin: result.admin,
      school: { id: result.school.id, name: result.school.name },
    }, { status: 201 });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json({ message: "Verification failed. Please try again." }, { status: 500 });
  }
}

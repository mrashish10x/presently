import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schoolName = String(body.schoolName ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!schoolName || !adminName || !email || password.length < 8) {
      return NextResponse.json({ message: "Please provide all required details. Password must be at least 8 characters." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    if (schoolName.length > 120 || adminName.length > 100) {
      return NextResponse.json({ message: "Name is too long." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    const previous = await prisma.emailVerification.findUnique({ where: { email } });

    if (previous && Date.now() - previous.createdAt.getTime() < 60_000) {
      return NextResponse.json({ message: "Please wait 60 seconds before requesting another OTP." }, { status: 429 });
    }

    const otp = String(randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM;

    if (!process.env.RESEND_API_KEY || !from) {
      return NextResponse.json({ message: "Email service is not configured." }, { status: 500 });
    }

    await prisma.emailVerification.upsert({
      where: { email },
      create: {
        email, otpHash, passwordHash, schoolName, adminName,
        phone: phone || null, expiresAt, attempts: 0,
      },
      update: {
        otpHash, passwordHash, schoolName, adminName,
        phone: phone || null, expiresAt, attempts: 0,
        createdAt: new Date(),
      },
    });

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Your Presently verification code",
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Verify your email</h2><p>Your Presently verification code is:</p><h1 style="letter-spacing:8px">${otp}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
    });

    if (error) {
      await prisma.emailVerification.deleteMany({ where: { email } });
      console.error("RESEND ERROR:", error);
      return NextResponse.json({ message: "Could not send verification email. Check your Resend sender/domain configuration." }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email. It expires in 10 minutes." });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return NextResponse.json({ message: "Unable to send OTP. Please try again." }, { status: 500 });
  }
}

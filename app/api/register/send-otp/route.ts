
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Read request data
    const body = await request.json();

    const schoolName = String(body.schoolName ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    // 2. Validate required fields
    if (!schoolName || !adminName || !email || password.length < 8) {
      return NextResponse.json(
        {
          message:
            "Please provide all required details. Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (schoolName.length > 120 || adminName.length > 100) {
      return NextResponse.json(
        { message: "Name is too long." },
        { status: 400 }
      );
    }

    // 3. Check environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
      console.error("EMAIL CONFIG ERROR: Missing RESEND_API_KEY or EMAIL_FROM");

      return NextResponse.json(
        { message: "Email service is not configured." },
        { status: 500 }
      );
    }

    // 4. Check existing user
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "This email is already registered." },
        { status: 409 }
      );
    }

    // 5. Check previous OTP request
    const previous = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (
      previous &&
      Date.now() - previous.createdAt.getTime() < 60_000
    ) {
      return NextResponse.json(
        {
          message: "Please wait 60 seconds before requesting another OTP.",
        },
        { status: 429 }
      );
    }

    // 6. Generate OTP
    const otp = String(randomInt(100000, 1000000));

    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 12);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 7. Save OTP in database
    await prisma.emailVerification.upsert({
      where: { email },
      create: {
        email,
        otpHash,
        passwordHash,
        schoolName,
        adminName,
        phone: phone || null,
        expiresAt,
        attempts: 0,
      },
      update: {
        otpHash,
        passwordHash,
        schoolName,
        adminName,
        phone: phone || null,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

    // 8. Send OTP using Resend
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Your Presently verification code",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Verify your email</h2>
          <p>Your Presently verification code is:</p>
          <h1 style="letter-spacing:8px">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>Do not share this code with anyone.</p>
        </div>
      `,
    });

    // 9. Handle Resend error
    if (error) {
      console.error(
        "RESEND ERROR DETAILS:",
        JSON.stringify(error, null, 2)
      );

      await prisma.emailVerification.deleteMany({
        where: { email },
      });

      return NextResponse.json(
        {
          message:
            "Could not send verification email. Check Resend sender/domain configuration.",
        },
        { status: 502 }
      );
    }

    // 10. Success
    console.log("OTP EMAIL SENT:", data?.id);

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email. It expires in 10 minutes.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to send OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}

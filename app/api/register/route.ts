import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use the email OTP registration process." },
    { status: 410 }
  );
}

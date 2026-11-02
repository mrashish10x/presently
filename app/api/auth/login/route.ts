import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "This endpoint is disabled. Use Auth.js login." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Please use the official login page." },
    { status: 410 }
  );
}

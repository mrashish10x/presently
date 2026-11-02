import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const schoolId = session.user.schoolId;
    if (!schoolId) return NextResponse.json({ error: "College is not linked to this account." }, { status: 400 });

    const url = new URL(request.url);
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");
    const start = startParam ? new Date(startParam) : new Date(Date.now() - 29 * 86400000);
    const end = endParam ? new Date(endParam) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: "Invalid report date range." }, { status: 400 });
    }
    // Include the full end date while keeping the query bounded.
    end.setHours(23, 59, 59, 999);
    const records = await prisma.attendance.findMany({
      where: {
        date: { gte: start, lte: end },
        student: { user: { schoolId } },
        subject: { schoolId },
      },
      orderBy: { date: "desc" },
      take: 10000,
      select: {
        id: true, date: true, status: true,
        student: { select: { id: true, rollNo: true, user: { select: { name: true } }, schoolClass: { select: { id: true, name: true, section: true } } } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });
    return NextResponse.json({ records, truncated: records.length === 10000, range: { start: start.toISOString(), end: end.toISOString() } });
  } catch (error) {
    console.error("ADMIN REPORTS ERROR", error);
    return NextResponse.json({ error: "Unable to load reports." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const schoolId = session.user.schoolId;
    if (!schoolId) return NextResponse.json({ error: "College is not linked to this account." }, { status: 400 });
    const [admin, school] = await Promise.all([
      prisma.user.findFirst({ where: { id: session.user.id, schoolId, role: "ADMIN" }, select: { id: true, name: true, email: true, phone: true, role: true } }),
      prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, slug: true, status: true, createdAt: true } }),
    ]);
    if (!admin || !school) return NextResponse.json({ error: "Admin or college not found." }, { status: 404 });
    return NextResponse.json({ admin, school });
  } catch (error) {
    console.error("ADMIN SETTINGS GET ERROR", error);
    return NextResponse.json({ error: "Unable to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const schoolId = session.user.schoolId;
    if (!schoolId) return NextResponse.json({ error: "College is not linked to this account." }, { status: 400 });
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const schoolName = typeof body.schoolName === "string" ? body.schoolName.trim() : "";
    if (!name || name.length > 100) return NextResponse.json({ error: "Admin name is required (maximum 100 characters)." }, { status: 400 });
    if (phone.length > 30) return NextResponse.json({ error: "Phone number is too long." }, { status: 400 });
    if (schoolName && schoolName.length > 150) return NextResponse.json({ error: "College name is too long." }, { status: 400 });

    const { admin, school } = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.update({
        where: { id: session.user.id },
        data: { name, phone: phone || null },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });
      const school = schoolName
        ? await tx.school.update({ where: { id: schoolId }, data: { name: schoolName }, select: { id: true, name: true, slug: true, status: true, createdAt: true } })
        : await tx.school.findUniqueOrThrow({ where: { id: schoolId }, select: { id: true, name: true, slug: true, status: true, createdAt: true } });
      return { admin, school };
    });
    return NextResponse.json({ success: true, admin, school });
  } catch (error) {
    console.error("ADMIN SETTINGS PATCH ERROR", error);
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}

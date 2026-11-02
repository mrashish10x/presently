import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School is not linked to this account." },
        { status: 400 }
      );
    }

    const [admin, school, students, teachers, classes, subjects, attendance] =
      await Promise.all([
        prisma.user.findFirst({
          where: {
            id: session.user.id,
            schoolId,
            role: "ADMIN",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        }),

        prisma.school.findUnique({
          where: { id: schoolId },
          select: { id: true, name: true },
        }),

        prisma.student.count({
          where: { user: { schoolId } },
        }),

        prisma.teacher.count({
          where: { user: { schoolId } },
        }),

        prisma.schoolClass.count({
          where: { schoolId },
        }),

        prisma.subject.count({
          where: { schoolId },
        }),

        prisma.attendance.count({
          where: {
            student: {
              user: { schoolId },
            },
          },
        }),
      ]);

    if (!admin || !school) {
      return NextResponse.json(
        { error: "Admin or school not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      admin,
      school,
      statistics: {
        students,
        teachers,
        classes,
        subjects,
        attendance,
      },
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    return NextResponse.json(
      { error: "Unable to load dashboard data." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAdmin() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN" || !session.user.schoolId) {
    return null;
  }

  return {
    id: session.user.id,
    schoolId: session.user.schoolId,
  };
}

export async function GET() {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      where: { user: { schoolId: admin.schoolId, role: "TEACHER" } },
      select: {
        id: true,
        joinedOn: true,
        assignedClassId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        assignedClass: true,
        subjects: true,
      },
      orderBy: { joinedOn: "desc" },
    });

    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to fetch teachers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const assignedClassId = body.assignedClassId ? String(body.assignedClassId) : null;

    if (!name || !email || password.length < 8) {
      return NextResponse.json({
        success: false,
        message: "Name, valid email and password (minimum 8 characters) are required.",
      }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email address." }, { status: 400 });
    }

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ success: false, message: "This email is already registered." }, { status: 409 });
    }

    if (assignedClassId) {
      const schoolClass = await prisma.schoolClass.findFirst({
        where: { id: assignedClassId, schoolId: admin.schoolId },
        select: { id: true },
      });

      if (!schoolClass) {
        return NextResponse.json({ success: false, message: "Class not found in your college." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "TEACHER",
          status: "active",
          phone: phone || null,
          schoolId: admin.schoolId,
        },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          assignedClassId,
        },
        select: {
          id: true,
          joinedOn: true,
          assignedClassId: true,
          user: {
            select: { id: true, name: true, email: true, phone: true, status: true },
          },
          assignedClass: true,
          subjects: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully.",
      teacher,
    }, { status: 201 });
  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to create teacher." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const teacherId = String(body.teacherId ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const assignedClassId = body.assignedClassId ? String(body.assignedClassId) : null;

    if (!teacherId || !name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Valid teacher details are required." }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, user: { schoolId: admin.schoolId, role: "TEACHER" } },
      select: { id: true, userId: true },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, message: "Teacher not found." }, { status: 404 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email, id: { not: teacher.userId } },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email already in use." }, { status: 409 });
    }

    if (assignedClassId) {
      const schoolClass = await prisma.schoolClass.findFirst({
        where: { id: assignedClassId, schoolId: admin.schoolId },
        select: { id: true },
      });

      if (!schoolClass) {
        return NextResponse.json({ success: false, message: "Class not found in your college." }, { status: 400 });
      }
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: teacher.userId },
        data: { name, email, phone: phone || null },
      });

      return tx.teacher.update({
        where: { id: teacherId },
        data: { assignedClassId },
        select: {
          id: true,
          joinedOn: true,
          assignedClassId: true,
          user: {
            select: { id: true, name: true, email: true, phone: true, status: true },
          },
          assignedClass: true,
          subjects: true,
        },
      });
    });

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error("UPDATE TEACHER ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to update teacher." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const teacherId = String(body.teacherId ?? "");

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "teacherId is required." }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, user: { schoolId: admin.schoolId, role: "TEACHER" } },
      select: { id: true, userId: true },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, message: "Teacher not found." }, { status: 404 });
    }

    const attendanceCount = await prisma.attendance.count({
      where: { teacherId },
    });

    if (attendanceCount > 0) {
      return NextResponse.json({
        success: false,
        message: "Teacher has attendance records and cannot be deleted.",
      }, { status: 409 });
    }

    await prisma.user.delete({ where: { id: teacher.userId } });

    return NextResponse.json({ success: true, message: "Teacher deleted successfully." });
  } catch (error) {
    console.error("DELETE TEACHER ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to delete teacher." }, { status: 500 });
  }
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getAuthorizedUser(allowedRoles: string[]) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role || !session.user.schoolId) {
    return {
      error: Response.json(
        {
          success: false,
          message: "Please sign in first",
        },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role.toUpperCase();

  if (!allowedRoles.includes(role)) {
    return {
      error: Response.json(
        {
          success: false,
          message: "You do not have permission to perform this action",
        },
        { status: 403 }
      ),
    };
  }

  return {
    userId: session.user.id,
    role,
    schoolId: session.user.schoolId,
  };
}

// GET STUDENTS
export async function GET() {
  try {
    const access = await getAuthorizedUser(["ADMIN", "TEACHER", "STUDENT"]);

    if ("error" in access) {
      return access.error;
    }

    if (access.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: access.userId, user: { schoolId: access.schoolId, status: "active" }, schoolClass: { schoolId: access.schoolId } },
        select: {
          id: true,
          rollNo: true,
          guardianName: true,
          joinedOn: true,
          classId: true,
          user: { select: { id: true, name: true, email: true, phone: true, status: true, avatarColor: true } },
          schoolClass: true,
        },
      });
      if (!student) return Response.json({ success: false, message: "Student profile not found" }, { status: 404 });
      return Response.json({ success: true, students: [student] });
    }

    const teacherProfile = access.role === "TEACHER"
      ? await prisma.teacher.findFirst({ where: { userId: access.userId, user: { schoolId: access.schoolId, status: "active" } }, select: { assignedClassId: true, classTeacherFor: { select: { id: true } } } })
      : null;
    if (access.role === "TEACHER" && !teacherProfile) {
      return Response.json({ success: false, message: "Teacher profile not found" }, { status: 403 });
    }
    const teacherClassIds = teacherProfile
      ? [...new Set([teacherProfile.assignedClassId, ...teacherProfile.classTeacherFor.map((item) => item.id)].filter((id): id is string => Boolean(id)))]
      : [];
    const students = await prisma.student.findMany({
      where: { schoolClass: { schoolId: access.schoolId, ...(access.role === "TEACHER" ? { id: { in: teacherClassIds.length ? teacherClassIds : ["__no_assigned_class__"] } } : {}) } },
      select: {
        id: true,
        rollNo: true,
        guardianName: true,
        joinedOn: true,
        classId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            avatarColor: true,
          },
        },
        schoolClass: true,
      },
      orderBy: {
        rollNo: "asc",
      },
    });

    return Response.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to fetch students",
      },
      { status: 500 }
    );
  }
}

// CREATE STUDENT — ADMIN ONLY
export async function POST(request: Request) {
  const access = await getAuthorizedUser(["ADMIN"]);

  if ("error" in access) {
    return access.error;
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rollNo = String(body.rollNo ?? "").trim();
    const classId = String(body.classId ?? "").trim();
    const guardianName = body.guardianName
      ? String(body.guardianName).trim()
      : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!name || !email || !password || !rollNo || !classId) {
      return Response.json(
        {
          success: false,
          message: "name, email, password, rollNo and classId are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must contain at least 8 characters",
        },
        { status: 400 }
      );
    }

    const schoolClass = await prisma.schoolClass.findFirst({
      where: { id: classId, schoolId: access.schoolId },
      select: { id: true },
    });

    if (!schoolClass) {
      return Response.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return Response.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const existingStudent = await prisma.student.findFirst({
      where: { rollNo, classId },
      select: { id: true },
    });

    if (existingStudent) {
      return Response.json(
        {
          success: false,
          message: "This roll number already exists in this class",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "STUDENT",
          phone,
          schoolId: access.schoolId,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          rollNo,
          classId,
          guardianName,
        },
        select: {
          id: true,
          rollNo: true,
          guardianName: true,
          joinedOn: true,
          classId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          schoolClass: true,
        },
      });
    });

    return Response.json(
      {
        success: true,
        message: "Student created successfully",
        student,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create student",
      },
      { status: 500 }
    );
  }
}

// UPDATE STUDENT — ADMIN ONLY
export async function PATCH(request: Request) {
  const access = await getAuthorizedUser(["ADMIN"]);

  if ("error" in access) {
    return access.error;
  }

  try {
    const body = await request.json();

    const {
      studentId,
      name,
      email,
      rollNo,
      classId,
      guardianName,
      phone,
      status,
    } = body;

    if (typeof studentId !== "string" || !studentId) {
      return Response.json(
        { success: false, message: "studentId is required" },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      !["active", "inactive"].includes(status)
    ) {
      return Response.json(
        { success: false, message: "Invalid account status" },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findFirst({
      where: { id: studentId, schoolClass: { schoolId: access.schoolId } },
      include: { user: true },
    });

    if (!existingStudent) {
      return Response.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : undefined;

    if (normalizedEmail && normalizedEmail !== existingStudent.user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (emailUser) {
        return Response.json(
          { success: false, message: "This email is already in use" },
          { status: 409 }
        );
      }
    }

    if (classId !== undefined) {
      if (typeof classId !== "string" || !classId) {
        return Response.json(
          { success: false, message: "Invalid classId" },
          { status: 400 }
        );
      }

      const schoolClass = await prisma.schoolClass.findFirst({
        where: { id: classId, schoolId: access.schoolId },
        select: { id: true },
      });

      if (!schoolClass) {
        return Response.json(
          { success: false, message: "Class not found" },
          { status: 404 }
        );
      }
    }

    const nextRollNo =
      typeof rollNo === "string" ? rollNo.trim() : existingStudent.rollNo;

    const nextClassId =
      typeof classId === "string" ? classId : existingStudent.classId;

    const duplicateRoll = await prisma.student.findFirst({
      where: {
        rollNo: nextRollNo,
        classId: nextClassId,
        id: { not: studentId },
      },
      select: { id: true },
    });

    if (duplicateRoll) {
      return Response.json(
        {
          success: false,
          message: "This roll number already exists in this class",
        },
        { status: 409 }
      );
    }

    const updatedStudent = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(phone !== undefined && {
            phone: phone ? String(phone).trim() : null,
          }),
          ...(status !== undefined && { status }),
        },
      });

      return tx.student.update({
        where: { id: studentId },
        data: {
          ...(rollNo !== undefined && { rollNo: nextRollNo }),
          ...(classId !== undefined && { classId: nextClassId }),
          ...(guardianName !== undefined && {
            guardianName: guardianName
              ? String(guardianName).trim()
              : null,
          }),
        },
        select: {
          id: true,
          rollNo: true,
          guardianName: true,
          joinedOn: true,
          classId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          schoolClass: true,
        },
      });
    });

    return Response.json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to update student",
      },
      { status: 500 }
    );
  }
}

// DELETE STUDENT — ADMIN ONLY
export async function DELETE(request: Request) {
  const access = await getAuthorizedUser(["ADMIN"]);

  if ("error" in access) {
    return access.error;
  }

  try {
    const body = await request.json();
    const studentId = body.studentId;

    if (typeof studentId !== "string" || !studentId) {
      return Response.json(
        { success: false, message: "studentId is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolClass: { schoolId: access.schoolId } },
      select: { id: true, userId: true },
    });

    if (!student) {
      return Response.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: student.userId },
    });

    return Response.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to delete student",
      },
      { status: 500 }
    );
  }
}
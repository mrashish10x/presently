import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role || !session.user.schoolId) return null;
  return { userId: session.user.id, role: session.user.role.toUpperCase(), schoolId: session.user.schoolId };
}

async function getAdminAccess() {
  const access = await getSession();
  if (!access || access.role !== "ADMIN") return null;
  return access;
}

export async function GET() {
  try {
    const access = await getSession();
    if (!access || !["ADMIN", "TEACHER", "STUDENT"].includes(access.role)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let classFilter: { id?: string | { in: string[] } } = {};
    if (access.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: access.userId, user: { schoolId: access.schoolId }, schoolClass: { schoolId: access.schoolId } },
        select: { classId: true },
      });
      if (!student) return Response.json({ success: false, message: "Student profile not found" }, { status: 404 });
      classFilter = { id: student.classId };
    } else if (access.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: access.userId, user: { schoolId: access.schoolId } },
        select: { assignedClassId: true, classTeacherFor: { select: { id: true } } },
      });
      if (!teacher) return Response.json({ success: false, message: "Teacher profile not found" }, { status: 403 });
      const ids = [...new Set([teacher.assignedClassId, ...teacher.classTeacherFor.map((item) => item.id)].filter((id): id is string => Boolean(id)))];
      classFilter = { id: { in: ids.length ? ids : ["__no_assigned_class__"] } };
    }

    const classes = await prisma.schoolClass.findMany({
      where: { schoolId: access.schoolId, ...classFilter },
      include: {
        students: { select: { id: true, rollNo: true, user: { select: { id: true, name: true, email: true } } } },
        classTeacher: { include: { user: { select: { id: true, name: true, email: true } } } },
        subjects: { select: { id: true, name: true, code: true, teacherId: true } },
      },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    });
    return Response.json({ success: true, classes });
  } catch (error) {
    console.error("GET CLASSES ERROR:", error);
    return Response.json({ success: false, message: "Unable to fetch classes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await getAdminAccess();
    if (!access) return Response.json({ success: false, message: "Admin access required" }, { status: 403 });
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const section = typeof body.section === "string" ? body.section.trim() : "";
    const classTeacherId = typeof body.classTeacherId === "string" && body.classTeacherId ? body.classTeacherId : null;
    if (!name || !section || name.length > 80 || section.length > 40) {
      return Response.json({ success: false, message: "Valid class name and section are required" }, { status: 400 });
    }
    if (classTeacherId) {
      const teacher = await prisma.teacher.findFirst({ where: { id: classTeacherId, user: { schoolId: access.schoolId, role: "TEACHER" } }, select: { id: true } });
      if (!teacher) return Response.json({ success: false, message: "Class teacher not found in this college" }, { status: 400 });
    }
    const existing = await prisma.schoolClass.findFirst({ where: { schoolId: access.schoolId, name, section }, select: { id: true } });
    if (existing) return Response.json({ success: false, message: "This class already exists" }, { status: 409 });
    const schoolClass = await prisma.schoolClass.create({
      data: { name, section, schoolId: access.schoolId, classTeacherId },
      include: { students: true, classTeacher: { include: { user: { select: { id: true, name: true, email: true } } } }, subjects: true },
    });
    return Response.json({ success: true, message: "Class created successfully", class: schoolClass }, { status: 201 });
  } catch (error) {
    console.error("CREATE CLASS ERROR:", error);
    return Response.json({ success: false, message: "Unable to create class" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await getAdminAccess();
    if (!access) return Response.json({ success: false, message: "Admin access required" }, { status: 403 });
    const body = await request.json();
    const classId = typeof body.classId === "string" ? body.classId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const section = typeof body.section === "string" ? body.section.trim() : "";
    const classTeacherId = typeof body.classTeacherId === "string" && body.classTeacherId ? body.classTeacherId : null;
    if (!classId || !name || !section || name.length > 80 || section.length > 40) {
      return Response.json({ success: false, message: "Valid classId, name and section are required" }, { status: 400 });
    }
    const existing = await prisma.schoolClass.findFirst({ where: { id: classId, schoolId: access.schoolId }, select: { id: true } });
    if (!existing) return Response.json({ success: false, message: "Class not found" }, { status: 404 });
    if (classTeacherId) {
      const teacher = await prisma.teacher.findFirst({ where: { id: classTeacherId, user: { schoolId: access.schoolId, role: "TEACHER" } }, select: { id: true } });
      if (!teacher) return Response.json({ success: false, message: "Class teacher not found in this college" }, { status: 400 });
    }
    const duplicate = await prisma.schoolClass.findFirst({ where: { schoolId: access.schoolId, name, section, id: { not: classId } }, select: { id: true } });
    if (duplicate) return Response.json({ success: false, message: "This class already exists" }, { status: 409 });
    const updated = await prisma.schoolClass.update({
      where: { id: classId }, data: { name, section, classTeacherId },
      include: { students: true, classTeacher: { include: { user: { select: { id: true, name: true, email: true } } } }, subjects: true },
    });
    return Response.json({ success: true, message: "Class updated successfully", class: updated });
  } catch (error) {
    console.error("UPDATE CLASS ERROR:", error);
    return Response.json({ success: false, message: "Unable to update class" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await getAdminAccess();
    if (!access) return Response.json({ success: false, message: "Admin access required" }, { status: 403 });
    const body = await request.json();
    const classId = typeof body.classId === "string" ? body.classId : "";
    if (!classId) return Response.json({ success: false, message: "classId is required" }, { status: 400 });
    const schoolClass = await prisma.schoolClass.findFirst({ where: { id: classId, schoolId: access.schoolId }, include: { students: { select: { id: true } }, subjects: { select: { id: true } } } });
    if (!schoolClass) return Response.json({ success: false, message: "Class not found" }, { status: 404 });
    if (schoolClass.students.length || schoolClass.subjects.length) {
      return Response.json({ success: false, message: "Cannot delete a class that still has students or subjects" }, { status: 409 });
    }
    await prisma.schoolClass.delete({ where: { id: classId } });
    return Response.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    console.error("DELETE CLASS ERROR:", error);
    return Response.json({ success: false, message: "Unable to delete class" }, { status: 500 });
  }
}

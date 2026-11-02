import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAccess() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return { error: Response.json({ message: "Please login first." }, { status: 401 }) };
  const role = session.user.role.toUpperCase();
  if (!["ADMIN", "TEACHER", "STUDENT"].includes(role)) return { error: Response.json({ message: "Access denied." }, { status: 403 }) };
  if (!session.user.schoolId) return { error: Response.json({ message: "Account is not linked to a college." }, { status: 403 }) };
  if (role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id, user: { schoolId: session.user.schoolId, status: "active" }, schoolClass: { schoolId: session.user.schoolId } },
      select: { id: true, classId: true },
    });
    if (!student) return { error: Response.json({ message: "Student profile not found." }, { status: 403 }) };
    return { userId: session.user.id, role: "STUDENT" as const, schoolId: session.user.schoolId, studentId: student.id, classId: student.classId };
  }
  if (role === "ADMIN") return { userId: session.user.id, role: "ADMIN" as const, schoolId: session.user.schoolId, teacherId: null as string | null, classIds: null as string[] | null };
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true, assignedClassId: true, user: { select: { schoolId: true } }, classTeacherFor: { select: { id: true } } } });
  if (!teacher || teacher.user.schoolId !== session.user.schoolId) return { error: Response.json({ message: "Teacher profile not found." }, { status: 403 }) };
  const classIds = [...new Set([teacher.assignedClassId, ...teacher.classTeacherFor.map((c) => c.id)].filter((id): id is string => Boolean(id)))];
  return { userId: session.user.id, role: "TEACHER" as const, schoolId: session.user.schoolId, teacherId: teacher.id, classIds };
}

export async function GET() {
  try {
    const access = await getAccess(); if ("error" in access) return access.error;
    if (access.role === "STUDENT") {
      const [student, subjects, attendance] = await Promise.all([
        prisma.student.findUnique({ where: { id: access.studentId }, include: { user: { select: { id: true, name: true, email: true, avatarColor: true } }, schoolClass: { select: { id: true, name: true, section: true } } } }),
        prisma.subject.findMany({ where: { schoolId: access.schoolId, classId: access.classId }, select: { id: true, name: true, code: true, classId: true }, orderBy: { name: "asc" } }),
        prisma.attendance.findMany({ where: { studentId: access.studentId, student: { schoolClass: { schoolId: access.schoolId } }, subject: { schoolId: access.schoolId, classId: access.classId } }, include: { subject: true, teacher: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { date: "desc" } }),
      ]);
      return Response.json({ success: true, students: student ? [student] : [], subjects, attendance });
    }
    const studentWhere = { schoolClass: { is: { schoolId: access.schoolId, ...(access.classIds ? { id: { in: access.classIds } } : {}) } } };
    const subjectWhere = { schoolId: access.schoolId, ...(access.teacherId ? { teacherId: access.teacherId, classId: { in: access.classIds ?? [] } } : {}) };
    const [students, subjects, attendance] = await Promise.all([
      prisma.student.findMany({ where: studentWhere, include: { user: { select: { id: true, name: true, email: true, avatarColor: true } }, schoolClass: { select: { id: true, name: true, section: true } } }, orderBy: { rollNo: "asc" } }),
      prisma.subject.findMany({ where: subjectWhere, select: { id: true, name: true, code: true, classId: true }, orderBy: { name: "asc" } }),
      prisma.attendance.findMany({ where: { student: { is: studentWhere }, subject: { is: subjectWhere }, ...(access.teacherId ? { teacherId: access.teacherId } : {}) }, include: { student: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } }, schoolClass: true } }, subject: true, teacher: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { date: "desc" } }),
    ]);
    return Response.json({ success: true, students, subjects, attendance });
  } catch (error) { console.error("GET ATTENDANCE ERROR:", error); return Response.json({ message: "Unable to fetch attendance." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const access = await getAccess(); if ("error" in access) return access.error;
    if (access.role === "STUDENT") return Response.json({ message: "Students cannot modify attendance." }, { status: 403 });
    const body = await request.json(); const { studentId, subjectId, date, status } = body ?? {};
    if (typeof studentId !== "string" || typeof subjectId !== "string" || typeof date !== "string" || !["present", "absent", "late"].includes(status)) return Response.json({ message: "Invalid attendance details." }, { status: 400 });
    const parsedDate = new Date(`${date}T00:00:00.000Z`); if (Number.isNaN(parsedDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ message: "Invalid date." }, { status: 400 });
    const [student, subject] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { id: true, classId: true, schoolClass: { select: { schoolId: true } } } }),
      prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true, schoolId: true, teacherId: true, classId: true } }),
    ]);
    if (!student || !subject) return Response.json({ message: "Student or subject not found." }, { status: 404 });
    if (student.schoolClass.schoolId !== access.schoolId || subject.schoolId !== access.schoolId) return Response.json({ message: "Cross-college access denied." }, { status: 403 });
    if (!subject.classId || subject.classId !== student.classId) return Response.json({ message: "This subject is not assigned to the student's class." }, { status: 403 });
    let teacherId: string | null = null;
    if (access.role === "TEACHER") {
      if (!access.teacherId || !access.classIds?.includes(student.classId) || subject.teacherId !== access.teacherId) return Response.json({ message: "You can only mark attendance for your assigned classes and subjects." }, { status: 403 });
      teacherId = access.teacherId;
    } else if (body.teacherId) {
      const teacher = await prisma.teacher.findFirst({ where: { id: body.teacherId, user: { is: { schoolId: access.schoolId } } }, select: { id: true } });
      if (!teacher) return Response.json({ message: "Teacher not found in your college." }, { status: 404 });
      teacherId = teacher.id;
    }
    const existing = await prisma.attendance.findFirst({ where: { studentId, subjectId, date: parsedDate }, select: { id: true } });
    const attendance = existing ? await prisma.attendance.update({ where: { id: existing.id }, data: { status, teacherId } }) : await prisma.attendance.create({ data: { studentId, subjectId, teacherId, date: parsedDate, status } });
    return Response.json({ success: true, message: existing ? "Attendance updated successfully." : "Attendance saved successfully.", attendance });
  } catch (error) { console.error("SAVE ATTENDANCE ERROR:", error); return Response.json({ message: "Unable to save attendance." }, { status: 500 }); }
}

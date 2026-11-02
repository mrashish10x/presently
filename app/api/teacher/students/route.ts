import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getTeacherAccess() {
  const session = await auth();
  if (!session?.user?.id || session.user.role?.toUpperCase() !== "TEACHER" || !session.user.schoolId) return null;
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true, assignedClassId: true, user: { select: { schoolId: true } }, classTeacherFor: { select: { id: true } } } });
  if (!teacher || teacher.user.schoolId !== session.user.schoolId) return null;
  const classIds = [...new Set([teacher.assignedClassId, ...teacher.classTeacherFor.map((c) => c.id)].filter((id): id is string => Boolean(id)))];
  return { teacher, schoolId: session.user.schoolId, classIds };
}

export async function GET() {
  try {
    const access = await getTeacherAccess();
    if (!access) return Response.json({ message: "Unauthorized" }, { status: 403 });
    const [students, classes, subjects] = await Promise.all([
      prisma.student.findMany({ where: { classId: { in: access.classIds }, schoolClass: { is: { schoolId: access.schoolId } } }, select: { id: true, rollNo: true, guardianName: true, user: { select: { name: true, email: true, avatarColor: true } }, schoolClass: { select: { id: true, name: true, section: true } } }, orderBy: { rollNo: "asc" } }),
      prisma.schoolClass.findMany({ where: { id: { in: access.classIds }, schoolId: access.schoolId }, select: { id: true, name: true, section: true }, orderBy: [{ name: "asc" }, { section: "asc" }] }),
      prisma.subject.findMany({ where: { schoolId: access.schoolId, teacherId: access.teacher.id, classId: { in: access.classIds } }, select: { id: true } }),
    ]);
    const studentIds = students.map((s) => s.id), subjectIds = subjects.map((s) => s.id);
    const records = studentIds.length && subjectIds.length ? await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        subjectId: { in: subjectIds },
        student: { is: { classId: { in: access.classIds }, schoolClass: { is: { schoolId: access.schoolId } } } },
        subject: { is: { schoolId: access.schoolId, teacherId: access.teacher.id, classId: { in: access.classIds } } },
      },
      select: { studentId: true, status: true },
    }) : [];
    const stats = new Map<string, { total: number; attended: number }>();
    for (const record of records) { const stat = stats.get(record.studentId) ?? { total: 0, attended: 0 }; stat.total++; if (record.status === "present" || record.status === "late") stat.attended++; stats.set(record.studentId, stat); }
    return Response.json({ success: true, classes, students: students.map((student) => { const stat = stats.get(student.id) ?? { total: 0, attended: 0 }; return { ...student, attendancePct: stat.total ? Math.round(stat.attended / stat.total * 100) : 0 }; }) });
  } catch (error) { console.error("TEACHER STUDENTS GET:", error); return Response.json({ message: "Unable to fetch assigned students" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const access = await getTeacherAccess();
    if (!access) return Response.json({ message: "Unauthorized" }, { status: 403 });
    const body = await request.json();
    const name = String(body.name || "").trim(), email = String(body.email || "").trim().toLowerCase(), password = String(body.password || ""), rollNo = String(body.rollNo || "").trim(), classId = String(body.classId || "").trim(), guardianName = String(body.guardianName || "").trim(), phone = String(body.phone || "").trim();
    if (!name || !email || !password || !rollNo || !classId) return Response.json({ message: "Please fill all required fields" }, { status: 400 });
    if (password.length < 8) return Response.json({ message: "Password must contain at least 8 characters" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ message: "Enter a valid email address" }, { status: 400 });
    if (!access.classIds.includes(classId)) return Response.json({ message: "You can only add students to your assigned classes" }, { status: 403 });
    const schoolClass = await prisma.schoolClass.findFirst({ where: { id: classId, schoolId: access.schoolId }, select: { id: true } });
    if (!schoolClass) return Response.json({ message: "Class not found in your college" }, { status: 403 });
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return Response.json({ message: "This email is already registered" }, { status: 409 });
    if (await prisma.student.findFirst({ where: { classId, rollNo }, select: { id: true } })) return Response.json({ message: "This roll number already exists in this class" }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const student = await prisma.$transaction(async (tx) => { const user = await tx.user.create({ data: { name, email, passwordHash, role: "STUDENT", schoolId: access.schoolId, phone: phone || null } }); return tx.student.create({ data: { userId: user.id, rollNo, classId, guardianName: guardianName || null }, select: { id: true, rollNo: true, user: { select: { name: true, email: true } } } }); });
    return Response.json({ success: true, message: "Student added successfully", student }, { status: 201 });
  } catch (error) { console.error("TEACHER CREATE STUDENT:", error); return Response.json({ message: "Unable to add student" }, { status: 500 }); }
}

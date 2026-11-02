import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId || !session.user.role) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role.toUpperCase();
    if (!["ADMIN", "TEACHER", "STUDENT"].includes(role)) {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let teacherId: string | undefined;
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, user: { schoolId: session.user.schoolId } },
        select: { id: true },
      });
      if (!teacher) return Response.json({ success: false, message: "Teacher profile not found" }, { status: 403 });
      teacherId = teacher.id;
    }

    let classId: string | undefined;
    if (role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id, schoolClass: { schoolId: session.user.schoolId } },
        select: { classId: true },
      });
      if (!student) return Response.json({ success: false, message: "Student profile not found" }, { status: 403 });
      classId = student.classId;
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId: session.user.schoolId, ...(teacherId ? { teacherId } : {}), ...(classId ? { classId } : {}) },
      include: {
        teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
        schoolClass: true,
      },
      orderBy: { name: "asc" },
    });
    return Response.json({ success: true, subjects });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);
    return Response.json({ success: false, message: "Unable to fetch subjects" }, { status: 500 });
  }
}

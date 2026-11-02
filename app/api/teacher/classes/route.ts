import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
async function getTeacherAccess() {
  const session = await auth();
  if (!session?.user?.id || session.user.role?.toUpperCase() !== "TEACHER" || !session.user.schoolId) return null;
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { assignedClassId: true, user: { select: { schoolId: true } }, classTeacherFor: { select: { id: true } } } });
  if (!teacher || teacher.user.schoolId !== session.user.schoolId) return null;
  const classIds = [...new Set([teacher.assignedClassId, ...teacher.classTeacherFor.map((c) => c.id)].filter((id): id is string => Boolean(id)))];
  return { schoolId: session.user.schoolId, classIds };
}
export async function GET() {
  try {
    const access = await getTeacherAccess();
    if (!access) return Response.json({ message: "Unauthorized" }, { status: 403 });
    const classes = await prisma.schoolClass.findMany({ where: { id: { in: access.classIds }, schoolId: access.schoolId }, select: { id: true, name: true, section: true, _count: { select: { students: true } } }, orderBy: [{ name: "asc" }, { section: "asc" }] });
    return Response.json({ success: true, classes });
  } catch (error) { console.error("TEACHER CLASSES GET:", error); return Response.json({ message: "Unable to fetch assigned classes" }, { status: 500 }); }
}
export async function POST() {
  const access = await getTeacherAccess();
  if (!access) return Response.json({ message: "Unauthorized" }, { status: 403 });
  return Response.json({ message: "Only college admins can create classes" }, { status: 403 });
}

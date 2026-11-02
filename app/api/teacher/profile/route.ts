import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
async function getAccess() {
  const session = await auth();
  if (!session?.user?.id || session.user.role?.toUpperCase() !== "TEACHER" || !session.user.schoolId) return null;
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true, assignedClass: { select: { name: true, section: true } }, user: { select: { id: true, name: true, email: true, phone: true, schoolId: true } }, subjects: { where: { schoolId: session.user.schoolId }, select: { id: true, name: true, code: true } } } });
  if (!teacher || teacher.user.schoolId !== session.user.schoolId) return null;
  return teacher;
}
export async function GET() {
  try { const teacher = await getAccess(); if (!teacher) return Response.json({ message: "Unauthorized" }, { status: 403 }); return Response.json({ success: true, profile: { name: teacher.user.name, email: teacher.user.email, phone: teacher.user.phone ?? "", assignedClass: teacher.assignedClass ? `${teacher.assignedClass.name} · ${teacher.assignedClass.section}` : "Not assigned", subjects: teacher.subjects } }); }
  catch (error) { console.error("TEACHER PROFILE GET:", error); return Response.json({ message: "Unable to load profile" }, { status: 500 }); }
}
export async function PATCH(request: Request) {
  try {
    const teacher = await getAccess(); if (!teacher) return Response.json({ message: "Unauthorized" }, { status: 403 });
    const body = await request.json(); const name = typeof body.name === "string" ? body.name.trim() : ""; const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!name) return Response.json({ message: "Name is required" }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: teacher.user.id }, data: { name, phone: phone || null }, select: { name: true, email: true, phone: true } });
    return Response.json({ success: true, profile: updated, message: "Profile updated" });
  } catch (error) { console.error("TEACHER PROFILE PATCH:", error); return Response.json({ message: "Unable to update profile" }, { status: 500 }); }
}

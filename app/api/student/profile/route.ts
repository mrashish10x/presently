import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getStudent() {
  const session = await auth();
  if (!session?.user?.id || session.user.role?.toUpperCase() !== "STUDENT" || !session.user.schoolId) {
    return { response: Response.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  const student = await prisma.student.findFirst({
    where: { userId: session.user.id, user: { schoolId: session.user.schoolId, status: "active" }, schoolClass: { schoolId: session.user.schoolId } },
    select: { id: true, rollNo: true, guardianName: true, joinedOn: true, schoolClass: { select: { name: true, section: true } }, user: { select: { id: true, name: true, email: true, phone: true, avatarColor: true } } },
  });
  if (!student) return { response: Response.json({ success: false, message: "Student profile not found" }, { status: 404 }) };
  return { student };
}

export async function GET() {
  try {
    const result = await getStudent();
    if ("response" in result) return result.response;
    return Response.json({ success: true, student: result.student });
  } catch (error) {
    console.error("GET STUDENT PROFILE ERROR:", error);
    return Response.json({ success: false, message: "Unable to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getStudent();
    if ("response" in result) return result.response;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const guardianName = typeof body.guardianName === "string" ? body.guardianName.trim() : undefined;
    if (name !== undefined && (name.length < 2 || name.length > 80)) return Response.json({ success: false, message: "Name must be between 2 and 80 characters" }, { status: 400 });
    if (phone !== undefined && phone.length > 20) return Response.json({ success: false, message: "Phone number is too long" }, { status: 400 });
    if (guardianName !== undefined && guardianName.length > 80) return Response.json({ success: false, message: "Guardian name is too long" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: result.student.user.id }, data: { ...(name !== undefined ? { name } : {}), ...(phone !== undefined ? { phone: phone || null } : {}) } });
      await tx.student.update({ where: { id: result.student.id }, data: guardianName !== undefined ? { guardianName: guardianName || null } : {} });
      return tx.student.findUniqueOrThrow({ where: { id: result.student.id }, select: { id: true, rollNo: true, guardianName: true, joinedOn: true, schoolClass: { select: { name: true, section: true } }, user: { select: { id: true, name: true, email: true, phone: true, avatarColor: true } } } });
    });
    return Response.json({ success: true, message: "Profile updated", student: updated });
  } catch (error) {
    console.error("UPDATE STUDENT PROFILE ERROR:", error);
    return Response.json({ success: false, message: "Unable to update profile" }, { status: 500 });
  }
}

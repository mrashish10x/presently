import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getStudentUserId() {
  const session = await auth();
  if (!session?.user?.id || session.user.role?.toUpperCase() !== "STUDENT" || !session.user.schoolId) return null;
  const student = await prisma.student.findFirst({
    where: { userId: session.user.id, user: { schoolId: session.user.schoolId, status: "active" }, schoolClass: { schoolId: session.user.schoolId } },
    select: { userId: true },
  });
  return student?.userId ?? null;
}

export async function GET() {
  try {
    const userId = await getStudentUserId();
    if (!userId) return Response.json({ success: false, message: "Unauthorized or student profile not found" }, { status: 403 });
    const notifications = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    return Response.json({ success: true, notifications });
  } catch (error) {
    console.error("GET STUDENT NOTIFICATIONS ERROR:", error);
    return Response.json({ success: false, message: "Unable to load notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getStudentUserId();
    if (!userId) return Response.json({ success: false, message: "Unauthorized or student profile not found" }, { status: 403 });
    const body = await request.json();
    if (typeof body.id !== "string" || !body.id) return Response.json({ success: false, message: "Notification id is required" }, { status: 400 });
    const result = await prisma.notification.updateMany({ where: { id: body.id, userId }, data: { read: true } });
    if (result.count === 0) return Response.json({ success: false, message: "Notification not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("UPDATE STUDENT NOTIFICATION ERROR:", error);
    return Response.json({ success: false, message: "Unable to update notification" }, { status: 500 });
  }
}

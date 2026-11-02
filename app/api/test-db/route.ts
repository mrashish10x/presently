import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role?.toUpperCase() !== "ADMIN" || !session.user.schoolId) {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    await prisma.school.findFirst({ where: { id: session.user.schoolId }, select: { id: true } });
    return Response.json({ success: true, message: "Database connection successful" });
  } catch (error) {
    console.error("DATABASE HEALTH CHECK ERROR:", error);
    return Response.json({ success: false, message: "Database unavailable" }, { status: 503 });
  }
}

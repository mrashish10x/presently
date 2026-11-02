import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, title: true, description: true, type: true, read: true, createdAt: true },
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS GET ERROR", error);
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : null;
    if (id) {
      const result = await prisma.notification.updateMany({ where: { id, userId: session.user.id }, data: { read: true } });
      if (!result.count) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    } else {
      await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS PATCH ERROR", error);
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}

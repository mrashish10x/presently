import { DashboardShell } from "@/components/layout/DashboardShell";
import { STUDENT_NAV } from "@/lib/nav";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["STUDENT"]);
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, role: "STUDENT", schoolId: session.user.schoolId ?? undefined },
    select: { name: true, avatarColor: true },
  });

  return (
    <DashboardShell
      navItems={STUDENT_NAV}
      roleLabel="Student Panel"
      pageTitle="Student Panel"
      user={{ name: user?.name ?? session.user.name ?? "Student", role: "Student", avatarColor: user?.avatarColor ?? "#0f766e" }}
      profileHref="/student/profile"
    >
      {children}
    </DashboardShell>
  );
}

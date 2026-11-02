import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TEACHER_NAV } from "@/lib/nav";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["TEACHER"]);

  return (
    <DashboardShell
      navItems={TEACHER_NAV}
      roleLabel="Teacher Panel"
      pageTitle="Teacher Panel"
      user={{
        name: session.user.name || session.user.email || "Teacher",
        role: "Teacher",
        avatarColor: "#0d9488",
      }}
      profileHref="/teacher/profile"
    >
      {children}
    </DashboardShell>
  );
}

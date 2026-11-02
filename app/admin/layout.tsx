import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_NAV } from "@/lib/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ADMIN"]);

  return (
    <DashboardShell
      navItems={ADMIN_NAV}
      roleLabel="Admin Panel"
      pageTitle="Admin Panel"
      user={{
        name: session.user.name || session.user.email || "Admin",
        role: "Admin",
        avatarColor: "#4f46e5",
      }}
      profileHref="/admin/settings"
    >
      {children}
    </DashboardShell>
  );
}

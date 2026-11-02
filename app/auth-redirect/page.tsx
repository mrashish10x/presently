import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const routes: Record<string, string> = {
    ADMIN: "/admin/dashboard",
    TEACHER: "/teacher",
    STUDENT: "/student",
  };

  redirect(routes[session.user.role.toUpperCase()] || "/login");
}

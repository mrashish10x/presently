"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, CalendarCheck2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type LoginRole = "ADMIN" | "TEACHER" | "STUDENT";

const ROLE_CONFIG: Record<LoginRole, { label: string; destination: string; description: string }> = {
  ADMIN: { label: "Admin", destination: "/admin/dashboard", description: "Manage your college, teachers, classes and attendance." },
  TEACHER: { label: "Teacher", destination: "/teacher", description: "Manage your assigned classes and mark attendance." },
  STUDENT: { label: "Student", destination: "/student", description: "View your own attendance, subjects and profile." },
};

export default function RoleLoginForm({ role }: { role: LoginRole }) {
  const router = useRouter();
  const { showToast } = useToast();
  const config = ROLE_CONFIG[role];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        role,
        redirect: false,
      });
      if (!result || result.error) {
        showToast(`Login failed. Check your ${config.label.toLowerCase()} credentials.`, "error");
        return;
      }
      showToast(`Welcome back, ${config.label}.`, "success");
      router.replace(config.destination);
      router.refresh();
    } catch (error) {
      console.error(`${role} login failed`, error);
      showToast("Could not complete login. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: "/auth-redirect" });
    } catch (error) {
      console.error("Google login failed", error);
      showToast("Could not start Google login.", "error");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-sand-50">
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-ink-soft/60 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-800"><CalendarCheck2 className="h-5 w-5 text-white" /></span>
            <span className="font-display text-lg font-semibold text-ink">Presently</span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">{config.label} portal</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Sign in as {config.label}</h1>
          <p className="mt-2 text-sm text-ink-soft/60">{config.description}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor={`${role}-email`} className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
                <input id={`${role}-email`} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30" />
              </div>
            </div>
            <div>
              <label htmlFor={`${role}-password`} className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
                <input id={`${role}-password`} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-10 text-sm text-ink focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft/50">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={googleLoading}>Sign in as {config.label}</Button>
          </form>

          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div><div className="relative flex justify-center text-xs"><span className="bg-sand-50 px-3 text-ink-soft/50">OR CONTINUE WITH</span></div></div>
          <button type="button" onClick={googleLogin} disabled={loading || googleLoading} className="flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-sand-100 disabled:opacity-60">
            {googleLoading ? "Connecting to Google..." : <><span aria-hidden="true" className="text-base font-bold">G</span> Continue with Google</>}
          </button>

          {role === "ADMIN" ? (
            <p className="mt-6 text-center text-sm text-ink-soft/70">New college? <Link href="/register" className="font-semibold text-teal-800 hover:underline">Create Admin Account</Link></p>
          ) : null}
          <p className="mt-5 text-center text-xs text-ink-soft/50">Use the account created by your college administrator.</p>
          <div className="mt-7 flex justify-center gap-4 text-xs text-ink-soft/55">
            {role !== "ADMIN" && <Link href="/login/admin" className="hover:text-teal-800">Admin login</Link>}
            {role !== "TEACHER" && <Link href="/login/teacher" className="hover:text-teal-800">Teacher login</Link>}
            {role !== "STUDENT" && <Link href="/login/student" className="hover:text-teal-800">Student login</Link>}
          </div>
        </div>
      </section>
      <aside className="relative hidden w-[54%] overflow-hidden bg-teal-950 lg:block">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex h-full flex-col items-center justify-center px-16 text-center">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">Presently · Secure workspace</span>
          <h2 className="mt-5 max-w-md font-display text-3xl font-semibold text-white">Attendance, organized for your institution.</h2>
          <p className="mt-4 max-w-sm leading-relaxed text-white/50">Separate access for administrators, teachers and students—with college-scoped records.</p>
        </div>
      </aside>
    </main>
  );
}

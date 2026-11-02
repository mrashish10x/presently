"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle, Users, GraduationCap, BookOpen, ClipboardCheck, School } from "lucide-react";

interface DashboardData {
  admin: { id: string; name: string; email: string; role: string };
  school: { id: string; name: string };
  statistics: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    attendance: number;
  };
}

const cards = [
  { key: "students", title: "Total Students", icon: GraduationCap },
  { key: "teachers", title: "Total Teachers", icon: Users },
  { key: "classes", title: "Total Classes", icon: School },
  { key: "subjects", title: "Total Subjects", icon: BookOpen },
  { key: "attendance", title: "Attendance Records", icon: ClipboardCheck },
] as const;

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Dashboard load nahi ho paya.");

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-3">
      <RefreshCw className="animate-spin" /> Loading dashboard...
    </div>;
  }

  if (error || !data) {
    return <div className="rounded-xl border bg-white p-8 text-center">
      <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />
      <h2 className="text-xl font-bold">Dashboard Error</h2>
      <p className="mt-2 text-sm text-slate-500">{error || "Dashboard data unavailable."}</p>
      <button onClick={loadDashboard} className="mt-5 rounded-lg bg-teal-700 px-5 py-2 text-white">
        Try Again
      </button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h1 className="text-2xl font-bold">{data.admin.name}</h1>
          <p className="text-sm text-slate-500">{data.school.name}</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold">Dashboard Overview</h2>
        <p className="text-sm text-slate-500">Your school&apos;s live statistics.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <h3 className="mt-3 text-4xl font-bold">{data.statistics[card.key]}</h3>
                </div>
                <Icon size={28} className="text-teal-700" />
              </div>
              <p className="mt-4 text-xs text-slate-400">Live database statistics</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="font-bold">School Information</h2>
        <div className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
          <div><p className="text-xs text-slate-400">SCHOOL NAME</p><p className="mt-1 font-medium">{data.school.name}</p></div>
          <div><p className="text-xs text-slate-400">ADMINISTRATOR</p><p className="mt-1 font-medium">{data.admin.name}</p></div>
          <div><p className="text-xs text-slate-400">ADMIN EMAIL</p><p className="mt-1 break-all font-medium">{data.admin.email}</p></div>
          <div><p className="text-xs text-slate-400">ACCOUNT ROLE</p><p className="mt-1 font-medium">{data.admin.role}</p></div>
        </div>
      </div>
    </div>
  );
}

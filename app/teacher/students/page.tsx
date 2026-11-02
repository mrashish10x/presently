"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, GraduationCap, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { pctBadgeClasses } from "@/lib/utils";

type Student = { id: string; rollNo: string; attendancePct: number; user: { name: string | null; email: string; avatarColor: string | null }; schoolClass: { name: string; section: string } };
export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/teacher/students", { cache: "no-store" }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.message || "Unable to load students"); setStudents(data.students || []); }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load students")).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => students.filter((s) => `${s.user.name ?? ""} ${s.user.email} ${s.rollNo}`.toLowerCase().includes(search.toLowerCase())), [students, search]);
  const columns: Column<Student>[] = [
    { header: "Student", accessor: (s) => <div className="flex min-w-[180px] items-center gap-3"><Avatar name={s.user.name || s.user.email} color={s.user.avatarColor || undefined} size="sm" /><div><p className="font-medium text-ink">{s.user.name || "Student"}</p><p className="text-xs text-ink-soft/50">{s.user.email}</p></div></div> },
    { header: "Roll No.", accessor: (s) => s.rollNo },
    { header: "Class", accessor: (s) => `${s.schoolClass.name} · ${s.schoolClass.section}` },
    { header: "Attendance", accessor: (s) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(s.attendancePct)}`}>{s.attendancePct}%</span> },
  ];
  if (loading) return <div className="flex min-h-60 items-center justify-center gap-3"><RefreshCw className="animate-spin" /> Loading assigned students...</div>;
  if (error) return <div className="rounded-xl border bg-white p-6 text-sm text-red-600">{error}</div>;
  return <div><PageHeader title="Students" description={`${students.length} students in your assigned classes`} /><div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm"><Search className="h-4 w-4 text-ink-soft/50" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="w-full bg-transparent text-ink outline-none" /></div><DataTable columns={columns} rows={filtered} keyField={(s) => s.id} emptyState={<EmptyState icon={GraduationCap} title="No students found" description="No students are assigned to your classes, or try another search." />} /></div>;
}

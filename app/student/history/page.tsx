"use client";

import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttendanceStatusBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/FormField";
import { formatDate } from "@/lib/utils";

type RecordItem = { id: string; date: string; status: "present" | "absent" | "late"; subject: { id: string; name: string; code: string } };
type Subject = { id: string; name: string };

export default function StudentHistoryPage() {
  const [subjectId, setSubjectId] = useState("all");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/attendance"), fetch("/api/subjects")]).then(async ([a, s]) => {
      const ad = await a.json(); const sd = await s.json();
      if (!a.ok) throw new Error(ad.message || "Unable to load attendance history");
      if (!s.ok) throw new Error(sd.message || "Unable to load subjects");
      setRecords(Array.isArray(ad.attendance) ? ad.attendance : []);
      setSubjects(Array.isArray(sd.subjects) ? sd.subjects : []);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load history")).finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => records.filter((r) => subjectId === "all" || r.subject.id === subjectId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [records, subjectId]);
  const columns: Column<RecordItem>[] = [
    { header: "Date", accessor: (r) => formatDate(r.date) },
    { header: "Subject", accessor: (r) => r.subject.name },
    { header: "Status", accessor: (r) => <AttendanceStatusBadge status={r.status} /> },
  ];
  return <div><PageHeader title="Attendance History" description="Your day-by-day attendance record." />
    <div className="mb-4 max-w-xs"><SelectField label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} options={[{ label: "All subjects", value: "all" }, ...subjects.map((s) => ({ label: s.name, value: s.id }))]} /></div>
    {loading ? <p className="rounded-xl border border-line bg-white p-5 text-sm">Loading attendance…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : <DataTable columns={columns} rows={filtered} keyField={(r) => r.id} emptyState={<EmptyState icon={History} title="No records yet" description="Your attendance history will appear here." />} />}
  </div>;
}

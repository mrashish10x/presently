"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { pctBadgeClasses } from "@/lib/utils";

type AttendanceRecord = { id: string; status: string; subject: { id: string; name: string } };
interface Row { subject: string; total: number; present: number; absent: number; pct: number }

export default function MyAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/attendance").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load attendance");
      setRecords(Array.isArray(data.attendance) ? data.attendance : []);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load attendance")).finally(() => setLoading(false));
  }, []);
  const rows = useMemo(() => {
    const grouped = new Map<string, Row>();
    records.forEach((record) => {
      const key = record.subject.id;
      if (!grouped.has(key)) grouped.set(key, { subject: record.subject.name, total: 0, present: 0, absent: 0, pct: 0 });
      const row = grouped.get(key)!; row.total += 1;
      if (["present", "late"].includes(record.status.toLowerCase())) row.present += 1;
      if (record.status.toLowerCase() === "absent") row.absent += 1;
    });
    return Array.from(grouped.values()).map((row) => ({ ...row, pct: row.total ? Math.round(row.present / row.total * 100) : 0 }));
  }, [records]);
  const columns: Column<Row>[] = [
    { header: "Subject", accessor: (r) => <span className="font-medium text-ink">{r.subject}</span> },
    { header: "Total Classes", accessor: (r) => r.total },
    { header: "Present", accessor: (r) => <span className="font-medium text-teal-700">{r.present}</span> },
    { header: "Absent", accessor: (r) => <span className="font-medium text-clay-600">{r.absent}</span> },
    { header: "Percentage", accessor: (r) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(r.pct)}`}>{r.pct}%</span> },
  ];
  return <div><PageHeader title="My Attendance" description="Your attendance broken down by subject." />
    {loading ? <p className="rounded-xl border border-line bg-white p-5 text-sm">Loading attendance…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : <DataTable columns={columns} rows={rows} keyField={(r) => r.subject} emptyState={<EmptyState icon={ClipboardCheck} title="No attendance yet" description="Your attendance records will show up here." />} />}
  </div>;
}

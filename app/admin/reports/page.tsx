"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

type ReportRecord = {
  id: string; date: string; status: string;
  student: { id: string; rollNo: string; user: { name: string }; schoolClass: { name: string; section: string } };
  subject: { id: string; name: string; code: string };
};
type ReportTab = "daily" | "weekly" | "monthly" | "student" | "class" | "subject";
const tabs: { id: ReportTab; label: string }[] = [
  { id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" },
  { id: "student", label: "Student-wise" }, { id: "class", label: "Class-wise" }, { id: "subject", label: "Subject-wise" },
];
const present = (s: string) => ["present", "late"].includes(s.toLowerCase());

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("weekly");
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [start, setStart] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reports load nahi ho paye.");
      setRecords(json.records || []);
      if (json.truncated) setError("Showing the latest 10,000 matching records. Narrow the date range for a complete export.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load reports."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []); // initial range

  const summary = useMemo(() => {
    const total = records.length, presentCount = records.filter(r => present(r.status)).length;
    return { total, presentCount, absent: total - presentCount, rate: total ? Math.round(presentCount / total * 100) : 0 };
  }, [records]);

  const rows = useMemo(() => {
    const map = new Map<string, { label: string; total: number; present: number; secondary?: string }>();
    for (const r of records) {
      const date = new Date(r.date);
      const dayKey = date.toISOString().slice(0, 10);
      const weekDate = new Date(date);
      weekDate.setUTCDate(weekDate.getUTCDate() - ((weekDate.getUTCDay() + 6) % 7));
      const weekKey = weekDate.toISOString().slice(0, 10);
      const monthKey = date.toISOString().slice(0, 7);
      const periodKey = tab === "weekly" ? weekKey : tab === "monthly" ? monthKey : dayKey;
      const periodLabel = tab === "weekly" ? `Week of ${new Date(`${weekKey}T00:00:00Z`).toLocaleDateString()}` : tab === "monthly" ? date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" }) : date.toLocaleDateString();
      const key = tab === "student" ? r.student.id : tab === "class" ? `${r.student.schoolClass.name}-${r.student.schoolClass.section}` : tab === "subject" ? r.subject.id : periodKey;
      const label = tab === "student" ? r.student.user.name : tab === "class" ? `${r.student.schoolClass.name} ${r.student.schoolClass.section}` : tab === "subject" ? r.subject.name : periodLabel;
      const item = map.get(key) || { label, total: 0, present: 0, secondary: tab === "student" ? `Roll: ${r.student.rollNo}` : tab === "subject" ? r.subject.code : undefined };
      item.total++; if (present(r.status)) item.present++; map.set(key, item);
    }
    return [...map.values()].map(x => ({ ...x, rate: x.total ? Math.round(x.present / x.total * 100) : 0 })).sort((a,b) => b.total - a.total);
  }, [records, tab]);

  function exportCsv() {
    const header = ["Date", "Student", "Roll No", "Class", "Subject", "Status"];
    const lines = records.map(r => [new Date(r.date).toISOString().slice(0,10), r.student.user.name, r.student.rollNo, `${r.student.schoolClass.name} ${r.student.schoolClass.section}`, r.subject.name, r.status]);
    const csv = [header, ...lines].map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `presently-attendance-${start}-to-${end}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="space-y-6">
    <PageHeader title="Reports" description="College-wise attendance reports from live records." actions={<button onClick={exportCsv} disabled={!records.length} className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Download size={16}/> Export CSV</button>} />
    <section className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
      <label className="text-sm">From<input className="mt-1 block rounded-lg border border-line px-3 py-2" type="date" value={start} max={end} onChange={e=>setStart(e.target.value)}/></label>
      <label className="text-sm">To<input className="mt-1 block rounded-lg border border-line px-3 py-2" type="date" value={end} min={start} onChange={e=>setEnd(e.target.value)}/></label>
      <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm"><RefreshCw size={15}/> Apply filters</button>
    </section>
    {error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[['Attendance records',summary.total],['Present / Late',summary.presentCount],['Absent',summary.absent],['Attendance rate',`${summary.rate}%`]].map(([label,value])=><div key={label} className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-ink-soft/60">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-2">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-lg px-4 py-2 text-sm ${tab===t.id?"bg-teal-800 text-white":"border border-line bg-white"}`}>{t.label}</button>)}</div>
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {loading ? <p className="p-8 text-center text-sm text-ink-soft/60">Loading live report…</p> : !rows.length ? <p className="p-8 text-center text-sm text-ink-soft/60">No attendance records found for this date range.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-sand-50 text-ink-soft/70"><tr><th className="p-4">{tab === "daily" || tab === "weekly" || tab === "monthly" ? "Date" : tab === "student" ? "Student" : tab === "class" ? "Class" : "Subject"}</th><th className="p-4">Details</th><th className="p-4">Sessions</th><th className="p-4">Present / Late</th><th className="p-4">Attendance</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.label}-${i}`} className="border-t border-line"><td className="p-4 font-medium">{r.label}</td><td className="p-4 text-ink-soft/60">{r.secondary || "—"}</td><td className="p-4">{r.total}</td><td className="p-4">{r.present}</td><td className="p-4">{r.rate}%</td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}

"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { pctBadgeClasses } from "@/lib/utils";

type Subject = { id: string; name: string; code: string; teacher?: { user?: { name?: string | null } } | null };
type RecordItem = { subjectId: string; status: string };

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/subjects"), fetch("/api/attendance")]).then(async ([s, a]) => {
      const sd = await s.json(); const ad = await a.json();
      if (!s.ok) throw new Error(sd.message || "Unable to load subjects");
      if (!a.ok) throw new Error(ad.message || "Unable to load attendance");
      setSubjects(Array.isArray(sd.subjects) ? sd.subjects : []);
      setRecords(Array.isArray(ad.attendance) ? ad.attendance : []);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load subjects")).finally(() => setLoading(false));
  }, []);
  return <div><PageHeader title="Subjects" description="Subjects assigned to your class this term." />
    {loading ? <p className="rounded-xl border border-line bg-white p-5 text-sm">Loading subjects…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : subjects.length === 0 ? <p className="rounded-xl border border-line bg-white p-5 text-sm text-ink-soft">No subjects have been assigned to your class yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => {
      const subjectRecords = records.filter((r) => r.subjectId === subject.id);
      const attended = subjectRecords.filter((r) => ["present", "late"].includes(r.status.toLowerCase())).length;
      const pct = subjectRecords.length ? Math.round(attended / subjectRecords.length * 100) : 0;
      return <article key={subject.id} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><BookMarked className="h-5 w-5" /></div>{subjectRecords.length > 0 && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(pct)}`}>{pct}%</span>}</div><h3 className="mt-4 font-display font-semibold text-ink">{subject.name}</h3><p className="text-sm text-ink-soft/55">{subject.code}</p><p className="mt-1 text-sm text-ink-soft/55">Taught by {subject.teacher?.user?.name || "Not assigned"}</p><p className="mt-3 text-xs text-ink-soft/50">{subjectRecords.length} attendance records</p></article>;
    })}</div>}
  </div>;
}

"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectField } from "@/components/ui/FormField";
import { pctBadgeClasses, formatDate } from "@/lib/utils";

type AttendanceRecord = {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
  student: {
    rollNo: string;
    user: { name: string | null };
    schoolClass: { name: string; section: string };
  };
  subject: { name: string };
};

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [section, setSection] = useState("all");
  const [subject, setSubject] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const response = await fetch("/api/attendance", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load attendance history.");
        }

        setRecords(result.attendance || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const sections = Array.from(
    new Set(records.map((record) => record.student.schoolClass.section))
  );

  const subjects = Array.from(
    new Set(records.map((record) => record.subject.name))
  );

  const filteredRecords = records.filter((record) => {
    const sectionMatches =
      section === "all" ||
      record.student.schoolClass.section === section;

    const subjectMatches =
      subject === "all" ||
      record.subject.name === subject;

    return sectionMatches && subjectMatches;
  });

  const grouped = new Map<string, {
    id: string;
    date: string;
    className: string;
    section: string;
    subject: string;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }>();

  for (const record of filteredRecords) {
    const date = new Date(record.date).toISOString().slice(0, 10);
    const key = `${date}-${record.student.schoolClass.name}-${record.student.schoolClass.section}-${record.subject.name}`;

    const item = grouped.get(key) || {
      id: key,
      date,
      className: record.student.schoolClass.name,
      section: record.student.schoolClass.section,
      subject: record.subject.name,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    if (record.status === "present") item.present++;
    if (record.status === "absent") item.absent++;
    if (record.status === "late") item.late++;

    const total = item.present + item.absent + item.late;
    item.percentage = total
      ? Math.round(((item.present + item.late) / total) * 100)
      : 0;

    grouped.set(key, item);
  }

  const sessions = Array.from(grouped.values()).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const columns: Column<(typeof sessions)[number]>[] = [
    { header: "Date", accessor: (record) => formatDate(record.date) },
    {
      header: "Class",
      accessor: (record) => `${record.className} · Sec ${record.section}`,
    },
    { header: "Subject", accessor: (record) => record.subject },
    {
      header: "Present",
      accessor: (record) => (
        <span className="font-medium text-teal-700">{record.present}</span>
      ),
    },
    {
      header: "Absent",
      accessor: (record) => (
        <span className="font-medium text-clay-600">{record.absent}</span>
      ),
    },
    {
      header: "Late",
      accessor: (record) => (
        <span className="font-medium text-gold-600">{record.late}</span>
      ),
    },
    {
      header: "Percentage",
      accessor: (record) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(record.percentage)}`}>
          {record.percentage}%
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-3">
        <RefreshCw className="animate-spin" /> Loading real attendance history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Attendance History"
        description="Actual attendance sessions saved in your school's database."
      />

      <div className="mb-4 grid max-w-md gap-3 sm:grid-cols-2">
        <SelectField
          label="Section"
          value={section}
          onChange={(event) => setSection(event.target.value)}
          options={[
            { label: "All sections", value: "all" },
            ...sections.map((value) => ({
              label: `Section ${value}`,
              value,
            })),
          ]}
        />

        <SelectField
          label="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          options={[
            { label: "All subjects", value: "all" },
            ...subjects.map((value) => ({
              label: value,
              value,
            })),
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={sessions}
        keyField={(record) => record.id}
        emptyState={
          <EmptyState
            icon={History}
            title="No attendance history"
            description="Real attendance records will appear here after you save attendance."
          />
        }
      />
    </div>
  );
}

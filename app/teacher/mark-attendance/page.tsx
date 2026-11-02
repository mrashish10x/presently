"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Save, Check, X, Clock3, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types";

type StudentItem = {
  id: string;
  rollNo: string;
  user: { name: string | null; avatarColor: string | null };
  schoolClass: { name: string; section: string };
};

type SubjectItem = {
  id: string;
  name: string;
  code: string;
};

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: typeof Check;
}[] = [
  { value: "present", label: "Present", icon: Check },
  { value: "absent", label: "Absent", icon: X },
  { value: "late", label: "Late", icon: Clock3 },
];

export default function MarkAttendancePage() {
  const { showToast } = useToast();

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/attendance", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Unable to load attendance data.");

      setStudents(result.students || []);
      setSubjects(result.subjects || []);

      if (result.subjects?.length) {
        setSubjectId(result.subjects[0].id);
      }

      setStatuses(
        Object.fromEntries(
          (result.students || []).map((student: StudentItem) => [
            student.id,
            "present",
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((previous) => ({ ...previous, [studentId]: status }));
  }

  function reset() {
    setStatuses(
      Object.fromEntries(students.map((student) => [student.id, "present"]))
    );
    showToast("Attendance sheet reset.", "info");
  }

  async function saveAttendance() {
    if (!subjectId || students.length === 0) {
      showToast("Students or subjects are not assigned.", "error");
      return;
    }

    try {
      setSaving(true);

      for (const student of students) {
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            subjectId,
            date,
            status: statuses[student.id] || "present",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `Unable to save attendance for ${student.user.name || student.rollNo}.`);
        }
      }

      showToast("Attendance saved successfully.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to save attendance.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(statuses).filter((status) => status === "present").length;
  const absentCount = Object.values(statuses).filter((status) => status === "absent").length;
  const lateCount = Object.values(statuses).filter((status) => status === "late").length;

  if (loading) {
    return <div className="flex min-h-60 items-center justify-center gap-3">
      <RefreshCw className="animate-spin" /> Loading real students...
    </div>;
  }

  if (error) {
    return <div className="rounded-xl border bg-white p-6">
      <p className="text-sm text-red-600">{error}</p>
      <Button className="mt-4" onClick={loadData}>Retry</Button>
    </div>;
  }

  return (
    <div>
      <PageHeader
        title="Mark Attendance"
        description="Mark attendance for your actual assigned students."
      />

      <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Class</label>
          <input
            disabled
            value={students[0] ? `${students[0].schoolClass.name} - Section ${students[0].schoolClass.section}` : "No assigned class"}
            className="w-full rounded-lg border bg-sand-50 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {students.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-teal-700 font-medium">{presentCount} Present</span>
              <span className="text-gold-600 font-medium">{lateCount} Late</span>
              <span className="text-clay-600 font-medium">{absentCount} Absent</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<CheckCircle2 />} onClick={() => {
                setStatuses(Object.fromEntries(students.map((student) => [student.id, "present"])));
              }}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" icon={<RotateCcw />} onClick={reset}>
                Reset
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-sand-50">
                  <th className="px-4 py-3 text-xs uppercase">Roll No.</th>
                  <th className="px-4 py-3 text-xs uppercase">Student Name</th>
                  <th className="px-4 py-3 text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3.5">{student.rollNo}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.user.name || "Student"} color={student.user.avatarColor || undefined} size="sm" />
                        <span className="font-medium">{student.user.name || "Unnamed Student"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex rounded-lg border border-line p-0.5 bg-sand-50">
                        {STATUS_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const active = statuses[student.id] === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setStatus(student.id, option.value)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                                active
                                  ? option.value === "present"
                                    ? "bg-teal-700 text-white"
                                    : option.value === "absent"
                                      ? "bg-clay-600 text-white"
                                      : "bg-gold-500 text-white"
                                  : "text-ink-soft/50 hover:text-ink"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <Button icon={<Save />} onClick={saveAttendance} disabled={saving || !subjectId}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-ink-soft/60">
          No students found in your assigned class. Ask your administrator to assign a class and add students.
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  UserCheck,
  UserX,
  BookOpen,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { ClassWiseBarChart } from "@/components/charts/ClassWiseBarChart";
import { AttendanceLineChart } from "@/components/charts/AttendanceLineChart";
import { AttendanceDonut } from "@/components/charts/AttendanceDonut";

type Student = {
  id: string;
  rollNo: string;
  user: {
    name: string;
    email: string;
  };
  schoolClass: {
    name: string;
    section: string;
  };
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  studentId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
};

export default function StudentDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [studentsResponse, attendanceResponse] =
          await Promise.all([
            fetch("/api/students"),
            fetch("/api/attendance"),
          ]);

        if (!studentsResponse.ok) {
          throw new Error("Failed to load students");
        }

        if (!attendanceResponse.ok) {
          throw new Error("Failed to load attendance");
        }

        const studentsData = await studentsResponse.json();
        const attendanceData = await attendanceResponse.json();

        const studentList = Array.isArray(studentsData)
          ? studentsData
          : studentsData.students || [];

        const attendanceList = Array.isArray(attendanceData)
          ? attendanceData
          : attendanceData.attendance || [];

        setStudents(studentList);
        setAttendance(attendanceList);

        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load student dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const currentStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const myRecords = useMemo(() => {
    if (!selectedStudentId) return [];

    return attendance.filter(
      (record) => record.studentId === selectedStudentId
    );
  }, [attendance, selectedStudentId]);

  const present = myRecords.filter(
    (record) => record.status === "present"
  ).length;

  const late = myRecords.filter(
    (record) => record.status === "late"
  ).length;

  const absent = myRecords.filter(
    (record) => record.status === "absent"
  ).length;

  const total = myRecords.length;

  const overallPct =
    total > 0
      ? Math.round(((present + late) / total) * 100)
      : 0;

  const subjectWise = useMemo(() => {
    const subjectMap = new Map<
      string,
      {
        name: string;
        present: number;
        total: number;
      }
    >();

    myRecords.forEach((record) => {
      const subjectId = record.subject.id;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          name: record.subject.name,
          present: 0,
          total: 0,
        });
      }

      const subject = subjectMap.get(subjectId)!;

      subject.total += 1;

      if (
        record.status === "present" ||
        record.status === "late"
      ) {
        subject.present += 1;
      }
    });

    return Array.from(subjectMap.values()).map((subject) => ({
      label: subject.name,
      attendance:
        subject.total > 0
          ? Math.round(
              (subject.present / subject.total) * 100
            )
          : 0,
    }));
  }, [myRecords]);

  const monthlyAttendance = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();

      date.setMonth(date.getMonth() - i);

      const month = date.getMonth();
      const year = date.getFullYear();

      const records = myRecords.filter((record) => {
        const recordDate = new Date(record.date);

        return (
          recordDate.getMonth() === month &&
          recordDate.getFullYear() === year
        );
      });

      const presentCount = records.filter(
        (record) =>
          record.status === "present" ||
          record.status === "late"
      ).length;

      const percentage =
        records.length > 0
          ? Math.round(
              (presentCount / records.length) * 100
            )
          : 0;

      const label = date.toLocaleDateString("en-US", {
        month: "short",
      });

      months.push({
        label,
        month: label,
        attendance: percentage,
        value: percentage,
      });
    }

    return months;
  }, [myRecords]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Student Dashboard"
          description="Loading your attendance data..."
        />

        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <p className="text-sm text-ink-soft">
            Loading student data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Student Dashboard"
          description="Unable to load dashboard data."
        />

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div>
        <PageHeader
          title="Student Dashboard"
          description="No students found."
        />

        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <p className="text-sm text-ink-soft">
            Please add a student from the Admin Students section first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={
          currentStudent
            ? `Hi ${currentStudent.user.name.split(" ")[0]}, here's your attendance`
            : "Student Dashboard"
        }
        description={
          currentStudent
            ? `${currentStudent.schoolClass.name} · Section ${currentStudent.schoolClass.section} · Roll No. ${currentStudent.rollNo}`
            : "Your attendance overview"
        }
      />

      {/* Admin/teacher previews may return multiple students; student accounts receive only their own record. */}
      {students.length > 1 && <div className="mb-5 rounded-xl border border-ink/10 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-ink">
          Select Student
        </label>

        <select
          value={selectedStudentId}
          onChange={(e) =>
            setSelectedStudentId(e.target.value)
          }
          className="w-full max-w-md rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.user.name} — Roll No. {student.rollNo}
            </option>
          ))}
        </select>
      </div>}

      {/* Dashboard Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Overall Attendance"
          value={`${overallPct}%`}
          icon={CalendarCheck2}
          tone="teal"
        />

        <DashboardCard
          label="Present Days"
          value={present + late}
          icon={UserCheck}
          tone="teal"
        />

        <DashboardCard
          label="Absent Days"
          value={absent}
          icon={UserX}
          tone="clay"
        />

        <DashboardCard
          label="Total Classes"
          value={total}
          icon={BookOpen}
          tone="gold"
        />
      </div>

      {/* Subject + Donut */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Subject-wise attendance"
          subtitle="Your attendance by subject"
          className="lg:col-span-2"
        >
          {subjectWise.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft/60">
              No attendance records available.
            </p>
          ) : (
            <ClassWiseBarChart data={subjectWise} />
          )}
        </ChartCard>

        <ChartCard
          title="This term's split"
          subtitle="Present, late & absent"
        >
          <div className="flex flex-col items-center">
            <AttendanceDonut
              present={present}
              absent={absent}
              late={late}
            />
          </div>
        </ChartCard>
      </div>

      {/* Monthly Attendance */}
      <div className="mt-5">
        <ChartCard
          title="Monthly attendance trend"
          subtitle="Your average attendance by month"
        >
          <AttendanceLineChart
            data={monthlyAttendance}
          />
        </ChartCard>
      </div>
    </div>
  );
}
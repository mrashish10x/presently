"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
  UserX,
  BookOpen,
} from "lucide-react";

type Teacher = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedClass: {
    id: string;
    name: string;
    section: string;
  } | null;
  subjects: {
    id: string;
    name: string;
    code: string;
    classId: string | null;
  }[];
};

type Student = {
  id: string;
  rollNo: string;
  user: {
    name: string;
  };
  schoolClass: {
    id: string;
    name: string;
    section: string;
  };
};

type Attendance = {
  id: string;
  date: string;
  status: string;
  studentId: string;
  subjectId: string;
  teacherId: string | null;
};

export default function TeacherDashboardPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(
    []
  );
  const [students, setStudents] = useState<Student[]>(
    []
  );
  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [selectedTeacherId, setSelectedTeacherId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load dashboard data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          teachersResponse,
          studentsResponse,
          attendanceResponse,
        ] = await Promise.all([
          fetch("/api/teachers"),
          fetch("/api/students"),
          fetch("/api/attendance"),
        ]);

        if (
          !teachersResponse.ok ||
          !studentsResponse.ok ||
          !attendanceResponse.ok
        ) {
          throw new Error(
            "Failed to load dashboard data."
          );
        }

        const teachersData =
          await teachersResponse.json();

        const studentsData =
          await studentsResponse.json();

        const attendanceData =
          await attendanceResponse.json();

        const loadedTeachers =
          teachersData.teachers || [];

        setTeachers(loadedTeachers);
        setStudents(studentsData.students || []);
        setAttendance(
          attendanceData.attendance || []
        );

        // Automatically select first teacher
        if (loadedTeachers.length > 0) {
          setSelectedTeacherId(
            loadedTeachers[0].id
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedTeacher = useMemo(() => {
    return teachers.find(
      (teacher) =>
        teacher.id === selectedTeacherId
    );
  }, [teachers, selectedTeacherId]);

  // Teacher's assigned class
  const assignedClassId =
    selectedTeacher?.assignedClass?.id || null;

  // Students belonging to teacher's assigned class
  const classStudents = useMemo(() => {
    if (!assignedClassId) return [];

    return students.filter(
      (student) =>
        student.schoolClass.id ===
        assignedClassId
    );
  }, [students, assignedClassId]);

  // Teacher's subjects
  const teacherSubjects =
    selectedTeacher?.subjects || [];

  // Today's date
  const today = new Date();

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Today's attendance for teacher
  const teacherAttendance = useMemo(() => {
    if (!selectedTeacherId) return [];

    return attendance.filter((record) => {
      const recordDate = new Date(record.date);

      const isToday =
        recordDate >= startOfToday &&
        recordDate <= endOfToday;

      const isTeacherRecord =
        record.teacherId === selectedTeacherId ||
        teacherSubjects.some(
          (subject) =>
            subject.id === record.subjectId
        );

      return isToday && isTeacherRecord;
    });
  }, [
    attendance,
    selectedTeacherId,
    teacherSubjects,
  ]);

  const presentToday =
    teacherAttendance.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late"
    ).length;

  const absentToday =
    teacherAttendance.filter(
      (record) => record.status === "absent"
    ).length;

  const lateToday =
    teacherAttendance.filter(
      (record) => record.status === "late"
    ).length;

  const totalToday = teacherAttendance.length;

  const attendancePercentage =
    totalToday > 0
      ? Math.round(
          (presentToday / totalToday) * 100
        )
      : 0;

  // Overall attendance for assigned class
  const classStudentIds = useMemo(() => {
    return new Set(
      classStudents.map(
        (student) => student.id
      )
    );
  }, [classStudents]);

  const classAttendance = useMemo(() => {
    return attendance.filter((record) =>
      classStudentIds.has(record.studentId)
    );
  }, [attendance, classStudentIds]);

  const classPresent =
    classAttendance.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late"
    ).length;

  const classAttendancePercentage =
    classAttendance.length > 0
      ? Math.round(
          (classPresent /
            classAttendance.length) *
            100
        )
      : 0;

  // Recent attendance
  const recentAttendance = useMemo(() => {
    return [...teacherAttendance]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 6);
  }, [teacherAttendance]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-ink-soft">
          Loading teacher dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-ink-soft">
            Teacher Dashboard
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-ink">
            Welcome back,{" "}
            {selectedTeacher?.user.name ||
              "Teacher"}
          </h1>

          <p className="mt-1 text-sm text-ink-soft">
            Here&apos;s what&apos;s happening with your
            class today.
          </p>
        </div>

        {/* Temporary teacher selector */}
        <div className="w-full md:w-72">
          <label className="mb-2 block text-xs font-medium text-ink-soft">
            Select Teacher
          </label>

          <select
            value={selectedTeacherId}
            onChange={(e) =>
              setSelectedTeacherId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-black/30"
          >
            {teachers.length === 0 ? (
              <option value="">
                No teachers found
              </option>
            ) : (
              teachers.map((teacher) => (
                <option
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.user.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Teacher information */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft/50">
              Assigned Class
            </p>

            <p className="mt-1 text-lg font-semibold text-ink">
              {selectedTeacher?.assignedClass
                ? `${selectedTeacher.assignedClass.name} - ${selectedTeacher.assignedClass.section}`
                : "No class assigned"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft/50">
              Subjects
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {teacherSubjects.length === 0 ? (
                <span className="text-sm text-ink-soft">
                  No subjects assigned
                </span>
              ) : (
                teacherSubjects.map(
                  (subject) => (
                    <span
                      key={subject.id}
                      className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium text-ink"
                    >
                      {subject.name}
                    </span>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Students */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>

            <Users className="h-5 w-5 text-ink-soft/30" />
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Total Students
          </p>

          <p className="mt-1 text-2xl font-semibold text-ink">
            {classStudents.length}
          </p>
        </div>

        {/* Present */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-emerald-50 p-3 w-fit">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Present Today
          </p>

          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {presentToday}
          </p>
        </div>

        {/* Absent */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-red-50 p-3 w-fit">
            <UserX className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Absent Today
          </p>

          <p className="mt-1 text-2xl font-semibold text-red-500">
            {absentToday}
          </p>
        </div>

        {/* Attendance */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-amber-50 p-3 w-fit">
            <CalendarCheck2 className="h-5 w-5 text-amber-600" />
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Today&apos;s Attendance
          </p>

          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {attendancePercentage}%
          </p>
        </div>
      </div>

      {/* Main sections */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Class overview */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Class Overview
              </h2>

              <p className="mt-1 text-sm text-ink-soft">
                Attendance summary for your
                assigned class.
              </p>
            </div>

            <GraduationCap className="h-5 w-5 text-ink-soft/40" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-black/[0.025] p-4">
              <p className="text-xs text-ink-soft">
                Students
              </p>

              <p className="mt-2 text-xl font-semibold text-ink">
                {classStudents.length}
              </p>
            </div>

            <div className="rounded-xl bg-black/[0.025] p-4">
              <p className="text-xs text-ink-soft">
                Overall Attendance
              </p>

              <p className="mt-2 text-xl font-semibold text-ink">
                {classAttendancePercentage}%
              </p>
            </div>

            <div className="rounded-xl bg-black/[0.025] p-4">
              <p className="text-xs text-ink-soft">
                Late Today
              </p>

              <p className="mt-2 text-xl font-semibold text-amber-600">
                {lateToday}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                Overall attendance
              </span>

              <span className="text-sm font-medium text-ink">
                {classAttendancePercentage}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-ink transition-all"
                style={{
                  width: `${classAttendancePercentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                My Subjects
              </h2>

              <p className="mt-1 text-sm text-ink-soft">
                Assigned subjects
              </p>
            </div>

            <BookOpen className="h-5 w-5 text-ink-soft/40" />
          </div>

          <div className="mt-5 space-y-3">
            {teacherSubjects.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No subjects assigned.
              </p>
            ) : (
              teacherSubjects.map(
                (subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded-xl bg-black/[0.025] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {subject.name}
                      </p>

                      <p className="text-xs text-ink-soft">
                        {subject.code}
                      </p>
                    </div>

                    <BookOpen className="h-4 w-4 text-ink-soft/40" />
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Recent Attendance
              </h2>

              <p className="mt-1 text-sm text-ink-soft">
                Latest attendance records.
              </p>
            </div>

            <Clock3 className="h-5 w-5 text-ink-soft/40" />
          </div>
        </div>

        {recentAttendance.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarCheck2 className="mx-auto h-9 w-9 text-ink-soft/30" />

            <p className="mt-3 text-sm text-ink-soft">
              No attendance records for today.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {recentAttendance.map(
              (record) => {
                const student =
                  students.find(
                    (item) =>
                      item.id ===
                      record.studentId
                  );

                const subject =
                  teacherSubjects.find(
                    (item) =>
                      item.id ===
                      record.subjectId
                  );

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {student?.user.name ||
                          "Unknown student"}
                      </p>

                      <p className="mt-1 text-xs text-ink-soft">
                        Roll No:{" "}
                        {student?.rollNo ||
                          "—"}
                        {subject
                          ? ` · ${subject.name}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        record.status ===
                        "present"
                          ? "bg-emerald-50 text-emerald-700"
                          : record.status ===
                            "absent"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
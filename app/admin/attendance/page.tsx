import {
  GraduationCap,
  Users,
  Layers,
  CalendarCheck2,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { AttendanceBarChart } from "@/components/charts/AttendanceBarChart";
import { AttendanceLineChart } from "@/components/charts/AttendanceLineChart";
import { ClassWiseBarChart } from "@/components/charts/ClassWiseBarChart";
import { Avatar } from "@/components/ui/Avatar";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AdminDashboardPage() {
  const session = await requireRole(["ADMIN"]);
  const schoolId = session.user.schoolId;
  if (!schoolId) throw new Error("Admin account is not linked to a college.");
  const inSchool = { schoolClass: { schoolId } };

  // ----------------------------------------
  // BASIC COUNTS
  // ----------------------------------------

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
  ] = await Promise.all([
    prisma.student.count({ where: inSchool }),
    prisma.teacher.count({ where: { user: { schoolId } } }),
    prisma.schoolClass.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
  ]);

  // ----------------------------------------
  // TODAY
  // ----------------------------------------

  const today = new Date();

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const todayRecords = await prisma.attendance.findMany({
    where: {
      student: inSchool,
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  const presentToday = todayRecords.filter(
    (record) =>
      record.status === "present" ||
      record.status === "late"
  ).length;

  const absentToday = todayRecords.filter(
    (record) => record.status === "absent"
  ).length;

  const todayAttendancePercentage =
    todayRecords.length > 0
      ? Math.round(
          (presentToday / todayRecords.length) * 100
        )
      : 0;

  // ----------------------------------------
  // ALL ATTENDANCE
  // ----------------------------------------

  const allAttendance = await prisma.attendance.findMany({
    where: { student: inSchool },
    orderBy: {
      date: "desc",
    },
  });

  const totalAttendance = allAttendance.length;

  const totalPresent = allAttendance.filter(
    (record) =>
      record.status === "present" ||
      record.status === "late"
  ).length;

  const averageAttendance =
    totalAttendance > 0
      ? Math.round(
          (totalPresent / totalAttendance) * 100
        )
      : 0;

  // ----------------------------------------
  // WEEKLY ATTENDANCE
  // ----------------------------------------

  const weeklyAttendance = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const records = allAttendance.filter((record) => {
      const recordDate = new Date(record.date);

      return (
        recordDate >= start &&
        recordDate <= end
      );
    });

    const present = records.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late"
    ).length;

    const absent = records.filter(
      (record) => record.status === "absent"
    ).length;

    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    weeklyAttendance.push({
      label,
      day: label,
      present,
      absent,
    });
  }

  // ----------------------------------------
  // MONTHLY ATTENDANCE
  // ----------------------------------------

  const monthlyAttendance = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const records = allAttendance.filter((record) => {
      const recordDate = new Date(record.date);

      return (
        recordDate.getMonth() === month &&
        recordDate.getFullYear() === year
      );
    });

    const present = records.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late"
    ).length;

    const percentage =
      records.length > 0
        ? Math.round(
            (present / records.length) * 100
          )
        : 0;

    const label = monthDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
      }
    );

    monthlyAttendance.push({
      label,
      month: label,
      attendance: percentage,
      value: percentage,
    });
  }

  // ----------------------------------------
  // CLASS-WISE ATTENDANCE
  // ----------------------------------------

  const classes = await prisma.schoolClass.findMany({
    where: { schoolId },
    include: {
      students: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const classWiseAttendance = classes.map((schoolClass) => {
    const studentIds = new Set(
      schoolClass.students.map(
        (student) => student.id
      )
    );

    const records = allAttendance.filter((record) =>
      studentIds.has(record.studentId)
    );

    const present = records.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late"
    ).length;

    const percentage =
      records.length > 0
        ? Math.round(
            (present / records.length) * 100
          )
        : 0;

    const label = `${schoolClass.name} · ${schoolClass.section}`;

    return {
      label,
      className: label,
      class: label,
      attendance: percentage,
      percentage,
    };
  });

  // ----------------------------------------
  // RECENT ACTIVITY
  // ----------------------------------------

  const recentAttendance =
    await prisma.attendance.findMany({
      where: { student: inSchool },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
    });

  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (
    <div>
      <PageHeader
        title="Welcome back, Admin"
        description="Here's what's happening across the institution today."
      />

      {/* DASHBOARD CARDS */}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          tone="teal"
        />

        <DashboardCard
          label="Total Teachers"
          value={totalTeachers}
          icon={Users}
          tone="gold"
        />

        <DashboardCard
          label="Total Classes"
          value={totalClasses}
          icon={Layers}
          tone="ink"
        />

        <DashboardCard
          label="Today's Attendance"
          value={`${todayAttendancePercentage}%`}
          icon={CalendarCheck2}
          tone="teal"
        />

        <DashboardCard
          label="Present Today"
          value={presentToday}
          icon={UserCheck}
          tone="teal"
        />

        <DashboardCard
          label="Absent Today"
          value={absentToday}
          icon={UserX}
          tone="clay"
        />

        <DashboardCard
          label="Average Attendance"
          value={`${averageAttendance}%`}
          icon={TrendingUp}
          tone="gold"
        />

        <DashboardCard
          label="Total Subjects"
          value={totalSubjects}
          icon={Layers}
          tone="ink"
        />
      </div>

      {/* WEEKLY + MONTHLY CHARTS */}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Weekly attendance"
          subtitle="Present vs. absent, last 7 days"
          className="lg:col-span-2"
        >
          <AttendanceBarChart
            data={weeklyAttendance}
          />
        </ChartCard>

        <ChartCard
          title="Monthly attendance"
          subtitle="Institution-wide average"
        >
          <AttendanceLineChart
            data={monthlyAttendance}
          />
        </ChartCard>
      </div>

      {/* CLASS-WISE + ACTIVITY */}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Class-wise attendance"
          subtitle="Average attendance by class & section"
          className="lg:col-span-2"
        >
          <ClassWiseBarChart
            data={classWiseAttendance}
          />
        </ChartCard>

        <ChartCard
          title="Recent activity"
          subtitle="Latest attendance activity"
        >
          <div className="space-y-4">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-ink-soft/50">
                No recent activity.
              </p>
            ) : (
              recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3"
                >
                  <Avatar
                    name={
                      record.student.user.name
                    }
                    size="sm"
                  />

                  <div className="min-w-0">
                    <p className="text-sm text-ink leading-snug">
                      <span className="font-medium">
                        {record.student.user.name}
                      </span>{" "}
                      <span className="text-ink-soft/60">
                        was marked{" "}
                      </span>
                      <span className="font-medium">
                        {record.status}
                      </span>
                    </p>

                    <p className="text-xs text-ink-soft/40 mt-0.5">
                      {record.subject.name} ·{" "}
                      {formatDate(
                        new Date(record.date)
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
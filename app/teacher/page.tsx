import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, BookOpen, CalendarCheck2, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { AttendanceDonut } from "@/components/charts/AttendanceDonut";

export default async function TeacherDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "TEACHER") redirect("/login");
  if (!session.user.schoolId) {
    return <div className="rounded-xl border bg-white p-6">
      Your account is not linked to a school. Please contact your administrator.
    </div>;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { name: true, email: true, schoolId: true },
      },
      assignedClass: {
        include: {
          students: {
            select: { id: true },
          },
        },
      },
      subjects: {
        select: {
          id: true,
          name: true,
          code: true,
          schoolId: true,
        },
      },
    },
  });

  if (!teacher || teacher.user.schoolId !== session.user.schoolId) {
    return <div className="rounded-xl border bg-white p-6">
      Teacher profile not found for this account. Please contact your administrator.
    </div>;
  }

  const schoolId = session.user.schoolId;
  const classId = teacher.assignedClassId;
  const subjects = teacher.subjects.filter(
    (subject) => subject.schoolId === schoolId
  );

  const studentCount = teacher.assignedClass?.students.length ?? 0;

  const now = new Date();
  const startOfDay = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const attendanceRecords =
    classId && subjects.length > 0
      ? await prisma.attendance.findMany({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
            student: {
              is: {
                classId,
                schoolClass: {
                  is: { schoolId },
                },
              },
            },
            subject: {
              is: {
                teacherId: teacher.id,
                schoolId,
              },
            },
          },
          select: {
            status: true,
          },
        })
      : [];

  const present = attendanceRecords.filter(
    (record) => record.status === "present"
  ).length;

  const absent = attendanceRecords.filter(
    (record) => record.status === "absent"
  ).length;

  const late = attendanceRecords.filter(
    (record) => record.status === "late"
  ).length;

  const attendancePercentage = attendanceRecords.length
    ? Math.round((present / attendanceRecords.length) * 100)
    : 0;

  const teacherName = teacher.user.name || teacher.user.email || "Teacher";

  return (
    <div>
      <PageHeader
        title={`Welcome, ${teacherName}`}
        description={
          teacher.assignedClass
            ? `Your assigned class: ${teacher.assignedClass.name} ${teacher.assignedClass.section}`
            : "You currently have no assigned class."
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardCard
          label="Assigned Class"
          value={teacher.assignedClass ? 1 : 0}
          icon={GraduationCap}
          tone="teal"
        />
        <DashboardCard
          label="Total Students"
          value={studentCount}
          icon={Users}
          tone="gold"
        />
        <DashboardCard
          label="My Subjects"
          value={subjects.length}
          icon={BookOpen}
          tone="ink"
        />
        <DashboardCard
          label="Today's Attendance"
          value={attendanceRecords.length}
          icon={CalendarCheck2}
          tone="teal"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="My Subjects"
          subtitle="Subjects assigned to your account"
        >
          {subjects.length > 0 ? (
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between rounded-xl border bg-sand-50 px-4 py-3"
                >
                  <span className="text-sm font-medium">{subject.name}</span>
                  <span className="text-xs text-ink-soft/60">
                    {subject.code}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-ink-soft/60">
              No subjects assigned yet.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Today's Attendance"
          subtitle="Records for your assigned class and subjects"
        >
          {attendanceRecords.length > 0 ? (
            <>
              <div className="flex flex-col items-center">
                <AttendanceDonut
                  present={present}
                  absent={absent}
                  late={late}
                />
                <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-semibold text-teal-700">{present}</p>
                    <p className="text-xs text-ink-soft/60">Present</p>
                  </div>
                  <div>
                    <p className="font-semibold text-clay-600">{absent}</p>
                    <p className="text-xs text-ink-soft/60">Absent</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gold-600">{late}</p>
                    <p className="text-xs text-ink-soft/60">Late</p>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-ink-soft/60">
                Present attendance: {attendancePercentage}%
              </p>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-ink-soft/60">
              No attendance records found for today.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

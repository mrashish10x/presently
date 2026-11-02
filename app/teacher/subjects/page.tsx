import { BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TeacherSubjectsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "TEACHER") redirect("/login");
  if (!session.user.schoolId) {
    return <p>Your account is not linked to a school.</p>;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { schoolId: true } },
      subjects: {
        where: { schoolId: session.user.schoolId },
        include: {
          schoolClass: {
            select: { name: true, section: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!teacher || teacher.user.schoolId !== session.user.schoolId) {
    return <p>Teacher profile not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title="My Subjects"
        description="Subjects assigned to your account."
      />

      {teacher.subjects.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-6 text-sm text-ink-soft/60">
          No subjects assigned yet. Contact your administrator.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teacher.subjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-ink">
                {subject.name}
              </h3>
              <p className="text-sm text-ink-soft/55">
                Code: {subject.code}
              </p>
              <p className="mt-1 text-sm text-ink-soft/55">
                {subject.schoolClass
                  ? `${subject.schoolClass.name} · Section ${subject.schoolClass.section}`
                  : "Class not assigned"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

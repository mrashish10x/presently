import { Layers, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TeacherClassesPage() {
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
      assignedClass: {
        include: { _count: { select: { students: true } } },
      },
      classTeacherFor: {
        include: { _count: { select: { students: true } } },
      },
    },
  });

  if (!teacher || teacher.user.schoolId !== session.user.schoolId) {
    return <p>Teacher profile not found.</p>;
  }

  const classes = [
    ...(teacher.assignedClass ? [teacher.assignedClass] : []),
    ...teacher.classTeacherFor,
  ].filter(
    (item, index, self) =>
      item.schoolId === session.user.schoolId &&
      self.findIndex((other) => other.id === item.id) === index
  );

  return (
    <div>
      <PageHeader
        title="My Classes"
        description="Classes and sections assigned to you this term."
      />

      {classes.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-6 text-sm text-ink-soft/60">
          No classes have been assigned to you yet. Contact your administrator.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-ink">
                {item.name}
              </h3>
              <p className="text-sm text-ink-soft/55">
                Section {item.section}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-soft/60">
                <Users className="h-4 w-4" />
                {item._count.students} students in this section
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

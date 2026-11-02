"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  GraduationCap,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

import {
  CLASS_NAMES,
  SECTIONS,
  AVATAR_COLORS,
} from "@/data/mock";

import { pctBadgeClasses } from "@/lib/utils";
import type { Student } from "@/types";

type ModalMode = "add" | "edit" | "view" | "delete" | null;

const emptyStudent: Omit<
  Student,
  "id" | "attendancePct" | "status" | "avatarColor"
> = {
  name: "",
  email: "",
  className: CLASS_NAMES[0],
  section: SECTIONS[0],
  rollNo: "",
  phone: "",
  guardianName: "",
  joinedOn: new Date().toISOString().slice(0, 10),
};

export default function StudentsPage() {
  const { showToast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [mode, setMode] = useState<ModalMode>(null);
  const [active, setActive] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyStudent);

  const [classes, setClasses] = useState<
    {
      id: string;
      name: string;
      section: string;
    }[]
  >([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [password, setPassword] = useState("");

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  async function loadStudents() {
    try {
      setLoading(true);

      const response = await fetch("/api/students");

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load students"
        );
      }

      const formattedStudents: Student[] =
        data.students.map((student: Record<string, any>) => ({
          id: student.id,

          name: student.user?.name ?? "",

          email: student.user?.email ?? "",

          className:
            student.schoolClass?.name ?? "",

          section:
            student.schoolClass?.section ?? "",

          rollNo:
            student.rollNo ?? "",

          phone:
            student.user?.phone ?? "",

          guardianName:
            student.guardianName ?? "",

          joinedOn: student.joinedOn
            ? new Date(student.joinedOn)
                .toISOString()
                .slice(0, 10)
            : "",

          attendancePct: 0,

          status:
            student.user?.status === "inactive"
              ? "inactive"
              : "active",

          avatarColor:
            AVATAR_COLORS[
              Math.floor(
                Math.random() *
                  AVATAR_COLORS.length
              )
            ],
        }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error(
        "Failed to load students:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load students from database.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD CLASSES
  // =========================================================

  async function loadClasses() {
    try {
      const response = await fetch("/api/classes");

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load classes"
        );
      }

      const formattedClasses =
        data.classes.map((item: Record<string, any>) => ({
          id: item.id,
          name: item.name,
          section: item.section,
        }));

      setClasses(formattedClasses);

      if (formattedClasses.length > 0) {
        setSelectedClassId(
          formattedClasses[0].id
        );

        setForm((prev) => ({
          ...prev,
          className:
            formattedClasses[0].name,
          section:
            formattedClasses[0].section,
        }));
      }
    } catch (error) {
      console.error(
        "Failed to load classes:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load classes from database.",
        "error"
      );
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        s.email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        s.id
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesClass =
        classFilter === "all" ||
        s.className === classFilter;

      const matchesStatus =
        statusFilter === "all" ||
        s.status === statusFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    students,
    search,
    classFilter,
    statusFilter,
  ]);

  // =========================================================
  // OPEN ADD
  // =========================================================

  function openAdd() {
    const firstClass = classes[0];

    setForm({
      ...emptyStudent,

      className:
        firstClass?.name ??
        CLASS_NAMES[0],

      section:
        firstClass?.section ??
        SECTIONS[0],

      joinedOn:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setSelectedClassId(
      firstClass?.id ?? ""
    );

    setPassword("");

    setActive(null);

    setMode("add");
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  function openEdit(s: Student) {
    const matchedClass = classes.find(
      (item) =>
        item.name === s.className &&
        item.section === s.section
    );

    setForm({
      ...s,
    });

    setSelectedClassId(
      matchedClass?.id ?? ""
    );

    setActive(s);

    setMode("edit");
  }

  // =========================================================
  // OPEN VIEW
  // =========================================================

  function openView(s: Student) {
    setActive(s);
    setMode("view");
  }

  // =========================================================
  // OPEN DELETE
  // =========================================================

  function openDelete(s: Student) {
    setActive(s);
    setMode("delete");
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  function closeModal() {
    setMode(null);
    setActive(null);
  }

  // =========================================================
  // SAVE STUDENT
  // ADD + EDIT
  // =========================================================

  async function handleSave(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // =======================================================
    // ADD STUDENT
    // =======================================================

    if (mode === "add") {
      if (!selectedClassId) {
        showToast(
          "Please select a class.",
          "error"
        );
        return;
      }

      if (!password.trim()) {
        showToast(
          "Password is required.",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(
          "/api/students",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: form.name,

              email: form.email,

              password,

              rollNo: form.rollNo,

              classId:
                selectedClassId,

              guardianName:
                form.guardianName,

              phone: form.phone,
            }),
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to create student"
          );
        }

        showToast(
          `${form.name} was added successfully.`,
          "success"
        );

        closeModal();

        setPassword("");

        await loadStudents();
      } catch (error) {
        console.error(
          "CREATE STUDENT ERROR:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Failed to add student.",
          "error"
        );
      }

      return;
    }

    // =======================================================
    // EDIT STUDENT
    // =======================================================

    if (
      mode === "edit" &&
      active
    ) {
      if (!selectedClassId) {
        showToast(
          "Please select a class.",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(
          "/api/students",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              studentId:
                active.id,

              name: form.name,

              email: form.email,

              rollNo: form.rollNo,

              classId:
                selectedClassId,

              guardianName:
                form.guardianName,

              phone: form.phone,

              status:
                active.status,
            }),
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to update student"
          );
        }

        showToast(
          `${form.name}'s profile was updated successfully.`,
          "success"
        );

        closeModal();

        await loadStudents();
      } catch (error) {
        console.error(
          "UPDATE STUDENT ERROR:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Failed to update student.",
          "error"
        );
      }
    }
  }

  // =========================================================
  // DELETE STUDENT
  // =========================================================

  async function handleDelete() {
    if (!active) return;

    try {
      const response = await fetch(
        "/api/students",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            studentId:
              active.id,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete student"
        );
      }

      showToast(
        `${active.name} was removed successfully.`,
        "info"
      );

      closeModal();

      await loadStudents();
    } catch (error) {
      console.error(
        "DELETE STUDENT ERROR:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Failed to delete student.",
        "error"
      );
    }
  }

  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns: Column<Student>[] = [
    {
      header: "Student",

      accessor: (s) => (
        <div className="flex items-center gap-3 min-w-[190px]">
          <Avatar
            name={s.name}
            color={s.avatarColor}
            size="sm"
          />

          <div>
            <p className="font-medium text-ink">
              {s.name}
            </p>

            <p className="text-xs text-ink-soft/50">
              {s.email}
            </p>
          </div>
        </div>
      ),
    },

    {
      header: "Student ID",

      accessor: (s) => (
        <span className="text-ink-soft/70">
          {s.id}
        </span>
      ),
    },

    {
      header: "Class / Section",

      accessor: (s) => (
        <span>
          {s.className.replace(
            "B.Tech ",
            ""
          )}

          <span className="text-ink-soft/40">
            {" "}
            · Sec {s.section}
          </span>
        </span>
      ),
    },

    {
      header: "Attendance",

      accessor: (s) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(
            s.attendancePct
          )}`}
        >
          {s.attendancePct}%
        </span>
      ),
    },

    {
      header: "Status",

      accessor: (s) => (
        <StatusBadge
          status={s.status}
        />
      ),
    },

    {
      header: "Actions",

      accessor: (s) => (
        <div className="flex items-center gap-1">
          {/* VIEW */}
          <button
            onClick={() =>
              openView(s)
            }
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-sand-100 hover:text-ink"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* EDIT */}
          <button
            onClick={() =>
              openEdit(s)
            }
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-sand-100 hover:text-ink"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* DELETE */}
          <button
            onClick={() =>
              openDelete(s)
            }
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-clay-100 hover:text-clay-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} students across ${classes.length} classes`}
        actions={
          <Button
            icon={<Plus />}
            onClick={openAdd}
          >
            Add Student
          </Button>
        }
      />

      {/* SEARCH + FILTERS */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-soft/50 max-w-sm">
          <Search className="h-4 w-4" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search by name, email or ID…"
            className="w-full bg-transparent outline-none placeholder:text-ink-soft/40 text-ink"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) =>
            setClassFilter(
              e.target.value
            )
          }
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
        >
          <option value="all">
            All classes
          </option>

          {classes.map((item) => (
            <option
              key={item.id}
              value={item.name}
            >
              {item.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
        >
          <option value="all">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-soft">
          Loading students...
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          keyField={(s) => s.id}
          emptyState={
            <EmptyState
              icon={GraduationCap}
              title="No students found"
              description="Try adjusting your search or filters, or add a new student."
              action={
                <Button
                  icon={<Plus />}
                  onClick={openAdd}
                >
                  Add Student
                </Button>
              }
            />
          }
        />
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      <Modal
        open={
          mode === "add" ||
          mode === "edit"
        }
        onClose={closeModal}
        title={
          mode === "add"
            ? "Add Student"
            : "Edit Student"
        }
        description={
          mode === "add"
            ? "Create a new student profile."
            : "Update this student's details."
        }
      >
        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          {/* NAME + ROLL */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Full name"
              required
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <TextField
              label="Roll no."
              required
              value={form.rollNo}
              onChange={(e) =>
                setForm({
                  ...form,
                  rollNo:
                    e.target.value,
                })
              }
            />
          </div>

          {/* EMAIL */}
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email:
                  e.target.value,
              })
            }
          />

          {/* CLASS + SECTION */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Class"
              options={
                classes.length > 0
                  ? Array.from(
                      new Map(
                        classes.map(
                          (item) => [
                            item.name,
                            item.name,
                          ]
                        )
                      ).values()
                    ).map((name) => ({
                      label: name,
                      value: name,
                    }))
                  : CLASS_NAMES.map(
                      (c) => ({
                        label: c,
                        value: c,
                      })
                    )
              }
              value={form.className}
              onChange={(e) => {
                const className =
                  e.target.value;

                const firstMatch =
                  classes.find(
                    (item) =>
                      item.name ===
                      className
                  );

                setForm({
                  ...form,
                  className,
                  section:
                    firstMatch?.section ??
                    form.section,
                });

                setSelectedClassId(
                  firstMatch?.id ?? ""
                );
              }}
            />

            <SelectField
              label="Section"
              options={
                classes.length > 0
                  ? classes
                      .filter(
                        (item) =>
                          item.name ===
                          form.className
                      )
                      .map((item) => ({
                        label: `Section ${item.section}`,
                        value:
                          item.section,
                      }))
                  : SECTIONS.map(
                      (s) => ({
                        label: `Section ${s}`,
                        value: s,
                      })
                    )
              }
              value={form.section}
              onChange={(e) => {
                const section =
                  e.target.value;

                const match =
                  classes.find(
                    (item) =>
                      item.name ===
                        form.className &&
                      item.section ===
                        section
                  );

                setForm({
                  ...form,
                  section,
                });

                setSelectedClassId(
                  match?.id ?? ""
                );
              }}
            />
          </div>

          {/* PASSWORD ONLY FOR ADD */}
          {mode === "add" && (
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />
          )}

          {/* PHONE + GUARDIAN */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />

            <TextField
              label="Guardian name"
              value={
                form.guardianName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  guardianName:
                    e.target.value,
                })
              }
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button type="submit">
              {mode === "add"
                ? "Add Student"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      <Modal
        open={mode === "view"}
        onClose={closeModal}
        title="Student Profile"
      >
        {active && (
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <Avatar
                name={active.name}
                color={
                  active.avatarColor
                }
                size="lg"
              />

              <div>
                <p className="font-display font-semibold text-ink">
                  {active.name}
                </p>

                <p className="text-sm text-ink-soft/55">
                  {active.email}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                [
                  "Student ID",
                  active.id,
                ],
                [
                  "Roll No.",
                  active.rollNo,
                ],
                [
                  "Class",
                  active.className,
                ],
                [
                  "Section",
                  active.section,
                ],
                [
                  "Phone",
                  active.phone,
                ],
                [
                  "Guardian",
                  active.guardianName,
                ],
                [
                  "Joined on",
                  active.joinedOn,
                ],
              ].map(
                ([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-ink-soft/45 uppercase tracking-wide">
                      {label}
                    </dt>

                    <dd className="mt-0.5 font-medium text-ink">
                      {value}
                    </dd>
                  </div>
                )
              )}

              <div>
                <dt className="text-xs text-ink-soft/45 uppercase tracking-wide">
                  Attendance
                </dt>

                <dd className="mt-0.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(
                      active.attendancePct
                    )}`}
                  >
                    {
                      active.attendancePct
                    }%
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-ink-soft/45 uppercase tracking-wide">
                  Status
                </dt>

                <dd className="mt-0.5">
                  <StatusBadge
                    status={
                      active.status
                    }
                  />
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-2.5 pt-6">
              <Button
                variant="secondary"
                onClick={
                  closeModal
                }
              >
                Close
              </Button>

              <Button
                onClick={() =>
                  openEdit(active)
                }
              >
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <Modal
        open={mode === "delete"}
        onClose={closeModal}
        title="Remove student"
        size="sm"
      >
        {active && (
          <div>
            <p className="text-sm text-ink-soft/70">
              Are you sure you want to
              remove{" "}
              <span className="font-medium text-ink">
                {active.name}
              </span>{" "}
              from the student list?
            </p>

            <div className="flex justify-end gap-2.5 pt-6">
              <Button
                variant="secondary"
                onClick={
                  closeModal
                }
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                onClick={
                  handleDelete
                }
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
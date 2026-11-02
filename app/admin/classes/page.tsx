"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Layers,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  DataTable,
  type Column,
} from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  TextField,
  SelectField,
} from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { pctBadgeClasses } from "@/lib/utils";

type TeacherItem = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  section: string;
  studentsCount: number;
  classTeacherId: string;
  classTeacher: string;
  attendancePct: number;
};

type ModalMode = "add" | "edit" | "delete" | null;

export default function ClassesPage() {
  const { showToast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [mode, setMode] = useState<ModalMode>(null);
  const [active, setActive] = useState<ClassItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    section: "",
    classTeacherId: "",
  });

  // =========================
  // LOAD CLASSES
  // =========================

  async function loadClasses() {
    try {
      setLoading(true);

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

      const formattedClasses: ClassItem[] =
        data.classes.map((item: Record<string, any>) => ({
          id: item.id,
          name: item.name,
          section: item.section,
          studentsCount: item.students?.length ?? 0,
          classTeacherId:
            item.classTeacher?.id ?? "",
          classTeacher:
            item.classTeacher?.user?.name ??
            "Not assigned",
          attendancePct: 0,
        }));

      setClasses(formattedClasses);
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);

      showToast(
        "Unable to load classes from database.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOAD TEACHERS
  // =========================

  async function loadTeachers() {
    try {
      const response = await fetch("/api/teachers");

      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load teachers"
        );
      }

      const formattedTeachers: TeacherItem[] =
        data.teachers.map((item: Record<string, any>) => ({
          id: item.id,
          name: item.user?.name ?? "Unnamed teacher",
        }));

      setTeachers(formattedTeachers);
    } catch (error) {
      console.error("LOAD TEACHERS ERROR:", error);

      showToast(
        "Unable to load teachers.",
        "error"
      );
    }
  }

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  // =========================
  // SEARCH
  // =========================

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return classes.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query) ||
        item.classTeacher
          .toLowerCase()
          .includes(query)
    );
  }, [classes, search]);

  // =========================
  // ADD
  // =========================

  function openAdd() {
    setForm({
      name: "",
      section: "",
      classTeacherId: "",
    });

    setActive(null);
    setMode("add");
  }

  // =========================
  // EDIT
  // =========================

  function openEdit(item: ClassItem) {
    setForm({
      name: item.name,
      section: item.section,
      classTeacherId: item.classTeacherId,
    });

    setActive(item);
    setMode("edit");
  }

  // =========================
  // DELETE
  // =========================

  function openDelete(item: ClassItem) {
    setActive(item);
    setMode("delete");
  }

  // =========================
  // CLOSE
  // =========================

  function closeModal() {
    setMode(null);
    setActive(null);
  }

  // =========================
  // SAVE
  // =========================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast(
        "Please enter class name.",
        "error"
      );
      return;
    }

    if (!form.section.trim()) {
      showToast(
        "Please enter section.",
        "error"
      );
      return;
    }

    try {
      // ADD
      if (mode === "add") {
        const response = await fetch(
          "/api/classes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: form.name.trim(),
              section: form.section.trim(),
              classTeacherId:
                form.classTeacherId || null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to create class"
          );
        }

        showToast(
          `${form.name} · Sec ${form.section} was created.`,
          "success"
        );
      }

      // EDIT
      if (mode === "edit" && active) {
        const response = await fetch(
          "/api/classes",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              classId: active.id,
              name: form.name.trim(),
              section: form.section.trim(),
              classTeacherId:
                form.classTeacherId || null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to update class"
          );
        }

        showToast(
          `${form.name} · Sec ${form.section} was updated.`,
          "success"
        );
      }

      closeModal();
      await loadClasses();
    } catch (error) {
      console.error(
        "SAVE CLASS ERROR:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
        "error"
      );
    }
  }

  // =========================
  // DELETE
  // =========================

  async function handleDelete() {
    if (!active) return;

    try {
      const response = await fetch(
        "/api/classes",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: active.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete class"
        );
      }

      showToast(
        `${active.name} · Sec ${active.section} was deleted.`,
        "success"
      );

      closeModal();
      await loadClasses();
    } catch (error) {
      console.error(
        "DELETE CLASS ERROR:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
        "error"
      );
    }
  }

  // =========================
  // TABLE
  // =========================

  const columns: Column<ClassItem>[] = [
    {
      header: "Class",
      accessor: (item) => (
        <span className="font-medium text-ink">
          {item.name}
        </span>
      ),
    },

    {
      header: "Section",
      accessor: (item) => (
        <span>
          Section {item.section}
        </span>
      ),
    },

    {
      header: "Students",
      accessor: (item) =>
        item.studentsCount,
    },

    {
      header: "Class Teacher",
      accessor: (item) => (
        <span
          className={
            item.classTeacher ===
            "Not assigned"
              ? "text-ink-soft/50"
              : "text-ink"
          }
        >
          {item.classTeacher}
        </span>
      ),
    },

    {
      header: "Attendance %",
      accessor: (item) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pctBadgeClasses(
            item.attendancePct
          )}`}
        >
          {item.attendancePct}%
        </span>
      ),
    },

    {
      header: "Actions",
      accessor: (item) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              openEdit(item)
            }
            className="rounded-md p-2 text-ink-soft hover:bg-black/5 hover:text-ink"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              openDelete(item)
            }
            className="rounded-md p-2 text-red-500 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Classes"
        description={`${classes.length} class-sections`}
        actions={
          <Button
            icon={<Plus />}
            onClick={openAdd}
          >
            Add Class
          </Button>
        }
      />

      {/* SEARCH */}

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-soft/50">
        <Search className="h-4 w-4" />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search classes..."
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft/40"
        />
      </div>

      {/* TABLE */}

      <DataTable
        columns={columns}
        rows={filtered}
        keyField={(item) => item.id}
        emptyState={
          loading ? (
            <div className="py-10 text-center text-sm text-ink-soft/60">
              Loading classes...
            </div>
          ) : (
            <EmptyState
              icon={Layers}
              title="No classes found"
              description="Try a different search, or add a new class."
              action={
                <Button
                  icon={<Plus />}
                  onClick={openAdd}
                >
                  Add Class
                </Button>
              }
            />
          )
        }
      />

      {/* ADD / EDIT MODAL */}

      <Modal
        open={
          mode === "add" ||
          mode === "edit"
        }
        onClose={closeModal}
        title={
          mode === "add"
            ? "Add Class"
            : "Edit Class"
        }
        size="sm"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <TextField
            label="Class"
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="e.g. B.Tech IT"
          />

          <TextField
            label="Section"
            required
            value={form.section}
            onChange={(e) =>
              setForm({
                ...form,
                section: e.target.value,
              })
            }
            placeholder="e.g. A"
          />

          <SelectField
            label="Class Teacher"
            options={[
              {
                label: "Not assigned",
                value: "",
              },
              ...teachers.map(
                (teacher) => ({
                  label: teacher.name,
                  value: teacher.id,
                })
              ),
            ]}
            value={form.classTeacherId}
            onChange={(e) =>
              setForm({
                ...form,
                classTeacherId:
                  e.target.value,
              })
            }
          />

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
                ? "Add Class"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}

      <Modal
        open={mode === "delete"}
        onClose={closeModal}
        title="Delete Class"
        size="sm"
      >
        {active && (
          <div>
            <p className="text-sm text-ink-soft/70">
              Are you sure you want to delete{" "}
              <span className="font-medium text-ink">
                {active.name} · Sec{" "}
                {active.section}
              </span>
              ?
            </p>

            {active.studentsCount > 0 && (
              <p className="mt-3 text-sm text-red-500">
                This class has{" "}
                {active.studentsCount}{" "}
                student(s), so it cannot
                be deleted until the students
                are moved or deleted.
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={
                  active.studentsCount > 0
                }
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
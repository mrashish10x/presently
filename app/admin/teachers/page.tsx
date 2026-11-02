"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

type Teacher = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
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
  }[];
};

type ModalMode = "add" | "edit" | "view" | "delete" | null;

export default function TeachersPage() {
  const { showToast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [mode, setMode] = useState<ModalMode>(null);
  const [active, setActive] = useState<Teacher | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  async function loadTeachers() {
    try {
      setLoading(true);

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

      setTeachers(data.teachers);
    } catch (error) {
      console.error("LOAD TEACHERS ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load teachers.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  const filtered = teachers.filter((teacher) => {
    const searchText = search.toLowerCase();

    return (
      teacher.user.name
        .toLowerCase()
        .includes(searchText) ||
      teacher.user.email
        .toLowerCase()
        .includes(searchText) ||
      teacher.assignedClass?.name
        .toLowerCase()
        .includes(searchText) ||
      teacher.subjects.some((subject) =>
        subject.name.toLowerCase().includes(searchText)
      )
    );
  });

  function openAdd() {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
    });

    setActive(null);
    setMode("add");
  }

  function openEdit(teacher: Teacher) {
    setForm({
      name: teacher.user.name,
      email: teacher.user.email,
      phone: teacher.user.phone || "",
      password: "",
    });

    setActive(teacher);
    setMode("edit");
  }

  function openView(teacher: Teacher) {
    setActive(teacher);
    setMode("view");
  }

  function openDelete(teacher: Teacher) {
    setActive(teacher);
    setMode("delete");
  }

  function closeModal() {
    setMode(null);
    setActive(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("Please enter teacher name.", "error");
      return;
    }

    if (!form.email.trim()) {
      showToast("Please enter teacher email.", "error");
      return;
    }

    if (mode === "add" && form.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    try {
      if (mode === "add") {
        const response = await fetch("/api/teachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            password: form.password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to create teacher"
          );
        }

        showToast(
          `${form.name} was added successfully.`,
          "success"
        );
      }

      if (mode === "edit" && active) {
        const response = await fetch("/api/teachers", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacherId: active.id,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            password: form.password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to update teacher"
          );
        }

        showToast(
          `${form.name}'s profile was updated.`,
          "success"
        );
      }

      closeModal();
      await loadTeachers();
    } catch (error) {
      console.error("SAVE TEACHER ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
        "error"
      );
    }
  }

  async function handleDelete() {
    if (!active) return;

    try {
      const response = await fetch("/api/teachers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: active.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete teacher"
        );
      }

      showToast(
        `${active.user.name} was deleted successfully.`,
        "success"
      );

      closeModal();
      await loadTeachers();
    } catch (error) {
      console.error("DELETE TEACHER ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
        "error"
      );
    }
  }

  const columns: Column<Teacher>[] = [
    {
      header: "Teacher",
      accessor: (teacher) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar
            name={teacher.user.name}
            size="sm"
          />

          <div>
            <p className="font-medium text-ink">
              {teacher.user.name}
            </p>

            <p className="text-xs text-ink-soft/50">
              {teacher.user.email}
            </p>
          </div>
        </div>
      ),
    },

    {
      header: "Teacher ID",
      accessor: (teacher) => (
        <span className="text-ink-soft/70">
          {teacher.id}
        </span>
      ),
    },

    {
      header: "Subjects",
      accessor: (teacher) =>
        teacher.subjects.length
          ? teacher.subjects
              .map((subject) => subject.name)
              .join(", ")
          : "Not assigned",
    },

    {
      header: "Assigned Class",
      accessor: (teacher) =>
        teacher.assignedClass
          ? `${teacher.assignedClass.name} Â· Sec ${teacher.assignedClass.section}`
          : "Not assigned",
    },

    {
      header: "Status",
      accessor: (teacher) => (
        <StatusBadge
          status={
            teacher.user.status === "active"
              ? "active"
              : "inactive"
          }
        />
      ),
    },

    {
      header: "Actions",
      accessor: (teacher) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openView(teacher)}
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-sand-100 hover:text-ink"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => openEdit(teacher)}
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-sand-100 hover:text-ink"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => openDelete(teacher)}
            className="rounded-lg p-1.5 text-ink-soft/50 hover:bg-clay-100 hover:text-clay-600"
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
        title="Teachers"
        description={`${teachers.length} teaching staff`}
        actions={
          <Button
            icon={<Plus />}
            onClick={openAdd}
          >
            Add Teacher
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-soft/50 max-w-sm">
        <Search className="h-4 w-4" />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search teachers..."
          className="w-full bg-transparent outline-none placeholder:text-ink-soft/40 text-ink"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyField={(teacher) => teacher.id}
        emptyState={
          loading ? (
            <div className="py-8 text-center text-sm text-ink-soft/60">
              Loading teachers...
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No teachers found"
              description="Add a teacher to get started."
              action={
                <Button
                  icon={<Plus />}
                  onClick={openAdd}
                >
                  Add Teacher
                </Button>
              }
            />
          )
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        open={mode === "add" || mode === "edit"}
        onClose={closeModal}
        title={
          mode === "edit"
            ? "Edit Teacher"
            : "Add Teacher"
        }
        size="sm"
      >
        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          <TextField
            label="Full name"
            required
            value={form.name}
            placeholder="Enter teacher name"
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            placeholder="Enter email"
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <TextField
            label="Phone"
            value={form.phone}
            placeholder="Enter phone number"
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          {mode === "add" && (
            <TextField
              label="Password"
              type="password"
              required
              value={form.password}
              placeholder="Minimum 8 characters"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button type="submit">
              {mode === "edit"
                ? "Save Changes"
                : "Add Teacher"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={mode === "view"}
        onClose={closeModal}
        title="Teacher Profile"
        size="sm"
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <Avatar
                name={active.user.name}
                size="lg"
              />

              <div>
                <p className="font-display font-semibold text-ink">
                  {active.user.name}
                </p>

                <p className="text-sm text-ink-soft/55">
                  {active.user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/45">
                  Teacher ID
                </p>
                <p className="mt-0.5 font-medium text-ink break-all">
                  {active.id}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/45">
                  Phone
                </p>
                <p className="mt-0.5 font-medium text-ink">
                  {active.user.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/45">
                  Subjects
                </p>
                <p className="mt-0.5 font-medium text-ink">
                  {active.subjects.length
                    ? active.subjects
                        .map(
                          (subject) => subject.name
                        )
                        .join(", ")
                    : "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/45">
                  Assigned Class
                </p>
                <p className="mt-0.5 font-medium text-ink">
                  {active.assignedClass
                    ? `${active.assignedClass.name} Â· Sec ${active.assignedClass.section}`
                    : "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/45">
                  Status
                </p>

                <div className="mt-1">
                  <StatusBadge
                    status={
                      active.user.status ===
                      "active"
                        ? "active"
                        : "inactive"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={mode === "delete"}
        onClose={closeModal}
        title="Delete Teacher"
        size="sm"
      >
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Are you sure you want to delete{" "}
              <strong className="text-ink">
                {active.user.name}
              </strong>
              ?
            </p>

            <p className="text-xs text-ink-soft/60">
              If this teacher has attendance records,
              the database will prevent deletion.
            </p>

            <div className="flex justify-end gap-2.5">
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
              >
                Delete Teacher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


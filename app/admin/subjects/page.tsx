"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";

type Teacher = {
  id: string;
  user?: {
    name: string;
  };
};

type SchoolClass = {
  id: string;
  name: string;
  section: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  teacherId?: string | null;
  classId?: string | null;
  teacher?: {
    id: string;
    user?: {
      name: string;
    };
  } | null;
  schoolClass?: SchoolClass | null;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [subjectsResponse, teachersResponse, classesResponse] =
        await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/teachers"),
          fetch("/api/classes"),
        ]);

      const subjectsData = await subjectsResponse.json();
      const teachersData = await teachersResponse.json();
      const classesData = await classesResponse.json();

      if (subjectsData.success) {
        setSubjects(subjectsData.subjects || []);
      }

      if (teachersData.success) {
        setTeachers(teachersData.teachers || []);
      }

      if (classesData.success) {
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error("LOAD SUBJECTS ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName("");
    setCode("");
    setTeacherId("");
    setClassId("");
    setEditingId(null);
  }

  function openAddModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditModal(subject: Subject) {
    setEditingId(subject.id);
    setName(subject.name);
    setCode(subject.code);
    setTeacherId(subject.teacherId || "");
    setClassId(subject.classId || "");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    resetForm();
  }

  async function saveSubject(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      alert("Subject name and code are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        teacherId: teacherId || null,
        classId: classId || null,
      };

      const response = await fetch(
        editingId
          ? `/api/subjects/${editingId}`
          : "/api/subjects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to save subject.");
        return;
      }

      setShowModal(false);
      resetForm();

      await loadData();
    } catch (error) {
      console.error("SAVE SUBJECT ERROR:", error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubject(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete subject.");
        return;
      }

      await loadData();
    } catch (error) {
      console.error("DELETE SUBJECT ERROR:", error);
      alert("Something went wrong.");
    }
  }

  const filteredSubjects = subjects.filter((subject) => {
    const query = search.toLowerCase();

    return (
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query) ||
      (subject.teacher?.user?.name || "")
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-sand-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-teal-700" />

              <h1 className="text-2xl font-semibold text-ink">
                Subjects
              </h1>
            </div>

            <p className="mt-1 text-sm text-ink-soft/60">
              Manage subjects, teachers and classes.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        </div>

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />

          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          {loading ? (
            <div className="p-8 text-center text-sm text-ink-soft/60">
              Loading subjects...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-ink-soft/30" />

              <p className="mt-3 text-sm font-medium text-ink">
                No subjects found
              </p>

              <p className="mt-1 text-sm text-ink-soft/50">
                Add your first subject to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-line bg-sand-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                      Subject
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                      Code
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                      Teacher
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                      Class
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-line last:border-0 hover:bg-sand-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-ink">
                          {subject.name}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-sand-100 px-2 py-1 text-xs font-medium text-ink-soft">
                          {subject.code}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-ink-soft">
                        {subject.teacher?.user?.name || "Not assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-ink-soft">
                        {subject.schoolClass
                          ? `${subject.schoolClass.name} - ${subject.schoolClass.section}`
                          : "Not assigned"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(subject)}
                            className="rounded-lg p-2 text-ink-soft/60 hover:bg-teal-50 hover:text-teal-700"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => deleteSubject(subject.id)}
                            className="rounded-lg p-2 text-ink-soft/60 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {editingId ? "Edit Subject" : "Add Subject"}
                </h2>

                <p className="mt-1 text-xs text-ink-soft/50">
                  Enter subject details below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-ink-soft/50 hover:bg-sand-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveSubject} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Subject Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Subject Code
                </label>

                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. DSA101"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Teacher
                </label>

                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Not assigned</option>

                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user?.name || "Unnamed Teacher"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Class
                </label>

                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Not assigned</option>

                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name} - {schoolClass.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Subject"
                      : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
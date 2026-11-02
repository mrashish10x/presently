"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Student = {
  id: string;
  rollNo: string;
  guardianName: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
  };
  schoolClass: {
    id: string;
    name: string;
    section: string;
  };
};

type ClassItem = {
  id: string;
  name: string;
  section: string;
};

type FormData = {
  name: string;
  email: string;
  password: string;
  rollNo: string;
  classId: string;
  guardianName: string;
  phone: string;
};

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  rollNo: "",
  classId: "",
  guardianName: "",
  phone: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<Student | null>(null);

  const [form, setForm] =
    useState<FormData>(emptyForm);

  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [studentsResponse, classesResponse] =
        await Promise.all([
          fetch("/api/students"),
          fetch("/api/classes"),
        ]);

      const studentsData =
        await studentsResponse.json();

      const classesData =
        await classesResponse.json();

      setStudents(studentsData.students || []);
      setClasses(classesData.classes || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.user.name
          .toLowerCase()
          .includes(query) ||
        student.user.email
          .toLowerCase()
          .includes(query) ||
        student.rollNo
          .toLowerCase()
          .includes(query) ||
        `${student.schoolClass.name} ${student.schoolClass.section}`
          .toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);

  function openAddModal() {
    setEditingStudent(null);
    setForm(emptyForm);
    setMessage("");
    setShowModal(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);

    setForm({
      name: student.user.name,
      email: student.user.email,
      password: "",
      rollNo: student.rollNo,
      classId: student.schoolClass.id,
      guardianName:
        student.guardianName || "",
      phone: student.user.phone || "",
    });

    setMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setMessage("");
  }

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Please enter student name.");
      return;
    }

    if (!form.email.trim()) {
      setMessage("Please enter email.");
      return;
    }

    if (!form.rollNo.trim()) {
      setMessage("Please enter roll number.");
      return;
    }

    if (!form.classId) {
      setMessage("Please select a class.");
      return;
    }

    if (!editingStudent && !form.password.trim()) {
      setMessage("Please enter a password.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      if (editingStudent) {
        const response = await fetch(
          "/api/students",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: editingStudent.id,
              name: form.name,
              email: form.email,
              rollNo: form.rollNo,
              classId: form.classId,
              guardianName:
                form.guardianName,
              phone: form.phone,
              ...(form.password
                ? {
                    password: form.password,
                  }
                : {}),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update student."
          );
        }
      } else {
        const response = await fetch(
          "/api/students",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
              rollNo: form.rollNo,
              classId: form.classId,
              guardianName:
                form.guardianName,
              phone: form.phone,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create student."
          );
        }
      }

      await loadData();

      setShowModal(false);
      setEditingStudent(null);
      setForm(emptyForm);

      setMessage(
        editingStudent
          ? "Student updated successfully."
          : "Student added successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(
    student: Student
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.user.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/students?id=${student.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete student."
        );
      }

      await loadData();
      setMessage("Student deleted successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete student."
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Students
          </h1>

          <p className="mt-1 text-sm text-ink-soft">
            Manage students and their class
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* Message */}
      {message && !showModal && (
        <div className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm text-ink shadow-sm">
          {message}
        </div>
      )}

      {/* Search + count */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search students..."
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-black/30"
            />
          </div>

          <p className="text-sm text-ink-soft">
            {filteredStudents.length} student
            {filteredStudents.length !== 1
              ? "s"
              : ""}
          </p>
        </div>
      </div>

      {/* Students */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center">
            <p className="text-sm text-ink-soft">
              Loading students...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-ink-soft">
              {search
                ? "No students found."
                : "No students added yet."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
              >
                Add First Student
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 text-left">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Student
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Roll No
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Class
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Phone
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.id}
                        className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
                              {student.user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">
                                {student.user.name}
                              </p>

                              <p className="truncate text-xs text-ink-soft">
                                {student.user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-ink">
                          {student.rollNo}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium text-ink">
                            {student.schoolClass.name}{" "}
                            -{" "}
                            {student.schoolClass.section}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-ink-soft">
                          {student.user.phone ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              student.user.status ===
                              "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {student.user.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  student
                                )
                              }
                              className="rounded-lg border border-black/10 p-2 text-ink-soft hover:bg-black/5 hover:text-ink"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteStudent(
                                  student
                                )
                              }
                              className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-black/5 md:hidden">
              {filteredStudents.map(
                (student) => (
                  <div
                    key={student.id}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
                          {student.user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {student.user.name}
                          </p>

                          <p className="truncate text-xs text-ink-soft">
                            {student.user.email}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {student.user.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-ink-soft">
                          Roll No
                        </p>
                        <p className="mt-1 font-medium text-ink">
                          {student.rollNo}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-ink-soft">
                          Class
                        </p>
                        <p className="mt-1 font-medium text-ink">
                          {student.schoolClass.name}{" "}
                          -{" "}
                          {student.schoolClass.section}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-ink-soft">
                          Phone
                        </p>
                        <p className="mt-1 font-medium text-ink">
                          {student.user.phone ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-ink-soft">
                          Guardian
                        </p>
                        <p className="mt-1 font-medium text-ink">
                          {student.guardianName ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(student)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-ink hover:bg-black/5"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteStudent(student)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-black/5 p-5">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p className="mt-1 text-xs text-ink-soft">
                  {editingStudent
                    ? "Update student information."
                    : "Add a new student to the system."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-ink-soft hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Student Name *
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter student name"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Email *
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateForm(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>

                {/* Roll */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Roll Number *
                  </label>

                  <input
                    type="text"
                    value={form.rollNo}
                    onChange={(e) =>
                      updateForm(
                        "rollNo",
                        e.target.value
                      )
                    }
                    placeholder="Enter roll number"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Class *
                  </label>

                  <select
                    value={form.classId}
                    onChange={(e) =>
                      updateForm(
                        "classId",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name} -{" "}
                        {item.section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      updateForm(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>

                {/* Guardian */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Guardian Name
                  </label>

                  <input
                    type="text"
                    value={form.guardianName}
                    onChange={(e) =>
                      updateForm(
                        "guardianName",
                        e.target.value
                      )
                    }
                    placeholder="Enter guardian name"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-ink">
                    {editingStudent
                      ? "New Password (optional)"
                      : "Password *"}
                  </label>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      updateForm(
                        "password",
                        e.target.value
                      )
                    }
                    placeholder={
                      editingStudent
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>
              </div>

              {/* Error / success */}
              {message && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-black/5 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-ink hover:bg-black/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingStudent
                    ? "Update Student"
                    : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
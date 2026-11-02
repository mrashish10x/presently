"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

type SchoolClass = { id: string; name: string; section: string };

export default function AddStudentPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNo: "",
    classId: "",
    guardianName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/students")
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load classes");
        setClasses(result.classes || []);
      })
      .catch(error => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field: string, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to add student");

      setSuccess(true);
      setMessage("Student added successfully!");
      setForm({
        name: "", email: "", password: "", rollNo: "",
        classId: "", guardianName: "", phone: "",
      });
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add Student" description="Register a student in your college." />
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Student Name *</label>
            <input required value={form.name} onChange={e => update("name", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="Full name" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email *</label>
            <input required type="email" value={form.email} onChange={e => update("email", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="student@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password *</label>
            <input required minLength={8} type="password" value={form.password} onChange={e => update("password", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Roll Number *</label>
            <input required value={form.rollNo} onChange={e => update("rollNo", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="Roll number" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Class *</label>
            <select required value={form.classId} onChange={e => update("classId", e.target.value)}
              disabled={loading || classes.length === 0}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
              <option value="">{loading ? "Loading classes..." : "Select class"}</option>
              {classes.map(item => (
                <option key={item.id} value={item.id}>{item.name} - {item.section}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Phone</label>
            <input value={form.phone} onChange={e => update("phone", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="Phone number" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">Guardian Name</label>
            <input value={form.guardianName} onChange={e => update("guardianName", e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" placeholder="Guardian name" />
          </div>
        </div>

        {classes.length === 0 && !loading && (
          <p className="text-sm text-amber-600">No classes found. Please create a class first.</p>
        )}

        {message && <p className={`text-sm ${success ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        <Button type="submit" disabled={saving || loading || classes.length === 0}>
          {saving ? "Adding..." : "Add Student"}
        </Button>
      </form>
    </div>
  );
}

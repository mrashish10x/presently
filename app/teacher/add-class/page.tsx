"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export default function AddClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, section }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create class");

      setSuccess(true);
      setMessage("Class created successfully!");
      setName("");
      setSection("");
      router.refresh();
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add Class" description="Create a new class in your college." />
      <form onSubmit={submit} className="max-w-xl space-y-5 rounded-2xl border border-line bg-white p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Class Name *</label>
          <input required value={name} onChange={e => setName(e.target.value)}
            placeholder="Example: B.Tech 1st Year"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/40" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Section *</label>
          <input required value={section} onChange={e => setSection(e.target.value)}
            placeholder="Example: A"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/40" />
        </div>
        {message && <p className={`text-sm ${success ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Class"}</Button>
      </form>
    </div>
  );
}

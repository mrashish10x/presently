"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";

type Profile = { id: string; rollNo: string; guardianName: string | null; user: { name: string; email: string; phone: string | null; avatarColor: string | null }; schoolClass: { name: string; section: string } };

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/student/profile").then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load profile");
      setProfile(data.student); setName(data.student.user.name); setPhone(data.student.user.phone ?? ""); setGuardianName(data.student.guardianName ?? "");
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/student/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, guardianName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Profile update failed");
      setProfile(data.student); setMessage("Profile updated successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update profile"); }
    finally { setSaving(false); }
  }

  return <div>
    <PageHeader title="Profile" description="Your personal and academic details." />
    {loading ? <p className="rounded-xl border border-line bg-white p-5 text-sm">Loading profile…</p> : !profile ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message || "Student profile not found."}</p> : <div className="max-w-xl rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-4 border-b border-line pb-6"><Avatar name={profile.user.name} color={profile.user.avatarColor ?? "#0f766e"} size="lg" /><div><p className="font-display font-semibold text-ink">{profile.user.name}</p><p className="text-sm text-ink-soft/60">{profile.user.email}</p><p className="mt-1 text-xs text-ink-soft/50">{profile.schoolClass.name} · Section {profile.schoolClass.section} · Roll No. {profile.rollNo}</p></div></div>
      <form onSubmit={save} className="space-y-4 pt-6">
        <label className="block text-sm font-medium">Full name<input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" /></label>
        <label className="block text-sm font-medium">Email<input readOnly value={profile.user.email} className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2 text-ink-soft" /><span className="text-xs text-ink-soft/60">Email changes require a separate verification process.</span></label>
        <label className="block text-sm font-medium">Phone<input maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" /></label>
        <label className="block text-sm font-medium">Guardian name<input maxLength={80} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" /></label>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
        <button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
      </form>
    </div>}
  </div>;
}

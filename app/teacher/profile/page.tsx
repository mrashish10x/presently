"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TextField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
type Profile = { name: string; email: string; phone: string; assignedClass: string; subjects: { id: string; name: string; code: string }[] };
export default function TeacherProfilePage() {
  const { showToast } = useToast(); const [profile, setProfile] = useState<Profile | null>(null); const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { fetch("/api/teacher/profile", { cache: "no-store" }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.message || "Unable to load profile"); setProfile(data.profile); setName(data.profile.name); setPhone(data.profile.phone); }).catch((e) => showToast(e instanceof Error ? e.message : "Unable to load profile", "error")).finally(() => setLoading(false)); }, [showToast]);
  async function save(e: React.FormEvent) { e.preventDefault(); setSaving(true); try { const r = await fetch("/api/teacher/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) }); const data = await r.json(); if (!r.ok) throw new Error(data.message || "Unable to save profile"); setProfile((p) => p ? { ...p, ...data.profile } : p); showToast("Profile updated.", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Unable to save profile", "error"); } finally { setSaving(false); } }
  if (loading) return <div className="rounded-xl border bg-white p-6">Loading profile…</div>;
  if (!profile) return <div className="rounded-xl border bg-white p-6">Profile unavailable. Please refresh or contact your administrator.</div>;
  return <div><PageHeader title="Profile" description="Your account and teaching details." /><div className="max-w-lg rounded-2xl border border-line bg-white p-6"><div className="flex items-center gap-4 border-b border-line pb-6"><Avatar name={profile.name} size="lg" /><div><p className="font-display font-semibold text-ink">{profile.name}</p><p className="text-sm text-ink-soft/55">{profile.email}</p><div className="mt-2 flex flex-wrap gap-1.5">{profile.subjects.map((s) => <Badge key={s.id} tone="teal">{s.name}</Badge>)}</div></div></div><form onSubmit={save} className="space-y-4 pt-6"><TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} /><TextField label="Email" type="email" value={profile.email} disabled /><TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} /><TextField label="Assigned Class" value={profile.assignedClass} disabled /><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button></form></div></div>;
}

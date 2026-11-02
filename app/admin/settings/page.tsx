"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw, Save, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

type SettingsData = { admin: { name: string; email: string; phone: string | null; role: string }; school: { name: string; slug: string; status: string; createdAt: string } };
export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { const res = await fetch("/api/admin/settings", { cache: "no-store" }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "Unable to load settings."); setData(json); setName(json.admin.name); setPhone(json.admin.phone || ""); setSchoolName(json.school.name); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load settings."); }
    finally { setLoading(false); }
  }
  async function save() {
    setSaving(true); setMessage(""); setError("");
    try { const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, schoolName }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "Unable to save settings."); setData(json); setName(json.admin.name); setPhone(json.admin.phone || ""); setSchoolName(json.school.name); setMessage("Settings saved successfully."); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="flex min-h-60 items-center justify-center gap-2 text-sm"><RefreshCw className="animate-spin" size={17}/> Loading settings…</div>;
  return <div className="space-y-5">
    <PageHeader title="Settings" description="Manage your admin profile and college information." actions={<button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><RefreshCw size={15}/> Refresh</button>} />
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {data && <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-line bg-white p-5"><div className="flex items-center gap-2 font-semibold"><UserRound size={18}/> Admin Profile</div>
        <label className="block text-sm">Full name<input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={name} maxLength={100} onChange={e=>setName(e.target.value)}/></label>
        <label className="block text-sm">Email (login ID)<input className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2" value={data.admin.email} disabled/><span className="mt-1 block text-xs text-ink-soft/50">Email changes are disabled here to protect account verification.</span></label>
        <label className="block text-sm">Phone<input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={phone} maxLength={30} onChange={e=>setPhone(e.target.value)}/></label>
        <label className="block text-sm">Role<input className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2" value={data.admin.role} disabled/></label>
      </section>
      <section className="space-y-4 rounded-xl border border-line bg-white p-5"><div className="flex items-center gap-2 font-semibold"><Building2 size={18}/> College Information</div>
        <label className="block text-sm">College name<input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={schoolName} maxLength={150} onChange={e=>setSchoolName(e.target.value)}/></label>
        <label className="block text-sm">College identifier<input className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2" value={data.school.slug} disabled/></label>
        <label className="block text-sm">Account status<input className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2 capitalize" value={data.school.status} disabled/></label>
        <label className="block text-sm">Registered on<input className="mt-1 w-full rounded-lg border border-line bg-sand-50 px-3 py-2" value={new Date(data.school.createdAt).toLocaleDateString()} disabled/></label>
      </section>
    </div>}
    <button onClick={save} disabled={saving || !data} className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Save size={16}/>{saving?"Saving…":"Save changes"}</button>
    <p className="text-xs text-ink-soft/50">Appearance and notification preferences are not persisted yet; they are intentionally omitted rather than showing unsaved demo controls.</p>
  </div>;
}

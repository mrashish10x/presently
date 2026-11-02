"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

type Item = { id: string; title: string; description: string; type: string; read: boolean; createdAt: string };
export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { const res = await fetch("/api/admin/notifications", { cache: "no-store" }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "Unable to load notifications."); setItems(json.notifications || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load notifications."); }
    finally { setLoading(false); }
  }
  async function markRead(id?: string) {
    const res = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : {}) });
    const json = await res.json(); if (!res.ok) { setError(json.error || "Unable to update notifications."); return; }
    setItems(prev => prev.map(n => !id || n.id === id ? { ...n, read: true } : n));
  }
  useEffect(() => { void load(); }, []);
  const unread = items.filter(n => !n.read).length;
  return <div className="space-y-5">
    <PageHeader title="Notifications" description={`${unread} unread notifications`} actions={<div className="flex gap-2"><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><RefreshCw size={15}/> Refresh</button><button onClick={() => void markRead()} disabled={!unread} className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm text-white disabled:opacity-50"><CheckCheck size={15}/> Mark all read</button></div>} />
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-hidden rounded-xl border border-line bg-white divide-y divide-line">
      {loading ? <p className="p-8 text-center text-sm text-ink-soft/60">Loading notifications…</p> : items.length === 0 ? <div className="p-10 text-center"><Bell className="mx-auto mb-3 text-ink-soft/40"/><p className="font-medium">No notifications yet</p><p className="mt-1 text-sm text-ink-soft/60">New notifications for your account will appear here.</p></div> : items.map(n=><button key={n.id} onClick={()=>!n.read && void markRead(n.id)} className={`flex w-full items-start gap-4 p-5 text-left hover:bg-sand-50 ${!n.read?"bg-teal-50/40":""}`}><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read?"bg-slate-200":"bg-teal-700"}`}/><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-medium">{n.title}</span><span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs capitalize">{n.type}</span></span><span className="mt-1 block text-sm text-ink-soft/70">{n.description}</span><span className="mt-2 block text-xs text-ink-soft/45">{new Date(n.createdAt).toLocaleString()}</span></span></button>)}
    </div>
  </div>;
}

"use client";

import { useEffect, useState } from "react";
import { Bell, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type NotificationItem = { id: string; title: string; description: string; createdAt: string; read: boolean; type: string };
const ICONS = { info: Info, warning: AlertTriangle, success: CheckCircle2 } as const;
const TONE = { info: "bg-sand-100 text-ink-soft", warning: "bg-gold-100 text-gold-600", success: "bg-teal-100 text-teal-800" } as const;

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/student/notifications").then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load notifications");
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load notifications")).finally(() => setLoading(false));
  }, []);

  async function markRead(item: NotificationItem) {
    if (item.read) return;
    const response = await fetch("/api/student/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
    if (!response.ok) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
  }

  return <div><PageHeader title="Notifications" description={`${items.filter((n) => !n.read).length} unread notifications`} />
    {loading ? <p className="rounded-xl border border-line bg-white p-5 text-sm">Loading notifications…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : items.length === 0 ? <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." /> : <div className="overflow-hidden rounded-2xl border border-line bg-white divide-y divide-line">{items.map((item) => {
      const type = item.type.toLowerCase() as keyof typeof ICONS;
      const Icon = ICONS[type] ?? Info;
      const tone = TONE[type] ?? TONE.info;
      return <button key={item.id} onClick={() => markRead(item)} className={cn("flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-sand-50", !item.read && "bg-teal-50/40")}>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="h-4.5 w-4.5" /></div>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-ink">{item.title}</p>{!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-teal-600" />}</div><p className="mt-0.5 text-sm text-ink-soft/60">{item.description}</p><p className="mt-1.5 text-xs text-ink-soft/40">{new Date(item.createdAt).toLocaleString()}</p></div>
      </button>;
    })}</div>}
  </div>;
}

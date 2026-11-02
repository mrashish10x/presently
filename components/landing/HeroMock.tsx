import { Check, X, Clock3 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const ROWS = [
  { name: "Aarav Sharma", color: "#1F8460", status: "present" as const },
  { name: "Priya Singh", color: "#B77A2C", status: "present" as const },
  { name: "Rahul Kumar", color: "#2447A8", status: "late" as const },
  { name: "Ananya Verma", color: "#B34A3A", status: "absent" as const },
  { name: "Rohit Yadav", color: "#6B4FA0", status: "present" as const },
];

const ICON = {
  present: <Check className="h-3.5 w-3.5" />,
  absent: <X className="h-3.5 w-3.5" />,
  late: <Clock3 className="h-3.5 w-3.5" />,
};

const STYLE = {
  present: "bg-teal-100 text-teal-800",
  absent: "bg-clay-100 text-clay-600",
  late: "bg-gold-100 text-gold-600",
};

export function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-teal-100 via-transparent to-gold-100 blur-2xl opacity-70" />
      <div className="relative rounded-2xl border border-line bg-white p-5 shadow-xl shadow-ink/10 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-ink">Data Structures</p>
            <p className="text-xs text-ink-soft/50">B.Tech IT · 2nd Year · Sec A</p>
          </div>
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-medium text-teal-800">
            Live
          </span>
        </div>

        <div className="space-y-1.5">
          {ROWS.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-sand-50"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={r.name} color={r.color} size="sm" />
                <span className="text-[13px] font-medium text-ink">{r.name}</span>
              </div>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${STYLE[r.status]}`}
              >
                {ICON[r.status]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-sand-50 border border-line px-3.5 py-3">
          <div>
            <p className="text-[11px] text-ink-soft/50">Today&apos;s attendance</p>
            <p className="font-display text-lg font-semibold text-ink">92%</p>
          </div>
          <div className="h-9 w-20 flex items-end gap-1">
            {[60, 80, 55, 90, 75, 95, 70].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-teal-600/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -right-6 -bottom-6 hidden sm:block rounded-xl border border-line bg-white p-3.5 shadow-lg shadow-ink/10">
        <p className="text-[11px] text-ink-soft/50">Reports generated</p>
        <p className="font-display text-lg font-semibold text-ink">1,204</p>
      </div>
    </div>
  );
}

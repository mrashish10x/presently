import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function DashboardCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  tone = "ink",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  tone?: "ink" | "teal" | "gold" | "clay";
}) {
  const toneClasses: Record<string, string> = {
    ink: "bg-sand-100 text-ink-soft",
    teal: "bg-teal-100 text-teal-800",
    gold: "bg-gold-100 text-gold-600",
    clay: "bg-clay-100 text-clay-600",
  };

  const positive = (trend ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-soft/70">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold text-ink">{value}</div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "font-medium",
              positive ? "text-teal-700" : "text-clay-600"
            )}
          >
            {positive ? "+" : ""}
            {trend}%
          </span>
          <span className="text-ink-soft/50">{trendLabel ?? "vs last week"}</span>
        </div>
      )}
    </div>
  );
}

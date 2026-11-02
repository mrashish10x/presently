import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "gold" | "clay" | "neutral" | "info";

const TONES: Record<BadgeTone, string> = {
  teal: "bg-teal-100 text-teal-800",
  gold: "bg-gold-100 text-gold-600",
  clay: "bg-clay-100 text-clay-600",
  neutral: "bg-sand-200 text-ink-soft",
  info: "bg-blue-50 text-blue-700",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "teal" && "bg-teal-600",
            tone === "gold" && "bg-gold-500",
            tone === "clay" && "bg-clay-500",
            tone === "neutral" && "bg-ink-soft/60",
            tone === "info" && "bg-blue-600"
          )}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge tone={status === "active" ? "teal" : "clay"} dot>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}

export function AttendanceStatusBadge({
  status,
}: {
  status: "present" | "absent" | "late";
}) {
  const map = {
    present: { tone: "teal" as const, label: "Present" },
    absent: { tone: "clay" as const, label: "Absent" },
    late: { tone: "gold" as const, label: "Late" },
  };
  const { tone, label } = map[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

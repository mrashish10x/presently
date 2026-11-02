import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100 border border-line">
        <Icon className="h-6 w-6 text-ink-soft/50" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft/60">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

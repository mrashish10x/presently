import { initials, cn } from "@/lib/utils";

export function Avatar({
  name,
  color = "#1F8460",
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  }[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        sizeClass,
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </div>
  );
}

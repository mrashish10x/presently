import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS: Record<string, string> = {
  primary:
    "bg-teal-800 text-white hover:bg-teal-900 shadow-sm shadow-teal-900/10",
  secondary:
    "bg-sand-100 text-ink hover:bg-sand-200 border border-line",
  outline:
    "bg-transparent text-ink border border-line hover:bg-sand-100",
  ghost: "bg-transparent text-ink-soft hover:bg-sand-100",
  danger: "bg-clay-600 text-white hover:bg-clay-500",
};

const SIZES: Record<string, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2 gap-2 rounded-lg",
  lg: "text-sm px-5 py-2.5 gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      )}
      {children}
    </button>
  );
}

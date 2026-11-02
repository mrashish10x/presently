"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileBarChart,
  Bell,
  Settings,
  History,
  UserCircle,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

const ICONS = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileBarChart,
  Bell,
  Settings,
  History,
  UserCircle,
  BookMarked,
};

export function Sidebar({
  items,
  roleLabel,
  open,
  onClose,
}: {
  items: NavItem[];
  roleLabel: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col bg-teal-950 text-white/90">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
            <CalendarCheck2 className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="font-display font-semibold text-white text-[15px]">
            Presently
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden rounded-md p-1 text-white/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pb-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">
          {roleLabel}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-3 space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/teacher" &&
              item.href !== "/student" &&
              pathname.startsWith(item.href));

          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/85"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal-400" />
              )}
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-2">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 hover:bg-white/5 hover:text-white/85"
        >
          <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} />
          Log out
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </div>
      </div>
    </>
  );
}
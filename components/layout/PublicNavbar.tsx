"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck2, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-sand-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="#home" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800">
            <CalendarCheck2 className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="font-display text-[17px] font-semibold text-ink">Presently</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-soft/70 hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 transition-colors"
          >
            Log in
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden rounded-lg p-2 text-ink hover:bg-sand-100"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-sand-50 px-5 py-4 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-ink-soft/80"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            className="block rounded-lg bg-teal-800 px-4 py-2.5 text-center text-sm font-medium text-white"
          >
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}

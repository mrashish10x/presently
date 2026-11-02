"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { NOTIFICATIONS } from "@/data/mock";
import { cn } from "@/lib/utils";

export function Topbar({
  onMenuClick,
  title,
  user,
  profileHref,
}: {
  onMenuClick: () => void;
  title: string;
  user: { name: string; role: string; avatarColor: string };
  profileHref: string;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-sand-50/90 backdrop-blur px-4 py-3.5 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-1.5 text-ink-soft hover:bg-sand-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-display font-semibold text-ink text-base lg:text-lg mr-2 hidden sm:block">
        {title}
      </h1>

      <div className="hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft/50 ml-2">
        <Search className="h-4 w-4" />
        <input
          placeholder="Search students, teachers, classes…"
          className="w-full bg-transparent outline-none placeholder:text-ink-soft/40 text-ink"
        />
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative rounded-lg p-2 text-ink-soft hover:bg-sand-100"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-clay-500 ring-2 ring-sand-50" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-line bg-white shadow-lg shadow-ink/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  <span className="text-xs text-teal-700 font-medium">{unread} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto scroll-thin">
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-line last:border-0",
                        !n.read && "bg-teal-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />}
                      </div>
                      <p className="text-xs text-ink-soft/60 mt-0.5 leading-relaxed">
                        {n.description}
                      </p>
                      <p className="text-[11px] text-ink-soft/40 mt-1.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-sand-100"
          >
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium text-ink">{user.name}</span>
              <span className="text-[11px] text-ink-soft/50">{user.role}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-soft/50 hidden sm:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-line bg-white shadow-lg shadow-ink/10 overflow-hidden py-1">
                <Link
                  href={profileHref}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-sand-50"
                >
                  <UserCircle className="h-4 w-4 text-ink-soft/60" />
                  My Profile
                </Link>
                <Link
                  href={profileHref}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-sand-50"
                >
                  <Settings className="h-4 w-4 text-ink-soft/60" />
                  Settings
                </Link>
                <div className="border-t border-line my-1" />
                <Link
                  href="/login"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-clay-600 hover:bg-sand-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

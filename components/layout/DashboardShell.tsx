"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "@/lib/nav";

export function DashboardShell({
  navItems,
  roleLabel,
  pageTitle,
  user,
  profileHref,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  pageTitle: string;
  user: { name: string; role: string; avatarColor: string };
  profileHref: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-sand-50">
      <Sidebar
        items={navItems}
        roleLabel={roleLabel}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          title={pageTitle}
          user={user}
          profileHref={profileHref}
        />
        <main className="flex-1 p-4 lg:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}

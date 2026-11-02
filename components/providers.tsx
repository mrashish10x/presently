"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { InstallButton } from "@/components/pwa/InstallButton";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
      <InstallButton />
    </ToastProvider>
  );
}
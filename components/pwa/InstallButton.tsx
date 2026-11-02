"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    try {
      if (sessionStorage.getItem("pwa-hide") === "1") setHidden(true);
    } catch {}

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || hidden || (!deferred && !isIos)) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setShowIosHelp(true);
    }
  }

  function dismiss() {
    setHidden(true);
    try { sessionStorage.setItem("pwa-hide", "1"); } catch {}
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl bg-teal-800 p-3 text-white shadow-xl">
        <Download className="h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          {showIosHelp ? (
            <span>Tap the Share button, then &quot;Add to Home Screen&quot;.</span>
          ) : (
            <span>Install Presently as an app</span>
          )}
        </div>
        {!showIosHelp && (
          <button onClick={install} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-teal-800">
            Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" className="p-1 opacity-80 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

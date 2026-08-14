"use client";

import { useEffect, useState } from "react";
import { getPendingSyncCount } from "@/db/database";
import { onlineManager } from "@/lib/online-manager";

type SyncStatus = "synced" | "pending" | "offline";

export function SyncIndicator() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [pendingCount, setPendingCount] = useState(0);

  // Hydration safe : rend identique au serveur tant que pas monté
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(async () => {
      const online = onlineManager.isOnline;

      if (!online) {
        setStatus("offline");
        setPendingCount(0);
        return;
      }

      const count = await getPendingSyncCount();
      setPendingCount(count);
      setStatus(count > 0 ? "pending" : "synced");
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || status === "synced") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-all ${
          status === "offline"
            ? "bg-warning-alert/15 text-warning-alert border border-warning-alert/30"
            : "bg-info-notice/15 text-info-notice border border-info-notice/30"
        }`}
      >
        {status === "offline" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8.5 5.5A11 11 0 0 1 21 16" />
            <path d="M3 8a15 15 0 0 1 11 5" />
            <path d="M5.5 12.5A7 7 0 0 1 17 16" />
            <path d="M8 16a3 3 0 0 1 5 2" />
            <line x1="12" x2="12.01" y1="19" y2="19" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}

        <span>
          {status === "offline"
            ? "Hors-ligne"
            : `${pendingCount} opération${pendingCount > 1 ? "s" : ""} en attente`}
        </span>
      </div>
    </div>
  );
}
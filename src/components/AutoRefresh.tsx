"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches server components on an interval (polling instead of WebSockets). */
export function AutoRefresh({ intervalMs, enabled = true }: { intervalMs: number; enabled?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, enabled]);
  return null;
}

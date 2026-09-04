"use client";

import { useEffect, useState } from "react";

// Red badge on the admin Moderation nav item showing total pending work.
// Refreshes every 60s; hidden when the queue is empty.
export function ModerationQueueBadge() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/moderation/count", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active) setTotal(typeof data.total === "number" ? data.total : 0);
        }
      } catch { /* sidebar badge is non-critical */ }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  if (total <= 0) return null;

  return (
    <span
      title="Pending moderation items"
      style={{
        marginLeft: "auto",
        fontSize: "0.625rem",
        fontWeight: 700,
        lineHeight: 1,
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "var(--glow-red)",
        borderRadius: "9999px",
        padding: "0.25rem 0.5rem",
        minWidth: "1.375rem",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}

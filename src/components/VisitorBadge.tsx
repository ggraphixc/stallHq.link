"use client";

import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";

interface VisitorBadgeProps {
  storeId: string;
  polling?: boolean;
}

export function VisitorBadge({ storeId, polling = true }: VisitorBadgeProps) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/visitors?store_id=${storeId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
      }
    } catch {
      // Silently fail
    }
  }, [storeId]);

  useEffect(() => {
    fetchCount();
    if (!polling) return;
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount, polling]);

  if (count === null) return null;

  return (
    <div className="badge badge-neutral">
      <Users className="w-3 h-3" />
      <span>{count.toLocaleString()} visitor{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

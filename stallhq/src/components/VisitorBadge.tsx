"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";

interface VisitorBadgeProps {
  storeId: string;
}

export function VisitorBadge({ storeId }: VisitorBadgeProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
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
    };

    fetchCount();
  }, [storeId]);

  if (count === null) return null;

  return (
    <div className="badge badge-neutral">
      <Users className="w-3 h-3" />
      <span>{count.toLocaleString()} visitor{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

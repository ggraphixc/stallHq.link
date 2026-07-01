"use client";

import { Users } from "lucide-react";
import { useRealtimeVisitors } from "@/hooks/useRealtimeVisitors";

interface VisitorBadgeProps {
  storeId: string;
}

export function VisitorBadge({ storeId }: VisitorBadgeProps) {
  const count = useRealtimeVisitors({ storeId });

  if (count === null) return null;

  return (
    <div className="badge badge-neutral">
      <Users className="w-3 h-3" />
      <span>{count.toLocaleString()} visitor{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

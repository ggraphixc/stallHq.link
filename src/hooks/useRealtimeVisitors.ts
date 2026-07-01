"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeVisitorsOptions {
  storeId: string;
  initialCount?: number;
}

export function useRealtimeVisitors({
  storeId,
  initialCount,
}: UseRealtimeVisitorsOptions) {
  const [count, setCount] = useState<number | null>(
    initialCount ?? null
  );
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Fetch initial count
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/analytics/visitors?store_id=${storeId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch {
        // silently fail
      }
    };
    fetchCount();
    return () => { cancelled = true; };
  }, [storeId]);

  // Subscribe to realtime inserts on analytics table
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`visitors:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newEvent = payload.new as { event_type?: string };
          if (newEvent?.event_type === "visit") {
            setCount((prev) => (prev ?? 0) + 1);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [storeId]);

  return count;
}

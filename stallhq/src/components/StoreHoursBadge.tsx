"use client";

import { StoreHours } from "@/types";
import { Clock } from "lucide-react";

interface StoreHoursBadgeProps {
  storeHours: StoreHours | null;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function getCurrentDay(): string {
  return DAY_KEYS[new Date().getDay()];
}

function isWithinHours(hours: StoreHours): boolean {
  const now = new Date();
  const currentDay = getCurrentDay();
  const dayHours = hours.days[currentDay as keyof typeof hours.days];

  if (dayHours.closed) return false;

  const [openMinutes] = hourstoMinutes(dayHours.open);
  const [closeMinutes] = hourstoMinutes(dayHours.close);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function hourstoMinutes(time: string): [number, number] {
  const [h, m] = time.split(":").map(Number);
  return [h * 60 + m, m];
}

export function StoreHoursBadge({ storeHours }: StoreHoursBadgeProps) {
  if (!storeHours || !storeHours.enabled) return null;

  const isOpen = isWithinHours(storeHours);
  const currentDay = getCurrentDay();
  const todayHours = storeHours.days[currentDay as keyof typeof storeHours.days];

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Clock className="w-3.5 h-3.5" />
      <span className={isOpen ? "text-[var(--glow-green)]" : "text-[var(--glow-red)]"}>
        {isOpen ? "Open now" : "Closed"}
      </span>
      {!todayHours.closed && (
        <span className="text-[var(--text-muted)]">
          · {todayHours.open} – {todayHours.close}
        </span>
      )}
    </div>
  );
}

export function StoreHoursDetail({ storeHours }: StoreHoursBadgeProps) {
  if (!storeHours || !storeHours.enabled) return null;

  const currentDay = getCurrentDay();

  return (
    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-[var(--glow-purple)]" />
        <h4 className="text-sm font-medium">Store Hours</h4>
      </div>
      <div className="space-y-1">
        {Object.entries(DAY_LABELS).map(([key, label]) => {
          const dayHours = storeHours.days[key as keyof typeof storeHours.days];
          const isToday = key === currentDay;

          return (
            <div
              key={key}
              className={`flex justify-between text-xs py-0.5 ${
                isToday ? "text-[var(--glow-purple)] font-medium" : ""
              }`}
            >
              <span>{label}</span>
              <span>
                {dayHours.closed ? "Closed" : `${dayHours.open} – ${dayHours.close}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

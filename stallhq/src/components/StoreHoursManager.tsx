"use client";

import { useState } from "react";
import { StoreHours } from "@/types";
import { Clock, RotateCcw } from "lucide-react";

interface StoreHoursManagerProps {
  hours: StoreHours | null;
  onChange: (hours: StoreHours) => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DEFAULT_HOURS: StoreHours = {
  enabled: true,
  days: {
    mon: { open: "09:00", close: "17:00", closed: false },
    tue: { open: "09:00", close: "17:00", closed: false },
    wed: { open: "09:00", close: "17:00", closed: false },
    thu: { open: "09:00", close: "17:00", closed: false },
    fri: { open: "09:00", close: "17:00", closed: false },
    sat: { open: "10:00", close: "14:00", closed: false },
    sun: { open: "00:00", close: "00:00", closed: true },
  },
};

export function StoreHoursManager({ hours, onChange }: StoreHoursManagerProps) {
  const [localHours, setLocalHours] = useState<StoreHours>(
    hours || DEFAULT_HOURS
  );

  const updateDay = (
    day: keyof StoreHours["days"],
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    const updated = {
      ...localHours,
      days: {
        ...localHours.days,
        [day]: {
          ...localHours.days[day],
          [field]: value,
        },
      },
    };
    setLocalHours(updated);
    onChange(updated);
  };

  const toggleEnabled = () => {
    const updated = { ...localHours, enabled: !localHours.enabled };
    setLocalHours(updated);
    onChange(updated);
  };

  const resetToDefault = () => {
    setLocalHours(DEFAULT_HOURS);
    onChange(DEFAULT_HOURS);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--glow-purple)]" />
          <h3 className="font-medium">Store Hours</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleEnabled}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              localHours.enabled ? "bg-[var(--glow-green)]" : "bg-[var(--bg-card)]"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                localHours.enabled ? "left-5.5 translate-x-0" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {localHours.enabled && (
        <div className="space-y-2">
          {Object.entries(DAY_LABELS).map(([key, label]) => {
            const day = key as keyof StoreHours["days"];
            const dayHours = localHours.days[day];

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-card)]"
              >
                <label className="flex items-center gap-2 w-24">
                  <input
                    type="checkbox"
                    checked={!dayHours.closed}
                    onChange={(e) => updateDay(day, "closed", !e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--glow-purple)] focus:ring-[var(--glow-purple)]"
                  />
                  <span
                    className={`text-sm ${
                      dayHours.closed ? "text-[var(--text-muted)]" : ""
                    }`}
                  >
                    {label}
                  </span>
                </label>

                {!dayHours.closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => updateDay(day, "open", e.target.value)}
                      className="ambient-input !py-1 !px-2 text-sm w-32"
                    />
                    <span className="text-[var(--text-muted)]">to</span>
                    <input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => updateDay(day, "close", e.target.value)}
                      className="ambient-input !py-1 !px-2 text-sm w-32"
                    />
                  </div>
                )}

                {dayHours.closed && (
                  <span className="text-sm text-[var(--text-muted)] italic">
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        {localHours.enabled
          ? "Customers will see your store hours on your storefront."
          : "Store hours are hidden from your storefront."}
      </p>
    </div>
  );
}

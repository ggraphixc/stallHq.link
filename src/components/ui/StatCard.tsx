import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent?: "purple" | "green" | "cyan" | "amber";
}

const accentMap = {
  purple: { color: "var(--glow-purple)", bg: "var(--glow-purple-dim)" },
  green: { color: "var(--glow-green)", bg: "var(--glow-green-dim)" },
  cyan: { color: "var(--glow-cyan)", bg: "var(--glow-cyan-dim)" },
  amber: { color: "var(--glow-amber)", bg: "var(--glow-amber-dim)" },
};

export function StatCard({ icon, label, value, accent = "purple" }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className="ambient-card p-4">
      <div className="relative z-10">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
          style={{ background: a.bg, color: a.color }}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

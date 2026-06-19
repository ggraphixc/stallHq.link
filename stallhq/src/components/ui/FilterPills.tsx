"use client";

interface FilterPillsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, selected, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
          selected === ""
            ? "bg-[var(--glow-purple)] text-white border-[var(--glow-purple)]"
            : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]"
        }`}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
            selected === opt
              ? "bg-[var(--glow-purple)] text-white border-[var(--glow-purple)]"
              : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

"use client";

interface FilterPillsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, selected, onChange }: FilterPillsProps) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", scrollbarWidth: "none" }}>
      <button
        onClick={() => onChange("")}
        style={{
          padding: "0.375rem 0.75rem", fontSize: "0.75rem", fontWeight: 500,
          borderRadius: "9999px", border: "1px solid",
          borderColor: selected === "" ? "var(--glow-purple)" : "var(--border-subtle)",
          background: selected === "" ? "var(--glow-purple)" : "transparent",
          color: selected === "" ? "white" : "var(--text-secondary)",
          cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
        }}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "0.375rem 0.75rem", fontSize: "0.75rem", fontWeight: 500,
            borderRadius: "9999px", border: "1px solid",
            borderColor: selected === opt ? "var(--glow-purple)" : "var(--border-subtle)",
            background: selected === opt ? "var(--glow-purple)" : "transparent",
            color: selected === opt ? "white" : "var(--text-secondary)",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (selected !== opt) e.currentTarget.style.borderColor = "var(--border-medium)"; }}
          onMouseOut={(e) => { if (selected !== opt) e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

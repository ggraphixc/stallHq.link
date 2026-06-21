"use client";

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div style={{ position: "relative" }}>
      <Search
        size={16}
        style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
      />
      <input
        type="text"
        style={{
          width: "100%",
          padding: "0.625rem 2.25rem 0.625rem 2.5rem",
          fontSize: "0.8125rem",
          background: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "0.5rem",
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
            padding: "0.125rem", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

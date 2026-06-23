"use client";

import { useState } from "react";
import { ProductVariant } from "@/types";
import { Plus, X, GripVertical } from "lucide-react";

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
}

interface VariantDraft {
  optionName: string;
  optionValue: string;
  price: string;
  stock: string;
  sku: string;
}

const COMMON_OPTIONS = [
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { name: "Color", values: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Grey", "Brown", "Navy"] },
  { name: "Material", values: ["Cotton", "Polyester", "Silk", "Leather", "Denim", "Wool"] },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.625rem",
  fontSize: "0.75rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "0.375rem",
};

export function VariantManager({ variants, onChange, basePrice }: VariantManagerProps) {
  const [drafts, setDrafts] = useState<VariantDraft[]>([
    { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" },
  ]);
  const [customOptionName, setCustomOptionName] = useState("");

  const addDraft = () => {
    setDrafts([...drafts, { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" }]);
  };

  const removeDraft = (index: number) => {
    setDrafts(drafts.filter((_, i) => i !== index));
  };

  const updateDraft = (index: number, field: keyof VariantDraft, value: string) => {
    const updated = [...drafts];
    updated[index] = { ...updated[index], [field]: value };
    setDrafts(updated);
  };

  const addVariants = () => {
    const newVariants: ProductVariant[] = drafts
      .filter((d) => d.optionValue)
      .map((d, i) => ({
        id: `temp-${Date.now()}-${i}`,
        product_id: "",
        name: `${d.optionName}: ${d.optionValue}`,
        option_name: d.optionName,
        option_value: d.optionValue,
        price: d.price ? parseFloat(d.price) : null,
        stock: parseInt(d.stock) || 0,
        sku: d.sku || null,
      }));
    onChange([...variants, ...newVariants]);
    setDrafts([{ optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" }]);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const groupedVariants = variants.reduce(
    (acc, variant) => {
      if (!acc[variant.option_name]) acc[variant.option_name] = [];
      acc[variant.option_name].push(variant);
      return acc;
    },
    {} as Record<string, ProductVariant[]>
  );

  const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "0.75rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Product Variants</label>
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Optional</span>
      </div>

      {/* Existing Variants */}
      {Object.entries(groupedVariants).map(([optionName, optionVariants]) => (
        <div key={optionName} style={{ ...glassCard, padding: "0.75rem" }}>
          <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>{optionName}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {optionVariants.map((variant) => (
              <div key={variant.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GripVertical size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.8125rem" }}>{variant.option_value}</span>
                {variant.price !== null && (
                  <span style={{ fontSize: "0.6875rem", color: "var(--glow-green)" }}>₦{variant.price.toLocaleString()}</span>
                )}
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Stock: {variant.stock}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s", flexShrink: 0 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-red)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add New Variants */}
      <div style={{ ...glassCard, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h4 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Add Variants</h4>

        {drafts.map((draft, index) => (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", alignItems: "start" }}>
            <select
              value={draft.optionName}
              onChange={(e) => updateDraft(index, "optionName", e.target.value)}
              className="ambient-input"
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {COMMON_OPTIONS.map((opt) => (
                <option key={opt.name} value={opt.name}>{opt.name}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>

            {draft.optionName === "custom" ? (
              <input
                type="text"
                value={customOptionName}
                onChange={(e) => setCustomOptionName(e.target.value)}
                placeholder="Option name"
                className="ambient-input"
                style={inputStyle}
              />
            ) : (
              <select
                value={draft.optionValue}
                onChange={(e) => updateDraft(index, "optionValue", e.target.value)}
                className="ambient-input"
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Select</option>
                {COMMON_OPTIONS.find((o) => o.name === draft.optionName)?.values.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            )}

            <input
              type="number"
              value={draft.price}
              onChange={(e) => updateDraft(index, "price", e.target.value)}
              placeholder="Price (opt.)"
              className="ambient-input"
              style={inputStyle}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <input
                type="number"
                value={draft.stock}
                onChange={(e) => updateDraft(index, "stock", e.target.value)}
                placeholder="Stock"
                className="ambient-input"
                style={{ ...inputStyle, flex: 1 }}
              />
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDraft(index)}
                  style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-red)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={addDraft}
            style={{ fontSize: "0.75rem", color: "var(--glow-purple)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <Plus size={14} />
            Add another
          </button>
        </div>

        <button
          type="button"
          onClick={addVariants}
          disabled={drafts.every((d) => !d.optionValue)}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(168,133,247,0.1)", color: "var(--glow-purple)", fontSize: "0.75rem", fontWeight: 600, border: "none", cursor: drafts.every((d) => !d.optionValue) ? "not-allowed" : "pointer", opacity: drafts.every((d) => !d.optionValue) ? 0.5 : 1, transition: "background 0.2s" }}
          onMouseEnter={(e) => { if (!drafts.every((d) => !d.optionValue)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.1)"; }}
        >
          Add Variants
        </button>
      </div>
    </div>
  );
}

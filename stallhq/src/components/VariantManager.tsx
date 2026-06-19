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
  {
    name: "Size",
    values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  },
  {
    name: "Color",
    values: [
      "Black",
      "White",
      "Red",
      "Blue",
      "Green",
      "Yellow",
      "Pink",
      "Purple",
      "Orange",
      "Grey",
      "Brown",
      "Navy",
    ],
  },
  {
    name: "Material",
    values: ["Cotton", "Polyester", "Silk", "Leather", "Denim", "Wool"],
  },
];

export function VariantManager({
  variants,
  onChange,
  basePrice,
}: VariantManagerProps) {
  const [drafts, setDrafts] = useState<VariantDraft[]>([
    { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" },
  ]);
  const [customOptionName, setCustomOptionName] = useState("");

  const addDraft = () => {
    setDrafts([
      ...drafts,
      { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" },
    ]);
  };

  const removeDraft = (index: number) => {
    setDrafts(drafts.filter((_, i) => i !== index));
  };

  const updateDraft = (
    index: number,
    field: keyof VariantDraft,
    value: string
  ) => {
    const updated = [...drafts];
    updated[index][field] = value;
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
    setDrafts([
      { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" },
    ]);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (
    id: string,
    field: keyof ProductVariant,
    value: string | number | null
  ) => {
    onChange(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Group variants by option name
  const groupedVariants = variants.reduce(
    (acc, variant) => {
      if (!acc[variant.option_name]) {
        acc[variant.option_name] = [];
      }
      acc[variant.option_name].push(variant);
      return acc;
    },
    {} as Record<string, ProductVariant[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Product Variants</label>
        <span className="text-xs text-[var(--text-muted)]">
          Optional: Add sizes, colors, etc.
        </span>
      </div>

      {/* Existing Variants */}
      {Object.entries(groupedVariants).map(([optionName, optionVariants]) => (
        <div
          key={optionName}
          className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
        >
          <h4 className="text-sm font-medium mb-2">{optionName}</h4>
          <div className="space-y-2">
            {optionVariants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="flex-1 text-sm">{variant.option_value}</span>
                {variant.price !== null && (
                  <span className="text-xs text-[var(--glow-green)]">
                    ₦{variant.price.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  Stock: {variant.stock}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  className="p-1 rounded hover:bg-[var(--glow-red-dim)] text-[var(--text-muted)] hover:text-[var(--glow-red)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add New Variants */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
        <h4 className="text-sm font-medium">Add Variants</h4>

        {drafts.map((draft, index) => (
          <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-start">
            <select
              value={draft.optionName}
              onChange={(e) => updateDraft(index, "optionName", e.target.value)}
              className="ambient-input !py-2 !px-3 text-sm"
            >
              {COMMON_OPTIONS.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>

            {draft.optionName === "custom" ? (
              <input
                type="text"
                value={customOptionName}
                onChange={(e) => setCustomOptionName(e.target.value)}
                placeholder="Option name"
                className="ambient-input !py-2 !px-3 text-sm"
              />
            ) : (
              <select
                value={draft.optionValue}
                onChange={(e) => updateDraft(index, "optionValue", e.target.value)}
                className="ambient-input !py-2 !px-3 text-sm"
              >
                <option value="">Select</option>
                {COMMON_OPTIONS.find((o) => o.name === draft.optionName)?.values.map(
                  (val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  )
                )}
              </select>
            )}

            <input
              type="number"
              value={draft.price}
              onChange={(e) => updateDraft(index, "price", e.target.value)}
              placeholder="Price (optional)"
              className="ambient-input !py-2 !px-3 text-sm"
            />

            <div className="flex items-center gap-1">
              <input
                type="number"
                value={draft.stock}
                onChange={(e) => updateDraft(index, "stock", e.target.value)}
                placeholder="Stock"
                className="ambient-input !py-2 !px-3 text-sm flex-1"
              />
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDraft(index)}
                  className="p-1 rounded hover:bg-[var(--glow-red-dim)] text-[var(--text-muted)] hover:text-[var(--glow-red)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addDraft}
            className="text-sm text-[var(--glow-purple)] hover:text-[var(--glow-purple)]/80 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add another
          </button>
        </div>

        <button
          type="button"
          onClick={addVariants}
          disabled={drafts.every((d) => !d.optionValue)}
          className="w-full py-2 rounded-lg bg-[var(--glow-purple)]/10 text-[var(--glow-purple)] text-sm font-medium hover:bg-[var(--glow-purple)]/20 transition-colors disabled:opacity-50"
        >
          Add Variants
        </button>
      </div>
    </div>
  );
}

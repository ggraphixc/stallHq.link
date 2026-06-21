"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Package, Loader2, Plus, X, ArrowRight } from "lucide-react";

interface ProductEntryStepProps {
  store: Store;
  onProductsAdded: () => void;
  onSkip: () => void;
}

interface ProductDraft {
  name: string;
  price: string;
  category: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export function ProductEntryStep({ store, onProductsAdded, onSkip }: ProductEntryStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductDraft[]>([{ name: "", price: "", category: "" }]);

  const addProduct = () => setProducts([...products, { name: "", price: "", category: "" }]);

  const removeProduct = (index: number) => {
    if (products.length > 1) setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductDraft, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validProducts = products.filter((p) => p.name && p.price);
    if (validProducts.length === 0) { onSkip(); return; }

    try {
      for (const product of validProducts) {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: store.id,
            name: product.name,
            price: parseFloat(product.price),
            category: product.category || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add product");
        }
      }
      onProductsAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
          <Package size={20} style={{ color: "var(--glow-green)" }} />
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Add Your Products</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Add at least one product to get started</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {/* Error */}
        {error && (
          <div style={{ padding: "0.625rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--glow-red)", fontSize: "0.75rem" }}>
            {error}
          </div>
        )}

        {/* Product Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {products.map((product, index) => (
            <div
              key={index}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Product {index + 1}
                </span>
                {products.length > 1 && (
                  <button type="button" onClick={() => removeProduct(index)} style={{ padding: "0.25rem", borderRadius: "0.375rem", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <input
                type="text"
                className="ambient-input"
                style={inputStyle}
                placeholder="Product name"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>Price (₦)</label>
                  <input
                    type="number"
                    className="ambient-input"
                    style={inputStyle}
                    placeholder="0.00"
                    value={product.price}
                    onChange={(e) => updateProduct(index, "price", e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input
                    type="text"
                    className="ambient-input"
                    style={inputStyle}
                    placeholder="Optional"
                    value={product.category}
                    onChange={(e) => updateProduct(index, "category", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={addProduct}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px dashed var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
        >
          <Plus size={14} />
          Add another product
        </button>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button type="button" onClick={onSkip} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 500 }}>
            Skip
          </button>
          <button type="submit" disabled={loading} className="glow-button" style={{ flex: 1, padding: "0.75rem", fontSize: "0.8125rem" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Adding...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                Continue
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

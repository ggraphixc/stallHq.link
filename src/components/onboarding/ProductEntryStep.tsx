"use client";

import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Store } from "@/types";
import { Package, Loader2, Plus, X, ArrowRight, Sparkles } from "lucide-react";
import { hasAIAccess } from "@/lib/subscription";

interface ProductEntryStepProps {
  store: Store;
  onProductsAdded: () => void;
  onSkip: () => void;
}

interface ProductDraft {
  name: string;
  price: string;
  category: string;
  description: string;
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
  const { error: showError, success: showSuccess, confirm } = useAlert();
  const [products, setProducts] = useState<ProductDraft[]>([{ name: "", price: "", category: "", description: "" }]);
  const [generatingAI, setGeneratingAI] = useState<number | null>(null);

  const addProduct = () => setProducts([...products, { name: "", price: "", category: "", description: "" }]);

  const removeProduct = (index: number) => {
    if (products.length > 1) setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductDraft, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleGenerateDescription = async (index: number) => {
    const product = products[index];
    if (!product.name.trim()) return;
    setGeneratingAI(index);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name.trim(),
          category: product.category.trim() || undefined,
          price: product.price || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        const updated = [...products];
        updated[index] = { ...updated[index], description: data.description };
        setProducts(updated);
      }
    } catch {}
    setGeneratingAI(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
            description: product.description || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add product");
        }
      }
      onProductsAdded();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
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

              {/* Description + AI button */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
                  {hasAIAccess(store) ? (
                    <button
                      type="button"
                      onClick={() => handleGenerateDescription(index)}
                      disabled={generatingAI === index || !product.name.trim()}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.25rem",
                        padding: "0.1875rem 0.5rem", fontSize: "0.625rem", fontWeight: 600,
                        color: generatingAI === index ? "var(--text-muted)" : "var(--glow-purple)",
                        background: generatingAI === index ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.1)",
                        border: "1px solid rgba(168,85,247,0.2)", borderRadius: "0.25rem",
                        cursor: generatingAI === index || !product.name.trim() ? "not-allowed" : "pointer",
                      }}
                    >
                      {generatingAI === index ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={10} />}
                      {generatingAI === index ? "Generating..." : "AI"}
                    </button>
                  ) : null}
                </div>
                <textarea
                  className="ambient-input"
                  style={{ ...inputStyle, resize: "none", fontSize: "0.75rem", minHeight: "2.5rem" }}
                  rows={2}
                  placeholder={generatingAI === index ? "AI is generating..." : "Product description"}
                  value={product.description}
                  onChange={(e) => updateProduct(index, "description", e.target.value)}
                  disabled={generatingAI === index}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
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

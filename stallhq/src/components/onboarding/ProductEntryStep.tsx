"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Package, Loader2, Plus, X } from "lucide-react";

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

export function ProductEntryStep({
  store,
  onProductsAdded,
  onSkip,
}: ProductEntryStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductDraft[]>([
    { name: "", price: "", category: "" },
  ]);

  const addProduct = () => {
    setProducts([...products, { name: "", price: "", category: "" }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (
    index: number,
    field: keyof ProductDraft,
    value: string
  ) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Filter out empty products
    const validProducts = products.filter((p) => p.name && p.price);

    if (validProducts.length === 0) {
      onSkip();
      return;
    }

    try {
      // Create products one by one
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
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-[var(--glow-green)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Add Your Products</h1>
        <p className="text-[var(--text-secondary)]">
          Add at least one product to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {products.map((product, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Product {index + 1}
              </span>
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              className="ambient-input"
              placeholder="Product name"
              value={product.name}
              onChange={(e) => updateProduct(index, "name", e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                className="ambient-input"
                placeholder="Price (₦)"
                value={product.price}
                onChange={(e) => updateProduct(index, "price", e.target.value)}
                min="0"
                step="0.01"
                required
              />
              <input
                type="text"
                className="ambient-input"
                placeholder="Category"
                value={product.category}
                onChange={(e) =>
                  updateProduct(index, "category", e.target.value)
                }
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProduct}
          className="w-full py-3 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--glow-purple)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add another product
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 glow-button disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

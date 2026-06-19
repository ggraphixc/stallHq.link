"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Package, Loader2, Plus, X, ArrowRight, ShoppingCart } from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--glow-green)]/20 to-[var(--glow-cyan)]/20 border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
          <Package className="w-8 h-8 text-[var(--glow-green)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Add Your Products</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Add at least one product to get started
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--glow-red)]/10 border border-[var(--glow-red)]/20 text-[var(--glow-red)] text-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--glow-red)]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        {/* Product Cards */}
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 transition-all hover:border-[var(--glow-purple)]/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--glow-purple)]/10 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-[var(--glow-purple)]" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Product {index + 1}
                  </span>
                </div>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="p-2 rounded-lg hover:bg-[var(--glow-red)]/10 text-[var(--text-muted)] hover:text-[var(--glow-red)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
                placeholder="Product name"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
                  placeholder="Price (₦)"
                  value={product.price}
                  onChange={(e) => updateProduct(index, "price", e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="text"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
                  placeholder="Category"
                  value={product.category}
                  onChange={(e) =>
                    updateProduct(index, "category", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={addProduct}
          className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--glow-purple)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add another product
        </button>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-4 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all font-medium"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 glow-button !py-4 group"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

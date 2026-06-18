"use client";

import { useState } from "react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { useCart } from "@/hooks/useCart";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-[var(--glow-purple)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-[var(--glow-purple)] text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard product={product} onAddToCart={addItem} />
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p>No products found</p>
        </div>
      )}
    </div>
  );
}

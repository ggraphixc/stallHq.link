"use client";

import { Product } from "@/types";
import { Pencil, Trash2, ShoppingBag } from "lucide-react";

interface DashboardProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function DashboardProductGrid({
  products,
  onEdit,
  onDelete,
}: DashboardProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="ambient-card group fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Image */}
          <div className="image-glow aspect-square bg-[var(--bg-secondary)] relative overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
            )}

            {/* Category Badge */}
            {product.category && (
              <div className="absolute top-3 left-3">
                <span className="category-tag">{product.category}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="p-2 rounded-lg bg-[var(--bg-card)]/80 backdrop-blur-sm hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={`Edit ${product.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                className="p-2 rounded-lg bg-[var(--bg-card)]/80 backdrop-blur-sm hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                aria-label={`Delete ${product.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold truncate">{product.name}</h3>
            <p className="price-display text-lg">
              ₦{product.price.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

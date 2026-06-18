"use client";

import { Product } from "@/types";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="ambient-card group">
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="price-display text-xl">
            ₦{product.price.toLocaleString()}
          </span>

          <button
            onClick={() => onAddToCart(product)}
            className="glow-button !px-4 !py-2.5 !min-h-[44px] !text-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

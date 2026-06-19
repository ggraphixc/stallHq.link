"use client";

import Link from "next/link";
import { Product, ProductWithRating } from "@/types";
import { ShoppingBag, Plus } from "lucide-react";
import { RatingDisplay } from "./RatingDisplay";

interface ProductCardProps {
  product: ProductWithRating;
  onAddToCart: (product: Product) => void;
  storeId?: string;
}

export function ProductCard({ product, onAddToCart, storeId }: ProductCardProps) {
  const productUrl = storeId ? `#` : "#";

  return (
    <div className="ambient-card ambient-card-interactive group">
      {/* Image */}
      <Link
        href={storeId ? `/${storeId}/product/${product.id}` : "#"}
        className="block aspect-square bg-[var(--bg-secondary)] relative overflow-hidden"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2.5 left-2.5">
            <span className="category-tag">{product.category}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2.5">
        <Link href={storeId ? `/${storeId}/product/${product.id}` : "#"}>
          <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-[var(--glow-purple)] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.review_count !== undefined && product.review_count > 0 && (
          <RatingDisplay
            rating={product.avg_rating || 0}
            count={product.review_count}
          />
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="price-display text-base sm:text-lg">
            ₦{product.price.toLocaleString()}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="glow-button !px-3 !py-2 !min-h-[44px] !text-xs !rounded-lg"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

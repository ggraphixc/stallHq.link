"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Product, ProductWithRating } from "@/types";
import { ShoppingBag, Plus, Pencil, ToggleLeft, ToggleRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { RatingDisplay } from "./RatingDisplay";

interface ProductCardProps {
  product: ProductWithRating;
  onAddToCart: (product: Product) => void;
  storeId?: string;
  isOwner?: boolean;
  onEdit?: (product: Product) => void;
  onToggleStock?: (productId: string, currentInStock: boolean) => void;
  togglingId?: string | null;
}

export function ProductCard({
  product,
  onAddToCart,
  storeId,
  isOwner,
  onEdit,
  onToggleStock,
  togglingId,
}: ProductCardProps) {
  const [imgIndex, setImgIndex] = useState(0);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) imgs.push(...product.images);
    return imgs;
  }, [product.image_url, product.images]);

  const hasMultipleImages = allImages.length > 1;

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
  };

  const navBtnStyle: React.CSSProperties = {
    width: "1.75rem",
    height: "1.75rem",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
    padding: 0,
  };

  return (
    <div className="ambient-card ambient-card-interactive group" style={{ position: "relative" }}>
      {/* Image */}
      <Link
        href={storeId ? `/${storeId}/product/${product.id}` : "#"}
        className="block aspect-square bg-[var(--bg-secondary)] relative overflow-hidden"
      >
        {allImages.length > 0 ? (
          <img
            src={allImages[imgIndex]}
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

        {/* Inactive badge */}
        {!product.in_stock && (
          <span
            style={{
              position: "absolute",
              top: "0.625rem",
              right: "0.625rem",
              fontSize: "0.5625rem",
              fontWeight: 600,
              padding: "0.125rem 0.375rem",
              borderRadius: "0.25rem",
              background: "rgba(239,68,68,0.85)",
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              zIndex: 5,
            }}
          >
            Off
          </span>
        )}

        {/* Image carousel nav — only when multiple images & not owner overlay */}
        {hasMultipleImages && !isOwner && (
          <>
            <button onClick={prevImage} className="sm:!opacity-0 sm:group-hover:!opacity-100" style={{ ...navBtnStyle, position: "absolute", left: "0.375rem", top: "50%", transform: "translateY(-50%)", opacity: 1, transition: "opacity 0.2s", zIndex: 5 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
            >
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextImage} className="sm:!opacity-0 sm:group-hover:!opacity-100" style={{ ...navBtnStyle, position: "absolute", right: "0.375rem", top: "50%", transform: "translateY(-50%)", opacity: 1, transition: "opacity 0.2s", zIndex: 5 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
            >
              <ChevronRight size={14} />
            </button>
            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: "0.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.25rem", zIndex: 5 }}>
              {allImages.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: "0.375rem",
                    height: "0.375rem",
                    borderRadius: "50%",
                    background: i === imgIndex ? "white" : "rgba(255,255,255,0.4)",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Owner overlay */}
        {isOwner && (
          <div
            className="sm:!opacity-0 sm:group-hover:!opacity-100"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: 1,
              transition: "opacity 0.2s",
              zIndex: 4,
            }}
          >
            {/* Edit */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(product);
              }}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              aria-label={`Edit ${product.name}`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
            >
              <Pencil size={15} />
            </button>

            {/* Toggle activate/deactivate */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStock?.(product.id, product.in_stock);
              }}
              disabled={togglingId === product.id}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.625rem",
                background: product.in_stock ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${product.in_stock ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                color: "white",
                cursor: togglingId === product.id ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              aria-label={product.in_stock ? `Deactivate ${product.name}` : `Activate ${product.name}`}
              onMouseEnter={(e) => {
                if (togglingId !== product.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = product.in_stock ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (togglingId !== product.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = product.in_stock ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)";
                }
              }}
            >
              {togglingId === product.id ? (
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : product.in_stock ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
            </button>

            {/* Image carousel nav (owner mode) */}
            {hasMultipleImages && (
              <>
                <button onClick={prevImage} style={{ ...navBtnStyle, position: "absolute", left: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button onClick={nextImage} style={{ ...navBtnStyle, position: "absolute", right: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Hover overlay (non-owner) */}
        {!isOwner && !hasMultipleImages && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
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

          {/* Add to cart — only for non-owners */}
          {!isOwner && (
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
          )}
        </div>
      </div>
    </div>
  );
}

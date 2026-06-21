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

const navBtn: React.CSSProperties = {
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

const overlayBtn: React.CSSProperties = {
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
};

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

  return (
    <div style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--bg-card)", transition: "border-color 0.2s" }}>
      {/* Image container */}
      <Link
        href={storeId ? `/${storeId}/product/${product.id}` : "#"}
        style={{ display: "block", aspectRatio: "1", background: "var(--bg-secondary)", position: "relative", overflow: "hidden" }}
      >
        {allImages.length > 0 ? (
          <img
            src={allImages[imgIndex]}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={40} color="var(--text-muted)" />
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <span style={{
            position: "absolute",
            top: "0.625rem",
            left: "0.625rem",
            fontSize: "0.5625rem",
            fontWeight: 600,
            padding: "0.1875rem 0.5rem",
            borderRadius: "9999px",
            background: "rgba(168,133,247,0.15)",
            color: "var(--glow-purple)",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}>
            {product.category}
          </span>
        )}

        {/* Inactive badge */}
        {!product.in_stock && (
          <span style={{
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
          }}>
            Off
          </span>
        )}

        {/* Carousel nav (non-owner) */}
        {hasMultipleImages && !isOwner && (
          <>
            <button onClick={prevImage} style={{ ...navBtn, position: "absolute", left: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextImage} style={{ ...navBtn, position: "absolute", right: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
              <ChevronRight size={14} />
            </button>
            <div style={{ position: "absolute", bottom: "0.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.25rem", zIndex: 5 }}>
              {allImages.map((_, i) => (
                <span key={i} style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: i === imgIndex ? "white" : "rgba(255,255,255,0.4)", transition: "background 0.2s" }} />
              ))}
            </div>
          </>
        )}

        {/* Owner overlay */}
        {isOwner && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            zIndex: 4,
          }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(product); }}
              style={overlayBtn}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleStock?.(product.id, product.in_stock); }}
              disabled={togglingId === product.id}
              style={{
                ...overlayBtn,
                background: product.in_stock ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                border: `1px solid ${product.in_stock ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                cursor: togglingId === product.id ? "wait" : "pointer",
              }}
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
            {/* Carousel nav (owner mode) */}
            {hasMultipleImages && (
              <>
                <button onClick={prevImage} style={{ ...navBtn, position: "absolute", left: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={nextImage} style={{ ...navBtn, position: "absolute", right: "0.375rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Hover overlay (non-owner, no carousel) */}
        {!isOwner && !hasMultipleImages && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
            opacity: 0,
            transition: "opacity 0.3s",
          }} />
        )}
      </Link>

      {/* Content */}
      <div style={{ padding: "0.75rem 1rem" }}>
        <Link href={storeId ? `/${storeId}/product/${product.id}` : "#"} style={{ textDecoration: "none" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.25rem" }}>
            {product.name}
          </h3>
        </Link>

        {product.review_count !== undefined && product.review_count > 0 && (
          <RatingDisplay rating={product.avg_rating || 0} count={product.review_count} />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <span className="price-display" style={{ fontSize: "1rem", fontWeight: 700 }}>
            ₦{product.price.toLocaleString()}
          </span>
          {!isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="glow-button"
              style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", minHeight: "2.25rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Product, ProductWithRating } from "@/types";
import { ShoppingBag, Plus, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { RatingDisplay } from "./RatingDisplay";

interface ProductCardProps {
  product: ProductWithRating;
  onAddToCart: (product: Product) => void;
  storeId?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string, storeId: string) => void;
}

const navBtn: React.CSSProperties = {
  width: "2.75rem",
  height: "2.75rem",
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
  flexShrink: 0,
  padding: 0,
};

export function ProductCard({ product, onAddToCart, storeId, isFavorite, onToggleFavorite }: ProductCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) imgs.push(...product.images);
    return imgs;
  }, [product.image_url, product.images]);

  const hasMultipleImages = allImages.length > 1;

  useEffect(() => {
    if (!hasMultipleImages || hovering) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasMultipleImages, hovering, allImages.length]);

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
      <Link
        href={storeId ? `/${storeId}/product/${product.id}` : "#"}
        style={{ display: "block", aspectRatio: "1", background: "var(--bg-secondary)", position: "relative", overflow: "hidden" }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Crossfade images */}
        {allImages.length > 0 ? (
          allImages.map((img, i) => (
            <img
              key={img}
              src={img}
              alt={product.name}
              style={{
                position: i === 0 ? "relative" : "absolute",
                top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover",
                opacity: i === imgIndex ? 1 : 0,
                transition: "opacity 0.5s ease-in-out",
                pointerEvents: "none",
              }}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={40} color="var(--text-muted)" />
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <span style={{
            position: "absolute", top: "0.625rem", left: "0.625rem",
            fontSize: "0.5625rem", fontWeight: 600, padding: "0.1875rem 0.5rem",
            borderRadius: "9999px", background: "rgba(168,133,247,0.15)", color: "var(--glow-purple)",
            letterSpacing: "0.03em", textTransform: "uppercase", zIndex: 3,
          }}>
            {product.category}
          </span>
        )}

        {/* Inactive badge */}
        {!product.in_stock && (
          <span style={{
            position: "absolute", top: "0.625rem", right: onToggleFavorite ? "3rem" : "0.625rem",
            fontSize: "0.5625rem", fontWeight: 600, padding: "0.125rem 0.375rem",
            borderRadius: "0.25rem", background: "rgba(239,68,68,0.85)", color: "white",
            textTransform: "uppercase", letterSpacing: "0.05em", zIndex: 5,
          }}>
            Off
          </span>
        )}

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (storeId) onToggleFavorite(product.id, storeId); }}
            style={{
              position: "absolute", top: "0.625rem", right: "0.625rem",
              width: "2.25rem", height: "2.25rem",
              borderRadius: "50%", border: "none",
              background: isFavorite ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              color: isFavorite ? "white" : "rgba(255,255,255,0.8)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", zIndex: 6,
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}

        {/* < > buttons — always visible when multiple images */}
        {hasMultipleImages && (
          <>
            <button onClick={prevImage} style={{ ...navBtn, position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextImage} style={{ ...navBtn, position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
              <ChevronRight size={18} />
            </button>
            <div style={{ position: "absolute", bottom: "0.625rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.375rem", zIndex: 5 }}>
              {allImages.map((_, i) => (
                <span key={i} style={{
                  width: i === imgIndex ? "1rem" : "0.375rem", height: "0.375rem",
                  borderRadius: "9999px", background: i === imgIndex ? "white" : "rgba(255,255,255,0.4)",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
          </>
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
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="glow-button"
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", minHeight: "2.25rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

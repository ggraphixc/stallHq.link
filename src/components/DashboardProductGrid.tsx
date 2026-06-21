"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Pencil, ShoppingBag, ToggleLeft, ToggleRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggleStock: (productId: string, currentInStock: boolean) => void;
  togglingId: string | null;
}

function CardImage({ product }: { product: Product }) {
  const [imgIndex, setImgIndex] = useState(0);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) imgs.push(...product.images);
    return imgs;
  }, [product.image_url, product.images]);

  const hasMultiple = allImages.length > 1;

  const navBtn: React.CSSProperties = {
    width: "2.25rem",
    height: "2.25rem",
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

  return (
    <>
      {product.image_url ? (
        <img
          src={allImages[imgIndex]}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s, opacity 0.3s",
          }}
          loading="lazy"
          onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBag size={32} style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {/* Carousel nav */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i === 0 ? allImages.length - 1 : i - 1)); }}
            style={{ ...navBtn, position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.6)"; }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i === allImages.length - 1 ? 0 : i + 1)); }}
            style={{ ...navBtn, position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.7)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.6)"; }}
          >
            <ChevronRight size={18} />
          </button>
          {/* Dots */}
          <div style={{ position: "absolute", bottom: "0.625rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.375rem", zIndex: 5 }}>
            {allImages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: "0.4375rem",
                  height: "0.4375rem",
                  borderRadius: "50%",
                  background: i === imgIndex ? "white" : "rgba(255,255,255,0.4)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function DashboardProductGrid({
  products,
  onEdit,
  onToggleStock,
  togglingId,
}: DashboardProductGridProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: "0.75rem" }}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className="fade-in ambient-card"
          style={{
            animationDelay: `${index * 50}ms`,
            borderRadius: "0.75rem",
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            transition: "border-color 0.2s",
            position: "relative",
          }}
        >
          {/* Image */}
          <div style={{ position: "relative", aspectRatio: "1", background: "var(--bg-secondary)", overflow: "hidden" }}>
            <CardImage product={product} />

            {/* Category badge */}
            {product.category && (
              <span className="category-tag" style={{ position: "absolute", top: "0.625rem", left: "0.625rem" }}>
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
                zIndex: 2,
              }}>
                Off
              </span>
            )}

            {/* Dark overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
              zIndex: 3,
            }} />

            {/* Buttons at bottom, side by side */}
            <div style={{
              position: "absolute",
              bottom: "0.75rem",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 4,
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "0.75rem",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                aria-label={`Edit ${product.name}`}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)"; }}
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleStock(product.id, product.in_stock); }}
                disabled={togglingId === product.id}
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "0.75rem",
                  background: product.in_stock ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${product.in_stock ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`,
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
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : product.in_stock ? (
                  <ToggleRight size={18} />
                ) : (
                  <ToggleLeft size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "0.75rem" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.25rem" }}>
              {product.name}
            </h3>
            <p className="price-display" style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
              ₦{product.price.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

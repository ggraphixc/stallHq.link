"use client";

import { Product } from "@/types";
import { Pencil, ShoppingBag, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface DashboardProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggleStock: (productId: string, currentInStock: boolean) => void;
  togglingId: string | null;
}

export function DashboardProductGrid({
  products,
  onEdit,
  onToggleStock,
  togglingId,
}: DashboardProductGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }} className="md:!grid-cols-3 lg:!grid-cols-4">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="fade-in ambient-card group"
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
          <div
            style={{
              position: "relative",
              aspectRatio: "1",
              background: "var(--bg-secondary)",
              overflow: "hidden",
            }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.5s",
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

            {/* Category badge */}
            {product.category && (
              <span
                className="category-tag"
                style={{
                  position: "absolute",
                  top: "0.625rem",
                  left: "0.625rem",
                }}
              >
                {product.category}
              </span>
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
                  zIndex: 2,
                }}
              >
                Off
              </span>
            )}

            {/* Overlay buttons — visible on hover (desktop) / always (mobile) */}
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
                zIndex: 3,
              }}
            >
              {/* Edit */}
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(product); }}
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
                onClick={(e) => { e.stopPropagation(); onToggleStock(product.id, product.in_stock); }}
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
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "0.75rem" }}>
            <h3
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "0.25rem",
              }}
            >
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

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }} className="md:!grid-cols-3 lg:!grid-cols-4">
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

            {/* Action buttons */}
            <div
              className="group"
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                display: "flex",
                gap: "0.375rem",
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                className="sm:!opacity-0 sm:!group-hover:opacity-100"
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                aria-label={`Edit ${product.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                className="sm:!opacity-0 sm:!group-hover:opacity-100"
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                aria-label={`Delete ${product.name}`}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-red)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              >
                <Trash2 size={14} />
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

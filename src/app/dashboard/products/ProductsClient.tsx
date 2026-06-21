"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Product } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Package,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
  ArrowLeft,
  Upload,
  ShoppingBag,
  X,
  Loader2,
  ChevronDown,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProductsClientProps {
  store: Store;
  products: Product[];
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

/* ── Particle canvas ────────────────────────────── */

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = [
      "rgba(168,133,247,0.12)",
      "rgba(6,182,212,0.1)",
      "rgba(16,185,129,0.08)",
      "rgba(236,72,153,0.06)",
    ];

    const dots = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ── Main Component ─────────────────────────────── */

export function ProductsClient({
  store,
  products: initialProducts,
}: ProductsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStock =
      filterStock === "all" ||
      (filterStock === "in_stock" && p.in_stock) ||
      (filterStock === "out_of_stock" && !p.in_stock);
    return matchesSearch && matchesStock;
  });

  const inStockCount = products.filter((p) => p.in_stock).length;
  const outOfStockCount = products.length - inStockCount;

  const handleToggleStock = async (productId: string, currentInStock: boolean) => {
    setTogglingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ in_stock: !currentInStock }),
      });
      if (res.ok) {
        setProducts(
          products.map((p) =>
            p.id === productId ? { ...p, in_stock: !currentInStock } : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling stock:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    setDeletingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />

      {/* ── Header ─────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(6,6,11,0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1rem",
            height: "3.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Products</h1>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                {products.length} product{products.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => router.push("/dashboard/products/new")}
              className="glow-button"
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}
            >
              <Plus size={14} />
              {isDesktop && <span>Add Product</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────── */}
      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="ambient-input"
              style={{ ...inputStyle, paddingLeft: "2.25rem" }}
            />
          </div>

          {/* Stock filter tabs */}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {[
              { key: "all" as const, label: "All", count: products.length },
              { key: "in_stock" as const, label: "Active", count: inStockCount },
              { key: "out_of_stock" as const, label: "Deactivated", count: outOfStockCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStock(key)}
                style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: filterStock === key ? "var(--glow-purple)" : "var(--bg-card)",
                  color: filterStock === key ? "white" : "var(--text-secondary)",
                }}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Package size={20} style={{ color: "var(--glow-purple)" }} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {search || filterStock !== "all" ? "No products match your filters" : "No products yet"}
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              {search || filterStock !== "all" ? "Try adjusting your search or filters." : "Add your first product to start selling."}
            </p>
            {!search && filterStock === "all" && (
              <button
                onClick={() => router.push("/dashboard/products/new")}
                className="glow-button"
                style={{ padding: "0.75rem 1.5rem", fontSize: "0.8125rem", margin: "0 auto" }}
              >
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="fade-in"
                style={{
                  ...glassCard,
                  padding: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  opacity: !product.in_stock ? 0.55 : 1,
                  transition: "opacity 0.2s",
                  animationDelay: `${index * 30}ms`,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <ShoppingBag size={18} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
                    <h3
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.name}
                    </h3>
                    {!product.in_stock && (
                      <span
                        style={{
                          fontSize: "0.5625rem",
                          fontWeight: 600,
                          padding: "0.125rem 0.375rem",
                          borderRadius: "0.25rem",
                          background: "rgba(239,68,68,0.12)",
                          color: "var(--glow-red)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          flexShrink: 0,
                        }}
                      >
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--glow-green)" }}>
                      ₦{product.price.toLocaleString()}
                    </span>
                    {product.category && (
                      <span
                        style={{
                          fontSize: "0.5625rem",
                          padding: "0.125rem 0.375rem",
                          borderRadius: "0.25rem",
                          background: "rgba(168,133,247,0.1)",
                          color: "var(--glow-purple)",
                          textTransform: "capitalize",
                        }}
                      >
                        {product.category}
                      </span>
                    )}
                    {product.has_variants && product.variants && product.variants.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.5625rem",
                          padding: "0.125rem 0.375rem",
                          borderRadius: "0.25rem",
                          background: "rgba(6,182,212,0.1)",
                          color: "var(--glow-cyan)",
                        }}
                      >
                        {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                  {/* Toggle activate/deactivate */}
                  <button
                    onClick={() => handleToggleStock(product.id, product.in_stock)}
                    disabled={togglingId === product.id}
                    title={product.in_stock ? "Deactivate" : "Activate"}
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255,255,255,0.03)",
                      color: product.in_stock ? "var(--glow-green)" : "var(--text-muted)",
                      cursor: togglingId === product.id ? "wait" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {togglingId === product.id ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : product.in_stock ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                    title="Edit"
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255,255,255,0.03)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Pencil size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    title="Delete"
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255,255,255,0.03)",
                      color: "var(--text-muted)",
                      cursor: deletingId === product.id ? "wait" : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-red)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; }}
                  >
                    {deletingId === product.id ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

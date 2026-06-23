"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Store, Product } from "@/types";
import { DashboardProductGrid } from "@/components/DashboardProductGrid";
import { ProductForm } from "@/components/ProductForm";
import { StoreSettings } from "@/components/StoreSettings";
import { ShareCard } from "@/components/ShareCard";
import { QrCode } from "lucide-react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { BatchUpload } from "@/components/BatchUpload";
import { ThemeSettings } from "@/components/ThemeSettings";
import { OrderManager } from "@/components/OrderManager";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getProductLimit, getDaysRemaining, isTrial, formatNaira, getPlanName, hasReachedProductLimit } from "@/lib/subscription";
import {
  Settings,
  LogOut,
  ExternalLink,
  Package,
  Share2,
  BarChart3,
  Upload,
  Palette,
  ShoppingCart,
  Link as LinkIcon,
  MoreVertical,
  X,
  AlertTriangle,
  Clock,
  Crown,
  LifeBuoy,
} from "lucide-react";

interface DashboardClientProps {
  store: Store;
  products: Product[];
}

/* ── Shared styles ──────────────────────────────── */

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
};

const iconBtn: React.CSSProperties = {
  width: "2.75rem",
  height: "2.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0.5rem",
  border: "1px solid var(--border-subtle)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  transition: "all 0.2s",
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

export function DashboardClient({
  store: initialStore,
  products: initialProducts,
}: DashboardClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [store, setStore] = useState<Store>(initialStore);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const supabase = createClient();

  // Subscription info
  const productLimit = getProductLimit(store);
  const daysLeft = getDaysRemaining(store);
  const inTrial = isTrial(store);
  const atLimit = hasReachedProductLimit(store, products.length);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?store_id=${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

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

  const handleStoreUpdated = (updatedStore: Store) => {
    setStore(updatedStore);
    setShowSettings(false);
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <StoreAvatar name={store.name} logoUrl={store.logo_url} size="md" />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {store.name}
              </h1>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                stallhq.link/{store.slug}
              </p>
            </div>
          </div>

          {/* Desktop actions */}
          {isDesktop && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {[
                { icon: Share2, label: "Share", onClick: () => setShowShareCard(true) },
                { icon: BarChart3, label: "Analytics", onClick: () => setShowAnalytics(true) },
                { icon: ShoppingCart, label: "Orders", onClick: () => setShowOrders(true) },
                { icon: Palette, label: "Theme", onClick: () => setShowTheme(true) },
              ].map(({ icon: Icon, label, onClick }) => (
                <button key={label} onClick={onClick} style={iconBtn} className="icon-button" title={label}>
                  <Icon size={16} />
                </button>
              ))}

              <div style={{ width: "1px", height: "1.25rem", background: "var(--border-subtle)", margin: "0 0.25rem" }} />

              <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={iconBtn} className="icon-button" title="View Store">
                <ExternalLink size={16} />
              </a>
              <button onClick={() => setShowSettings(true)} style={iconBtn} className="icon-button" title="Settings">
                <Settings size={16} />
              </button>
              <a href="/dashboard/support" style={iconBtn} className="icon-button" title="Support">
                <LifeBuoy size={16} />
              </a>
              <button onClick={handleLogout} style={iconBtn} className="icon-button" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile menu */}
          {!isDesktop && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={iconBtn}
                className="icon-button"
              >
                <MoreVertical size={20} />
              </button>

              {showMobileMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowMobileMenu(false)} />
                  <div
                    className="scale-in"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: "0.5rem",
                      width: "12rem",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "0.75rem",
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                      zIndex: 50,
                      padding: "0.375rem 0",
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { icon: Share2, label: "Share Store", onClick: () => { setShowShareCard(true); setShowMobileMenu(false); } },
                      { icon: BarChart3, label: "Analytics", onClick: () => { setShowAnalytics(true); setShowMobileMenu(false); } },
                      { icon: ShoppingCart, label: "Orders", onClick: () => { setShowOrders(true); setShowMobileMenu(false); } },
                      { icon: Palette, label: "Theme", onClick: () => { setShowTheme(true); setShowMobileMenu(false); } },
                      { icon: Upload, label: "Batch Upload", onClick: () => { setShowBatchUpload(true); setShowMobileMenu(false); } },
                      { icon: LifeBuoy, label: "Support", onClick: () => { window.location.href = "/dashboard/support"; } },
                    ].map(({ icon: Icon, label, onClick }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", minHeight: "44px" }}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}

                    <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0.375rem 0" }} />

                    <a
                      href={`/${store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", textDecoration: "none", minHeight: "44px" }}
                    >
                      <ExternalLink size={16} />
                      View Store
                    </a>
                    <button
                      onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", minHeight: "44px" }}
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--glow-red)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", minHeight: "44px" }}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────── */}
      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {/* Product count */}
          <div style={{ ...glassCard, padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={16} style={{ color: "var(--glow-purple)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", ...labelStyle, marginBottom: 0 }}>Products</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700 }}>{products.length}</p>
            </div>
          </div>

          {/* Store URL */}
          <div style={{ ...glassCard, padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.1))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LinkIcon size={16} style={{ color: "var(--glow-cyan)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", ...labelStyle, marginBottom: 0 }}>Store URL</p>
              <a
                href={`/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-cyan)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textDecoration: "none" }}
              >
                stallhq.link/{store.slug}
              </a>
            </div>
          </div>
        </div>

        {/* ── Subscription Banner ──────────────────────── */}
        {/* Trial urgency banner */}
        {inTrial && daysLeft !== null && daysLeft <= 3 && (
          <div style={{
            ...glassCard,
            padding: "0.875rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(239,68,68,0.06)",
            borderColor: "rgba(239,68,68,0.2)",
          }}>
            <div style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "0.5rem",
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <AlertTriangle size={14} style={{ color: "var(--glow-red)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                {daysLeft === 0 ? "Trial expires today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial`}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                Upgrade now to keep your store live and products listed.
              </p>
            </div>
            <a
              href="/upgrade"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "var(--glow-red)",
                color: "white",
                borderRadius: "0.5rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Upgrade
            </a>
          </div>
        )}

        {/* Plan info bar */}
        <div style={{
          ...glassCard,
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
              background: inTrial ? "rgba(168,133,247,0.1)" : "rgba(16,185,129,0.1)",
              color: inTrial ? "var(--glow-purple)" : "var(--glow-green)",
              fontSize: "0.6875rem",
              fontWeight: 600,
            }}>
              {inTrial ? <Clock size={10} /> : <Crown size={10} />}
              {getPlanName(store.plan)}
            </div>
            {productLimit > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {products.length}/{productLimit} products
              </span>
            )}
            {productLimit === 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {products.length} products (unlimited)
              </span>
            )}
            {daysLeft !== null && (
              <span style={{ fontSize: "0.6875rem", color: daysLeft <= 3 ? "var(--glow-red)" : "var(--text-muted)" }}>
                {inTrial ? `${daysLeft}d left` : `Expires in ${daysLeft}d`}
              </span>
            )}
          </div>
          {inTrial && (
            <a
              href="/upgrade"
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--glow-purple)",
                textDecoration: "none",
              }}
            >
              View Plans →
            </a>
          )}
        </div>

        {/* Products section */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.125rem" }}>Products</h2>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                {products.length} product{products.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setShowBatchUpload(true)}
                className="glow-button-secondary"
                style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem" }}
              >
                <Upload size={14} />
                {isDesktop && <span>Batch Upload</span>}
              </button>
              <a
                href="/dashboard/products"
                className="glow-button"
                style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                Manage Products
              </a>
            </div>
          </div>

          {products.length > 0 ? (
            <DashboardProductGrid
              products={products}
              onEdit={(product) => { router.push(`/dashboard/products/${product.id}`); }}
              onToggleStock={handleToggleStock}
              togglingId={togglingId}
              storeSlug={store.slug}
              storeName={store.name}
            />
          ) : (
            <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
              <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(16,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Package size={20} style={{ color: "var(--glow-purple)" }} />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>No products yet</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>Add your first product to start selling.</p>
              <a
                href="/dashboard/products/new"
                className="glow-button"
                style={{ padding: "0.75rem 1.5rem", fontSize: "0.8125rem", margin: "0 auto", textDecoration: "none", display: "inline-flex" }}
              >
                + Add Product
              </a>
            </div>
          )}
        </section>
      </main>

      {/* ── Modals ─────────────────────────────────── */}
      {showProductForm && (
        <ProductForm
          store={store}
          product={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSaved={handleProductSaved}
        />
      )}
      {showSettings && (
        <StoreSettings store={store} onClose={() => setShowSettings(false)} onSaved={handleStoreUpdated} />
      )}
      {showShareCard && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowShareCard(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "28rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", padding: "1.5rem", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Share Your Store</h2>
              <button onClick={() => setShowShareCard(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "1rem", background: "white", borderRadius: "0.75rem", display: "inline-block", marginBottom: "1rem" }}>
              <QrCode size={180} strokeWidth={1} color="#000" />
            </div>
            <p style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-secondary)", padding: "0.625rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", marginBottom: "1rem", wordBreak: "break-all" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/{store.slug}
            </p>
            <ShareCard storeSlug={store.slug} storeName={store.name} />
            <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--glow-cyan)", textDecoration: "none", marginTop: "0.75rem" }}>
              <ExternalLink size={14} /> View Live Store
            </a>
          </div>
        </div>
      )}
      {showAnalytics && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowAnalytics(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "42rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart3 size={18} style={{ color: "var(--glow-purple)" }} />
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Analytics</h2>
              </div>
              <button onClick={() => setShowAnalytics(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <AnalyticsDashboard store={store} />
            </div>
          </div>
        </div>
      )}
      {showBatchUpload && (
        <BatchUpload store={store} onClose={() => setShowBatchUpload(false)} onComplete={() => { fetchProducts(); setShowBatchUpload(false); }} />
      )}
      {showTheme && (
        <ThemeSettings store={store} onClose={() => setShowTheme(false)} onSaved={handleStoreUpdated} />
      )}
      {showOrders && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowOrders(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "42rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShoppingCart size={18} style={{ color: "var(--glow-purple)" }} />
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Orders</h2>
              </div>
              <button onClick={() => setShowOrders(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <OrderManager storeId={store.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

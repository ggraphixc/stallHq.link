"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Store, Product } from "@/types";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { StoreFooter } from "@/components/StoreFooter";
import { VisitorBadge } from "@/components/VisitorBadge";
import { StoreHoursBadge } from "@/components/StoreHoursBadge";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFavorites } from "@/hooks/useFavorites";
import { useAlert } from "@/contexts/AlertContext";
import { ShareCard } from "@/components/ShareCard";
import { createClient } from "@/lib/supabase/client";
import { hasWhatsApp, hasInstagram, generateInstagramUrl } from "@/lib/channel";
import {
  MessageCircle,
  Instagram,
  Clock,
  MapPin,
  Mail,
  Package,
  Share2,
  ChevronRight,
  Store as StoreIcon,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

interface StorePageProps {
  store: Store;
  products: Product[];
}

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
      "rgba(168,133,247,0.08)",
      "rgba(6,182,212,0.06)",
      "rgba(16,185,129,0.05)",
      "rgba(236,72,153,0.04)",
    ];

    const dots = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
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
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

/* ── Styles ─────────────────────────────────────── */

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "0.75rem",
};

/* ── Main Component ─────────────────────────────── */

export function StorePage({ store, products }: StorePageProps) {
  const { trackVisit } = useAnalytics();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { error: showError, success: showSuccess } = useAlert();
  const supabase = createClient();

  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "about">("products");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    trackVisit(store.id);
  }, [store.id, trackVisit]);

  // Check if current user is the store owner
  useEffect(() => {
    const checkOwner = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === store.user_id) {
        setIsOwner(true);
      }
    };
    checkOwner();
  }, [store.user_id, supabase]);

  // Categories
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const inStockCount = products.filter((p) => p.in_stock).length;

  const themeStyles = useMemo(() => {
    if (!store.theme) return {};
    const styles: Record<string, string> = {};
    if (store.theme.primaryColor) {
      styles["--glow-purple"] = store.theme.primaryColor;
      styles["--border-glow"] = `${store.theme.primaryColor}4d`;
    }
    if (store.theme.accentColor) {
      styles["--glow-cyan"] = store.theme.accentColor;
    }
    if (store.theme.backgroundColor) {
      styles["--bg-primary"] = store.theme.backgroundColor;
    }
    if (store.theme.cardBackground) {
      styles["--bg-card"] = store.theme.cardBackground;
      styles["--bg-card-hover"] = `${store.theme.cardBackground}e6`;
    }
    if (store.theme.textColor) {
      styles["--text-primary"] = store.theme.textColor;
    }
    if (store.theme.fontHeading) {
      styles["--font-display"] = store.theme.fontHeading;
    }
    if (store.theme.fontBody) {
      styles["--font-body"] = store.theme.fontBody;
    }
    return styles;
  }, [store.theme]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative", ...themeStyles }}>
      <Particles />

      <StoreHeader store={store} />

      {/* ── Hero Banner ─────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {store.banner_url ? (
          <div style={{ position: "relative", height: "clamp(12rem, 30vw, 18rem)", overflow: "hidden" }}>
            <img
              src={store.banner_url}
              alt={`${store.name} banner`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, var(--bg-primary) 0%, rgba(6,6,11,0.4) 50%, transparent 100%)",
            }} />
          </div>
        ) : (
          <div style={{
            height: "clamp(8rem, 20vw, 12rem)",
            background: "linear-gradient(135deg, rgba(168,133,247,0.08), rgba(6,182,212,0.06), rgba(16,185,129,0.04))",
            borderBottom: "1px solid var(--border-subtle)",
          }} />
        )}

        {/* ── Store Info Card ────────────────────────── */}
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", position: "relative", zIndex: 2, marginTop: store.banner_url ? "-5rem" : "-3rem" }}>
          <div style={{ ...glassCard, padding: "clamp(1rem, 3vw, 1.5rem)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Top row: avatar + name + meta */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
              <StoreAvatar name={store.name} logoUrl={store.logo_url} size="xl" rounded="2xl" />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: "clamp(1.125rem, 4vw, 1.75rem)", fontWeight: 800, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: "0.5rem", lineHeight: 1.2 }}>
                  {store.name}
                  {store.verified && (
                    <span title="Verified Vendor" style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "1.25rem",
                      height: "1.25rem",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #06b6d4, #10b981)",
                      flexShrink: 0,
                    }}>
                      <ShieldCheck size={10} style={{ color: "white" }} />
                    </span>
                  )}
                </h1>
                {store.description && (
                  <p style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.25rem",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {store.description}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <VisitorBadge storeId={store.id} />
                  <StoreHoursBadge storeHours={store.store_hours} />
                  {store.category && (
                    <span style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      background: "rgba(168,133,247,0.1)",
                      color: "var(--glow-purple)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}>
                      {store.category}
                    </span>
                  )}
                </div>

                {/* Share */}
                <div style={{ marginTop: "0.5rem" }}>
                  <ShareCard storeSlug={store.slug} storeName={store.name} />
                </div>
              </div>
            </div>

            {/* Channel CTAs — full width row below store info */}
            <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
              {hasWhatsApp(store.whatsapp_number) && (
                <a
                  href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, good day ${store.name} 👋`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-button whatsapp-button"
                  style={{
                    flex: 1,
                    padding: "0.625rem 1rem",
                    fontSize: "0.8125rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    minHeight: "44px",
                  }}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              {hasInstagram(store.instagram_handle) && (
                <a
                  href={generateInstagramUrl(store.instagram_handle!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-button"
                  style={{
                    flex: 1,
                    padding: "0.625rem 1rem",
                    fontSize: "0.8125rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: "linear-gradient(135deg, #E1306C, #833AB4)",
                    color: "white",
                    minHeight: "44px",
                  }}
                >
                  <Instagram size={16} />
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────── */}
      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0" }}>
          {[
            { key: "products" as const, label: "Products", icon: Package, count: products.length },
            { key: "about" as const, label: "About", icon: StoreIcon },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "0.75rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: "transparent",
                border: "none",
                borderBottom: activeTab === key ? "2px solid var(--glow-purple)" : "2px solid transparent",
                color: activeTab === key ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "-1px",
              }}
            >
              <Icon size={14} />
              {label}
              {count !== undefined && (
                <span style={{
                  fontSize: "0.625rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "9999px",
                  background: activeTab === key ? "rgba(168,133,247,0.15)" : "var(--bg-card)",
                  color: activeTab === key ? "var(--glow-purple)" : "var(--text-muted)",
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Products Tab ──────────────────────────── */}
        {activeTab === "products" && (
          <div>
            {/* Category filter */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                <button
                  onClick={() => setSelectedCategory("")}
                  style={{
                    padding: "0.5rem 0.875rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    background: !selectedCategory ? "var(--glow-purple)" : "var(--bg-card)",
                    color: !selectedCategory ? "white" : "var(--text-secondary)",
                    transition: "all 0.2s",
                  }}
                >
                  All ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: selectedCategory === cat ? "var(--glow-purple)" : "var(--bg-card)",
                      color: selectedCategory === cat ? "white" : "var(--text-secondary)",
                      transition: "all 0.2s",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Product count */}
            <div style={{ ...sectionLabel, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span>{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}</span>
              {inStockCount < products.length && (
                <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: "normal", fontSize: "0.6875rem" }}>
                  {inStockCount} active
                </span>
              )}
            </div>

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={filteredProducts}
                storeId={store.id}
                storeSlug={store.slug}
                storeName={store.name}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <Package size={20} style={{ color: "var(--glow-purple)" }} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  {selectedCategory ? "No products in this category" : "No products yet"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {selectedCategory ? "Try a different category." : "Check back soon!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── About Tab ─────────────────────────────── */}
        {activeTab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "40rem" }}>
            {/* About */}
            {store.description && (
              <div style={{ ...glassCard, padding: "1.25rem" }}>
                <div style={sectionLabel}>About</div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {store.description}
                </p>
              </div>
            )}

            {/* Store Hours */}
            {store.store_hours?.enabled && (
              <div style={{ ...glassCard, padding: "1.25rem" }}>
                <div style={{ ...sectionLabel, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Clock size={12} />
                  Store Hours
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {Object.entries(store.store_hours.days).map(([day, info]) => {
                    const dayLabels: Record<string, string> = {
                      mon: "Monday", tue: "Tuesday", wed: "Wednesday",
                      thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
                    };
                    const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().slice(0, 3);
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem 0.625rem",
                          borderRadius: "0.5rem",
                          background: isToday ? "rgba(168,133,247,0.06)" : "transparent",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <span style={{ fontWeight: isToday ? 600 : 400, color: isToday ? "var(--glow-purple)" : "var(--text-secondary)" }}>
                          {dayLabels[day]}
                          {isToday && <span style={{ fontSize: "0.625rem", marginLeft: "0.375rem", opacity: 0.7 }}>(today)</span>}
                        </span>
                        <span style={{ color: info.closed ? "var(--glow-red)" : "var(--text-muted)", fontSize: "0.75rem" }}>
                          {info.closed ? "Closed" : `${info.open} – ${info.close}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            <div style={{ ...glassCard, padding: "1.25rem" }}>
              <div style={{ ...sectionLabel, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Mail size={12} />
                Contact
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {hasWhatsApp(store.whatsapp_number) && (
                  <a
                    href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, good day ${store.name} 👋`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "rgba(37,211,102,0.06)",
                      border: "1px solid rgba(37,211,102,0.15)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,0.06)"; }}
                  >
                    <MessageCircle size={18} style={{ color: "#25D366", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>WhatsApp</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{store.whatsapp_number}</p>
                    </div>
                    <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                  </a>
                )}
                {hasInstagram(store.instagram_handle) && (
                  <a
                    href={generateInstagramUrl(store.instagram_handle!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "rgba(225,48,108,0.06)",
                      border: "1px solid rgba(225,48,108,0.15)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(225,48,108,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(225,48,108,0.06)"; }}
                  >
                    <Instagram size={18} style={{ color: "#E1306C", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>Instagram</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>@{store.instagram_handle!.replace(/^@/, "")}</p>
                    </div>
                    <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                  </a>
                )}
                {store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-card-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-card)"; }}
                  >
                    <Mail size={18} style={{ color: "var(--glow-cyan)", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>Email</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.email}</p>
                    </div>
                    <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                  </a>
                )}
              </div>
            </div>

            {/* Trust */}
            <div style={{ ...glassCard, padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldCheck size={16} style={{ color: "var(--glow-green)" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Powered by stallHq</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  {hasWhatsApp(store.whatsapp_number) && hasInstagram(store.instagram_handle)
                    ? "Secure checkout via WhatsApp & Instagram"
                    : hasWhatsApp(store.whatsapp_number)
                      ? "Secure checkout via WhatsApp"
                      : hasInstagram(store.instagram_handle)
                        ? "Secure checkout via Instagram"
                        : "Secure checkout via stallHq"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} />

      {/* ── Owner Dashboard Button ────────────────── */}
      {isOwner && (
        <a
          href="/dashboard"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
            color: "white",
            fontSize: "0.8125rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 24px rgba(168,133,247,0.3)",
            zIndex: 50,
            transition: "transform 0.2s, box-shadow 0.2s",
            minHeight: "44px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 6px 32px rgba(168,133,247,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 24px rgba(168,133,247,0.3)";
          }}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </a>
      )}
    </div>
  );
}

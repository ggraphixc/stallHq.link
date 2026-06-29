"use client";

import { useState, useEffect, useRef } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Activity, RefreshCw, Server, Database, Mail, CreditCard,
  Key, Globe, CheckCircle2, XCircle, Zap, HardDrive,
  Shield, Cpu, Store, Package, ShoppingCart, Star,
  TrendingUp, Users, MessageSquare, Link as LinkIcon,
  BarChart3, Clock, ArrowUpRight
} from "lucide-react";

interface SystemData {
  overview: Record<string, number>;
  environment: Record<string, string | boolean | undefined>;
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
      "rgba(168,133,247,0.12)",
      "rgba(6,182,212,0.1)",
      "rgba(16,185,129,0.08)",
      "rgba(236,72,153,0.06)",
    ];

    const dots = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
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

/* ── Shared styles ──────────────────────────────── */
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "0.125rem",
};

export function AdminSystem() {
  const { error: showError } = useAlert();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch {
      showError("Failed to load system data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
      </div>
    );
  }

  const env = data?.environment || {};
  const ov = data?.overview || {};
  const p = (ov.period || {}) as Record<string, number>;

  const periodVendors = period === "today" ? (p.vendorsToday || 0) : period === "week" ? (p.vendorsWeek || 0) : (p.vendorsMonth || 0);
  const periodOrders = period === "today" ? (p.ordersToday || 0) : period === "week" ? (p.ordersWeek || 0) : (p.ordersMonth || 0);
  const periodRevenue = period === "today" ? (p.revenueToday || 0) : period === "week" ? (p.revenueWeek || 0) : (p.revenueMonth || 0);

  const formatNaira = (v: number) => `\u20A6${v.toLocaleString()}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />

      <div style={{
        padding: isDesktop ? "clamp(1.5rem,3vw,2rem)" : "1rem",
        maxWidth: "72rem",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}>
        {/* ── Header ─────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: isDesktop ? "center" : "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexDirection: isDesktop ? "row" : "column",
          gap: "1rem",
        }}>
          <div>
            <h1 style={{
              fontSize: isDesktop ? "1.5rem" : "1.25rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <Activity size={20} style={{ color: "var(--glow-purple)" }} />
              Platform Overview
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Real-time StallHq platform metrics
              {lastChecked && <span> · {lastChecked.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button onClick={fetchData} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 1rem", fontSize: "0.8125rem",
            background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
            borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer",
            minHeight: "44px", flexShrink: 0,
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Primary Stats (4 cards) ────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}>
          <StatCard
            icon={<Store size={18} />}
            iconBg="linear-gradient(135deg, rgba(168,133,247,0.15), rgba(99,102,241,0.1))"
            iconColor="var(--glow-purple)"
            label="Total Stores"
            value={ov.totalStores}
            subtitle={`${ov.paidStores} paid, ${ov.trialStores} trial`}
            accentColor="var(--glow-purple)"
          />
          <StatCard
            icon={<Package size={18} />}
            iconBg="linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.1))"
            iconColor="var(--glow-cyan)"
            label="Total Products"
            value={ov.totalProducts}
            subtitle={`${ov.activeProducts} in stock`}
            accentColor="var(--glow-cyan)"
          />
          <StatCard
            icon={<ShoppingCart size={18} />}
            iconBg="linear-gradient(135deg, rgba(16,185,129,0.15), rgba(34,197,94,0.1))"
            iconColor="var(--glow-green)"
            label="Total Orders"
            value={ov.totalOrders}
            subtitle={`${ov.pendingOrders} pending`}
            accentColor="var(--glow-green)"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            iconBg="linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))"
            iconColor="#f59e0b"
            label="Total Revenue"
            value={formatNaira(ov.totalRevenue || 0)}
            subtitle={`${formatNaira(ov.revenueLast7d || 0)} last 7d`}
            accentColor="#f59e0b"
            large
          />
        </div>

        {/* ── Secondary Stats (6 cards) ──────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(6, 1fr)" : "repeat(3, 1fr)",
          gap: "0.625rem",
          marginBottom: "1.25rem",
        }}>
          <SmallStatCard
            icon={<Shield size={14} />}
            label="Active Subscriptions"
            value={ov.activeStores}
            color="var(--glow-green)"
          />
          <SmallStatCard
            icon={<Clock size={14} />}
            label="Pending Orders"
            value={ov.pendingOrders}
            color="#f59e0b"
          />
          <SmallStatCard
            icon={<CheckCircle2 size={14} />}
            label="Delivered Orders"
            value={ov.deliveredOrders}
            color="var(--glow-green)"
          />
          <SmallStatCard
            icon={<XCircle size={14} />}
            label="Cancelled Orders"
            value={ov.cancelledOrders}
            color="var(--glow-red)"
          />
          <SmallStatCard
            icon={<Star size={14} />}
            label="Reviews"
            value={ov.totalReviews}
            color="#f59e0b"
          />
          <SmallStatCard
            icon={<Star size={14} />}
            label="Avg Rating"
            value={ov.avgRating}
            color="#f59e0b"
          />
        </div>

        {/* ── Channel Stats (5 cards) ────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(5, 1fr)" : "repeat(3, 1fr)",
          gap: "0.625rem",
          marginBottom: "1.25rem",
        }}>
          <SmallStatCard
            icon={<ArrowUpRight size={14} />}
            label="New Stores (7d)"
            value={ov.newStoresLast7d}
            color="var(--glow-cyan)"
          />
          <SmallStatCard
            icon={<ArrowUpRight size={14} />}
            label="New Orders (7d)"
            value={ov.newOrdersLast7d}
            color="var(--glow-cyan)"
          />
          <SmallStatCard
            icon={<MessageSquare size={14} />}
            label="WhatsApp Stores"
            value={ov.whatsappStores}
            color="var(--glow-green)"
          />
          <SmallStatCard
            icon={<LinkIcon size={14} />}
            label="Instagram Stores"
            value={ov.instagramStores}
            color="#e1306c"
          />
          <SmallStatCard
            icon={<Globe size={14} />}
            label="Both Channels"
            value={ov.bothChannels}
            color="var(--glow-purple)"
          />
        </div>

        {/* ── Period Reports ─────────────────────────── */}
        <div style={{ ...glassCard, padding: isDesktop ? "1.25rem" : "1rem", marginBottom: "1.25rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={16} style={{ color: "var(--glow-purple)" }} />
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Period Reports</h2>
            </div>
            <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-primary)", borderRadius: "0.5rem", padding: "0.125rem" }}>
              {(["today", "week", "month"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                  fontSize: "0.75rem", fontWeight: 600, border: "none",
                  background: period === p ? "rgba(168,133,247,0.15)" : "transparent",
                  color: period === p ? "var(--glow-purple)" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.15s",
                  minHeight: "32px",
                }}>
                  {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
            gap: "0.75rem",
          }}>
            <PeriodStatCard
              icon={<Users size={16} />}
              label="New Vendors"
              value={periodVendors}
              color="var(--glow-purple)"
            />
            <PeriodStatCard
              icon={<ShoppingCart size={16} />}
              label="New Orders"
              value={periodOrders}
              color="var(--glow-cyan)"
            />
            <PeriodStatCard
              icon={<TrendingUp size={16} />}
              label="Revenue"
              value={formatNaira(periodRevenue)}
              color="var(--glow-green)"
              large
            />
          </div>
        </div>

        {/* ── Environment Configuration ───────────────── */}
        <div style={{ ...glassCard, padding: isDesktop ? "1.25rem" : "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Key size={16} style={{ color: "#f59e0b" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Environment Configuration</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
            gap: "0.625rem",
          }}>
            {[
              { label: "Node Environment", key: "nodeEnv", icon: <Server size={14} />, ok: env.nodeEnv === "production", detail: String(env.nodeEnv) },
              { label: "App URL", key: "appUrl", icon: <Globe size={14} />, ok: !!env.appUrl, detail: String(env.appUrl) },
              { label: "Supabase URL", key: "supabaseUrl", icon: <Database size={14} />, ok: !!env.supabaseUrl, detail: String(env.supabaseUrl) },
              { label: "Service Role Key", key: "hasServiceRoleKey", icon: <Shield size={14} />, ok: !!env.hasServiceRoleKey },
              { label: "Brevo API Key", key: "hasBrevoKey", icon: <Mail size={14} />, ok: !!env.hasBrevoKey },
              { label: "Paystack Secret Key", key: "hasPaystackKey", icon: <CreditCard size={14} />, ok: !!env.hasPaystackKey },
              { label: "Cron Secret", key: "hasCronSecret", icon: <Key size={14} />, ok: !!env.hasCronSecret },
            ].map(({ label, icon, ok, detail }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem",
                border: `1px solid ${ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span style={{ color: ok ? "var(--glow-green)" : "var(--glow-red)", flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                  {detail && <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", maxWidth: isDesktop ? "120px" : "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</span>}
                  {ok ? <CheckCircle2 size={14} style={{ color: "var(--glow-green)" }} /> : <XCircle size={14} style={{ color: "var(--glow-red)" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── API Endpoints ──────────────────────────── */}
        <div style={{ ...glassCard, padding: isDesktop ? "1.25rem" : "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <HardDrive size={16} style={{ color: "var(--glow-green)" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>API Endpoints</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
            gap: "0.5rem",
          }}>
            {[
              { path: "/api/auth/login", method: "POST", desc: "User login" },
              { path: "/api/auth/signup", method: "POST", desc: "User registration" },
              { path: "/api/stores", method: "GET/POST/PATCH", desc: "Store CRUD" },
              { path: "/api/products", method: "GET/POST", desc: "Product management" },
              { path: "/api/orders", method: "GET/PATCH", desc: "Order management" },
              { path: "/api/payments/initialize", method: "POST", desc: "Paystack checkout" },
              { path: "/api/webhooks/paystack", method: "POST", desc: "Payment webhook" },
              { path: "/api/cron/check-expiry", method: "GET", desc: "Expiry reminders" },
              { path: "/api/admin/stores", method: "GET", desc: "Admin: all stores" },
              { path: "/api/admin/users", method: "GET", desc: "Admin: all users" },
              { path: "/api/admin/orders", method: "GET/PATCH", desc: "Admin: all orders" },
              { path: "/api/admin/system", method: "GET", desc: "System health" },
            ].map(({ path, method, desc }) => (
              <div key={path} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.5rem 0.75rem", background: "var(--bg-primary)", borderRadius: "0.375rem",
                border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span style={{
                    padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.5625rem",
                    fontWeight: 700, color: "var(--glow-cyan)", background: "rgba(6,182,212,0.1)",
                    fontFamily: "monospace", flexShrink: 0,
                  }}>{method}</span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path}</span>
                </div>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: "0.5rem" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card (primary, large) ─────────────────── */
function StatCard({ icon, iconBg, iconColor, label, value, subtitle, accentColor, large }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
  subtitle: string;
  accentColor: string;
  large?: boolean;
}) {
  return (
    <div style={{ ...glassCard, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={labelStyle}>{label}</span>
        <div style={{
          width: "2rem", height: "2rem", borderRadius: "0.5rem",
          background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
      <p style={{
        fontSize: large ? "1.5rem" : "1.25rem",
        fontWeight: 700,
        color: accentColor,
        lineHeight: 1.2,
      }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{subtitle}</p>
    </div>
  );
}

/* ── Small Stat Card ────────────────────────────── */
function SmallStatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div style={{ ...glassCard, padding: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p style={{ fontSize: "1rem", fontWeight: 700, color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/* ── Period Stat Card ───────────────────────────── */
function PeriodStatCard({ icon, label, value, color, large }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  large?: boolean;
}) {
  return (
    <div style={{
      ...glassCard,
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      <div style={{
        width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem",
        background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
        <p style={{
          fontSize: large ? "1.25rem" : "1rem",
          fontWeight: 700,
          color,
          lineHeight: 1.2,
        }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

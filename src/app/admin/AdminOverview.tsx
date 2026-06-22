"use client";

import { useState, useEffect } from "react";
import {
  Store, Users, ShoppingCart, TrendingUp, Star, Activity,
  AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Package,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";

interface SystemData {
  overview: {
    totalStores: number;
    trialStores: number;
    paidStores: number;
    activeStores: number;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    revenueLast7d: number;
    totalPaymentRevenue: number;
    totalReviews: number;
    avgRating: number;
    newStoresLast7d: number;
    newOrdersLast7d: number;
  };
  environment: Record<string, string | boolean | undefined>;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
};

export function AdminOverview() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load system data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <AlertTriangle size={24} style={{ color: "var(--glow-red)", marginBottom: "0.5rem" }} />
        <p style={{ color: "var(--text-muted)" }}>{error || "No data"}</p>
      </div>
    );
  }

  const { overview: o, environment: env } = data;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} style={{ color: "var(--glow-purple)" }} />
            Platform Overview
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Real-time StallHq platform metrics</p>
        </div>
        <button onClick={fetchData} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
          fontSize: "0.8125rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
          borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Primary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Stores", value: o.totalStores, icon: <Store size={18} />, color: "var(--glow-purple)", sub: `${o.paidStores} paid, ${o.trialStores} trial` },
          { label: "Total Products", value: o.totalProducts, icon: <Package size={18} />, color: "var(--glow-cyan)", sub: `${o.activeProducts} in stock` },
          { label: "Total Orders", value: o.totalOrders, icon: <ShoppingCart size={18} />, color: "var(--glow-green)", sub: `${o.pendingOrders} pending` },
          { label: "Total Revenue", value: `₦${o.totalRevenue.toLocaleString()}`, icon: <TrendingUp size={18} />, color: "var(--glow-green)", sub: `₦${o.revenueLast7d.toLocaleString()} last 7d` },
        ].map((stat) => (
          <div key={stat.label} style={{ ...glassCard, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: stat.color, marginBottom: "0.25rem" }}>{stat.value}</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Active Subscriptions", value: o.activeStores, icon: <CheckCircle2 size={14} />, color: "var(--glow-green)" },
          { label: "Pending Orders", value: o.pendingOrders, icon: <Clock size={14} />, color: "#eab308" },
          { label: "Delivered Orders", value: o.deliveredOrders, icon: <CheckCircle2 size={14} />, color: "var(--glow-green)" },
          { label: "Cancelled Orders", value: o.cancelledOrders, icon: <XCircle size={14} />, color: "var(--glow-red)" },
          { label: "Reviews", value: o.totalReviews, icon: <Star size={14} />, color: "var(--glow-amber)" },
          { label: "Avg Rating", value: o.avgRating, icon: <Star size={14} />, color: "var(--glow-amber)" },
          { label: "New Stores (7d)", value: o.newStoresLast7d, icon: <ArrowUpRight size={14} />, color: "var(--glow-cyan)" },
          { label: "New Orders (7d)", value: o.newOrdersLast7d, icon: <ArrowUpRight size={14} />, color: "var(--glow-green)" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...glassCard, padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ ...glassCard, padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={14} /> Order Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { label: "Pending", count: o.pendingOrders, color: "#eab308", total: o.totalOrders },
              { label: "Confirmed", count: o.confirmedOrders, color: "#3b82f6", total: o.totalOrders },
              { label: "Delivered", count: o.deliveredOrders, color: "var(--glow-green)", total: o.totalOrders },
              { label: "Cancelled", count: o.cancelledOrders, color: "var(--glow-red)", total: o.totalOrders },
            ].map(({ label, count, color, total }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "70px" }}>{label}</span>
                <div style={{ flex: 1, height: "0.5rem", background: "var(--bg-primary)", borderRadius: "0.25rem", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total ? (count / total) * 100 : 0}%`, background: color, borderRadius: "0.25rem", transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", width: "30px", textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Health */}
        <div style={{ ...glassCard, padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={14} /> System Health
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { label: "Supabase", ok: !!env.hasServiceRoleKey },
              { label: "Brevo Email", ok: !!env.hasBrevoKey },
              { label: "Paystack", ok: !!env.hasPaystackKey },
              { label: "Cron Secret", ok: !!env.hasCronSecret },
              { label: "Node Env", ok: env.nodeEnv === "production", detail: env.nodeEnv },
            ].map(({ label, ok, detail }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  {detail && <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{detail}</span>}
                  <div style={{
                    width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                    background: ok ? "var(--glow-green)" : "var(--glow-red)",
                    boxShadow: ok ? "0 0 8px rgba(16,185,129,0.4)" : "0 0 8px rgba(239,68,68,0.4)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...glassCard, padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Manage Stores", href: "/admin/stores", color: "var(--glow-purple)" },
            { label: "View Users", href: "/admin/users", color: "var(--glow-cyan)" },
            { label: "All Orders", href: "/admin/orders", color: "var(--glow-green)" },
            { label: "Subscriptions", href: "/admin/subscriptions", color: "var(--glow-amber)" },
            { label: "Public Site", href: "/", color: "var(--text-muted)" },
          ].map(({ label, href, color }) => (
            <a key={label} href={href} style={{
              padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 500,
              background: `${color}15`, border: `1px solid ${color}30`,
              borderRadius: "0.5rem", color, textDecoration: "none", minHeight: "44px",
              display: "flex", alignItems: "center",
            }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

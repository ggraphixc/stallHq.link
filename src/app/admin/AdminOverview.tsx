"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import Link from "next/link";
import {
  Store, Users, ShoppingCart, TrendingUp, Star, Activity,
  AlertTriangle, CheckCircle2, XCircle, Clock, Package,
  ArrowUpRight, RefreshCw, LayoutDashboard, Settings, Eye, CreditCard,
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
    whatsappStores: number;
    instagramStores: number;
    bothChannels: number;
    period: {
      vendorsToday: number;
      vendorsWeek: number;
      vendorsMonth: number;
      ordersToday: number;
      ordersWeek: number;
      ordersMonth: number;
      revenueToday: number;
      revenueWeek: number;
      revenueMonth: number;
    };
  };
  environment: Record<string, string | boolean | undefined>;
}

export function AdminOverview() {
  const { error: showError } = useAlert();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      showError("Failed to load system data");
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

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <AlertTriangle size={24} style={{ color: "var(--glow-red)", marginBottom: "0.5rem" }} />
        <p style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const { overview: o, environment: env } = data;

  return (
    <div style={{ padding: "clamp(1rem,3vw,1.5rem)", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LayoutDashboard size={20} style={{ color: "var(--glow-purple)" }} />
            Platform Overview
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Real-time StallHq metrics</p>
        </div>
        <button onClick={fetchData} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
          fontSize: "0.75rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
          borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Hero Stats — 4 big numbers */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.75rem", marginBottom: "1.5rem",
      }}>
        {[
          { label: "Stores", value: o.totalStores, color: "var(--glow-purple)", sub: `${o.paidStores} paid · ${o.trialStores} trial` },
          { label: "Products", value: o.totalProducts, color: "var(--glow-cyan)", sub: `${o.activeProducts} in stock` },
          { label: "Orders", value: o.totalOrders, color: "var(--glow-green)", sub: `${o.pendingOrders} pending` },
          { label: "Revenue", value: `₦${o.totalRevenue.toLocaleString()}`, color: "var(--glow-green)", sub: `₦${o.revenueLast7d.toLocaleString()} this week` },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
            borderRadius: "0.75rem", padding: "1rem 1.25rem",
          }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{stat.label}</p>
            <p style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout: Period Reports + Quick Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {/* Period Reports */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", padding: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Period Reports</h3>
            <div style={{ display: "flex", gap: "0.125rem", background: "var(--bg-primary)", borderRadius: "0.375rem", padding: "0.125rem" }}>
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "0.25rem 0.625rem", fontSize: "0.6875rem", fontWeight: 500,
                    borderRadius: "0.25rem", border: "none", cursor: "pointer",
                    background: period === p ? "rgba(168,133,247,0.2)" : "transparent",
                    color: period === p ? "var(--glow-purple)" : "var(--text-muted)",
                    minHeight: "44px",
                  }}
                >
                  {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {[
              {
                label: "Vendors",
                value: period === "today" ? o.period.vendorsToday : period === "week" ? o.period.vendorsWeek : o.period.vendorsMonth,
                color: "var(--glow-purple)",
              },
              {
                label: "Orders",
                value: period === "today" ? o.period.ordersToday : period === "week" ? o.period.ordersWeek : o.period.ordersMonth,
                color: "var(--glow-green)",
              },
              {
                label: "Revenue",
                value: `₦${(period === "today" ? o.period.revenueToday : period === "week" ? o.period.revenueWeek : o.period.revenueMonth).toLocaleString()}`,
                color: "var(--glow-green)",
              },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color, marginTop: "0.25rem" }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", padding: "1.25rem",
        }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { label: "Stores", href: "/admin/stores", icon: <Store size={16} />, color: "var(--glow-purple)" },
              { label: "Users", href: "/admin/users", icon: <Users size={16} />, color: "var(--glow-cyan)" },
              { label: "Orders", href: "/admin/orders", icon: <ShoppingCart size={16} />, color: "var(--glow-green)" },
              { label: "Subscriptions", href: "/admin/subscriptions", icon: <CreditCard size={16} />, color: "var(--glow-amber)" },
            ].map(({ label, href, icon, color }) => (
              <Link key={label} href={href} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem", fontSize: "0.75rem", fontWeight: 500,
                background: `${color}10`, border: `1px solid ${color}20`,
                borderRadius: "0.5rem", color, textDecoration: "none", minHeight: "44px",
              }}>
                {icon} {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Metrics Grid — replaces 11 individual cards */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>Detailed Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1px", background: "var(--border-subtle)", borderRadius: "0.5rem", overflow: "hidden" }}>
          {[
            { label: "Active Subs", value: o.activeStores, color: "var(--glow-green)" },
            { label: "Pending", value: o.pendingOrders, color: "#eab308" },
            { label: "Delivered", value: o.deliveredOrders, color: "var(--glow-green)" },
            { label: "Cancelled", value: o.cancelledOrders, color: "var(--glow-red)" },
            { label: "Reviews", value: o.totalReviews, color: "var(--glow-amber)" },
            { label: "Avg Rating", value: o.avgRating, color: "var(--glow-amber)" },
            { label: "New (7d)", value: o.newStoresLast7d, color: "var(--glow-cyan)" },
            { label: "Orders (7d)", value: o.newOrdersLast7d, color: "var(--glow-green)" },
            { label: "WhatsApp", value: o.whatsappStores, color: "#25d366" },
            { label: "Instagram", value: o.instagramStores, color: "#e1306c" },
            { label: "Both", value: o.bothChannels, color: "var(--glow-purple)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--bg-secondary)", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: stat.color, marginTop: "0.125rem" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: Order Status + System Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Order Status */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", padding: "1.25rem",
        }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>Order Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { label: "Pending", count: o.pendingOrders, color: "#eab308" },
              { label: "Confirmed", count: o.confirmedOrders, color: "#3b82f6" },
              { label: "Delivered", count: o.deliveredOrders, color: "var(--glow-green)" },
              { label: "Cancelled", count: o.cancelledOrders, color: "var(--glow-red)" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "72px" }}>{label}</span>
                <div style={{ flex: 1, height: "0.375rem", background: "var(--bg-primary)", borderRadius: "0.25rem", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${o.totalOrders ? (count / o.totalOrders) * 100 : 0}%`, background: color, borderRadius: "0.25rem", transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, width: "24px", textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", padding: "1.25rem",
        }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>System Health</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Supabase", ok: !!env.hasServiceRoleKey },
              { label: "Brevo Email", ok: !!env.hasBrevoKey },
              { label: "Paystack", ok: !!env.hasPaystackKey },
              { label: "Cron Secret", ok: !!env.hasCronSecret },
              { label: "Node Env", ok: env.nodeEnv === "production", detail: env.nodeEnv },
            ].map(({ label, ok, detail }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  {detail && <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{detail}</span>}
                  <div style={{
                    width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                    background: ok ? "var(--glow-green)" : "var(--glow-red)",
                    boxShadow: ok ? "0 0 6px rgba(16,185,129,0.4)" : "0 0 6px rgba(239,68,68,0.4)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

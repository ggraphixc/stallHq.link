"use client";

import { useState, useEffect } from "react";
import { Store } from "@/types";
import { hasWhatsApp, hasInstagram } from "@/lib/channel";
import { BarChart3, Users, MessageCircle, Eye, TrendingUp, Calendar } from "lucide-react";

interface AnalyticsDashboardProps {
  store: Store;
}

interface AnalyticsData {
  totalVisits: number;
  whatsappClicks: number;
  productViews: number;
  conversionRate: string;
  topProducts: Array<{ id: string; name: string; count: number }>;
  chartData: Array<{ date: string; visits: number }>;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export function AnalyticsDashboard({ store }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?store_id=${store.id}&period=${period}`);
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Visits", value: data?.totalVisits || 0, icon: Users, color: "var(--glow-purple)" },
    { label: hasWhatsApp(store.whatsapp_number) && hasInstagram(store.instagram_handle) ? "Channel Clicks" : hasWhatsApp(store.whatsapp_number) ? "WhatsApp Clicks" : "Instagram Clicks", value: data?.whatsappClicks || 0, icon: MessageCircle, color: "var(--glow-green)" },
    { label: "Product Views", value: data?.productViews || 0, icon: Eye, color: "var(--glow-cyan)" },
    { label: "Conversion", value: `${data?.conversionRate || 0}%`, icon: TrendingUp, color: "var(--glow-green)" },
  ];

  const maxVisits = Math.max(...(data?.chartData.map((d) => d.visits) || [1]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Calendar size={14} style={{ color: "var(--text-muted)" }} />
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "0.375rem 0.625rem",
                borderRadius: "0.375rem",
                fontSize: "0.6875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: period === p ? "var(--glow-purple)" : "transparent",
                color: period === p ? "white" : "var(--text-muted)",
              }}
            >
              {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...glassCard, padding: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
              <stat.icon size={14} style={{ color: stat.color }} />
              <span style={{ ...labelStyle, fontSize: "0.625rem" }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...glassCard, padding: "1rem" }}>
        <h3 style={{ ...labelStyle, marginBottom: "0.75rem" }}>Daily Visits</h3>
        {loading ? (
          <div style={{ height: "8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" />
          </div>
        ) : data?.chartData && data.chartData.length > 0 ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "8rem" }}>
            {data.chartData.map((day, i) => (
              <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(to top, var(--glow-purple), rgba(168,133,247,0.5))",
                    borderRadius: "2px 2px 0 0",
                    height: `${(day.visits / maxVisits) * 100}%`,
                    minHeight: day.visits > 0 ? "4px" : "0px",
                  }}
                />
                {i % Math.ceil(data.chartData.length / 7) === 0 && (
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    {new Date(day.date).toLocaleDateString("en", { day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: "8rem", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            No data yet
          </div>
        )}
      </div>

      {/* Top Products */}
      <div style={{ ...glassCard, padding: "1rem" }}>
        <h3 style={{ ...labelStyle, marginBottom: "0.75rem" }}>Top Products</h3>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: "2.5rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : data?.topProducts && data.topProducts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.topProducts.map((product, i) => (
              <div key={product.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: i < data.topProducts.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", width: "1rem" }}>{i + 1}.</span>
                  <span style={{ fontSize: "0.8125rem" }}>{product.name}</span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{product.count} views</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No product views yet</p>
        )}
      </div>
    </div>
  );
}

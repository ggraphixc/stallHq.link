"use client";

import { useState, useEffect, useRef } from "react";
import { Store } from "@/types";
import { hasWhatsApp, hasInstagram } from "@/lib/channel";
import {
  Users, MessageCircle, Eye, TrendingUp, Calendar, ArrowUpRight,
  ArrowDownRight, ShoppingCart, Heart, Zap, Globe, BarChart3,
  RefreshCw, ChevronDown
} from "lucide-react";

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
  viewsTrend?: number;
  visitsTrend?: number;
  ordersToday?: number;
  ordersTrend?: number;
  favoritesCount?: number;
  recentActivity?: Array<{ type: string; detail: string; time: string }>;
}

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

  const primaryStats = [
    {
      label: "Total Visits",
      value: data?.totalVisits || 0,
      icon: Users,
      color: "#a855f7",
      gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
      trend: data?.visitsTrend,
    },
    {
      label: hasWhatsApp(store.whatsapp_number) && hasInstagram(store.instagram_handle)
        ? "Channel Clicks"
        : hasWhatsApp(store.whatsapp_number)
        ? "WhatsApp Clicks"
        : "Instagram Clicks",
      value: data?.whatsappClicks || 0,
      icon: MessageCircle,
      color: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
      trend: undefined,
    },
    {
      label: "Product Views",
      value: data?.productViews || 0,
      icon: Eye,
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
      trend: data?.viewsTrend,
    },
    {
      label: "Conversion",
      value: `${data?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
      trend: undefined,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BarChart3 size={16} style={{ color: "var(--glow-purple)" }} />
          Analytics Overview
        </h3>
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.1875rem", border: "1px solid var(--border-subtle)" }}>
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                fontSize: "0.6875rem", fontWeight: 600, border: "none", cursor: "pointer",
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

      {/* Primary Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        {primaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Chart Section */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, var(--glow-purple), var(--glow-cyan))",
        }} />
        <h4 style={{
          fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)",
          marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <Globe size={14} style={{ color: "var(--glow-purple)" }} />
          Visitor Trends
        </h4>
        {loading ? (
          <div style={{ height: "10rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
          </div>
        ) : data?.chartData && data.chartData.length > 0 ? (
          <AreaChart data={data.chartData} />
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Top Products */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, var(--glow-green), var(--glow-cyan))",
          }} />
          <h4 style={{
            fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)",
            marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <Zap size={14} style={{ color: "var(--glow-green)" }} />
            Top Products
          </h4>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: "2.75rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", animation: "pulse 2s infinite" }} />
              ))}
            </div>
          ) : data?.topProducts && data.topProducts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.topProducts.slice(0, 5).map((product, i) => (
                <div key={product.id} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  background: "var(--bg-secondary)", transition: "background 0.2s",
                }}>
                  <span style={{
                    width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem",
                    background: i === 0 ? "rgba(168,133,247,0.2)" : i === 1 ? "rgba(6,182,212,0.2)" : "var(--bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.625rem", fontWeight: 700,
                    color: i === 0 ? "var(--glow-purple)" : i === 1 ? "var(--glow-cyan)" : "var(--text-muted)",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.75rem", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {product.name}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Eye size={10} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)" }}>
                      {product.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No product views yet" />
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, var(--glow-amber), var(--glow-red))",
          }} />
          <h4 style={{
            fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)",
            marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <Heart size={14} style={{ color: "var(--glow-amber)" }} />
            Recent Activity
          </h4>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: "2.75rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", animation: "pulse 2s infinite" }} />
              ))}
            </div>
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.recentActivity.slice(0, 5).map((activity, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                }}>
                  <div style={{
                    width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                    background: activity.type === "view" ? "var(--glow-purple)"
                      : activity.type === "order" ? "var(--glow-green)"
                      : "var(--glow-amber)",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.75rem", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {activity.detail}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No recent activity" />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, gradient, trend, loading,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; gradient: string; trend?: number; loading: boolean;
}) {
  const [displayValue, setDisplayValue] = useState<number | string>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (typeof value === "number") {
      let start = 0;
      const duration = 800;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(start + (value - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    } else {
      setDisplayValue(value);
    }
  }, [value, loading]);

  return (
    <div ref={ref} style={{
      background: gradient, border: "1px solid var(--border-subtle)",
      borderRadius: "0.875rem", padding: "1rem", position: "relative", overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "-1rem", right: "-1rem",
        width: "3rem", height: "3rem", borderRadius: "50%",
        background: color, opacity: 0.1, filter: "blur(12px)",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
        <span style={{
          fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {label}
        </span>
        <div style={{
          width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem",
          background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <p style={{ fontSize: "1.5rem", fontWeight: 800, color, lineHeight: 1 }}>
          {loading ? "—" : typeof displayValue === "number" ? displayValue.toLocaleString() : displayValue}
        </p>
        {trend !== undefined && trend !== null && (
          <span style={{
            display: "flex", alignItems: "center", gap: "0.125rem",
            fontSize: "0.625rem", fontWeight: 600,
            color: trend >= 0 ? "#10b981" : "#ef4444",
          }}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

function AreaChart({ data }: { data: Array<{ date: string; visits: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 10, right: 10, bottom: 25, left: 0 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const max = Math.max(...data.map((d) => d.visits), 1);
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartW,
      y: padding.top + chartH - (d.visits / max) * chartH,
      visits: d.visits,
      date: d.date,
    }));

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Area fill
    const areaGrad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    areaGrad.addColorStop(0, "rgba(168,85,247,0.3)");
    areaGrad.addColorStop(0.5, "rgba(6,182,212,0.1)");
    areaGrad.addColorStop(1, "rgba(168,85,247,0)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.lineTo(p.x, p.y);
      } else {
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) / 3;
        const cpx2 = prev.x + ((p.x - prev.x) * 2) / 3;
        ctx.bezierCurveTo(cpx1, prev.y, cpx2, p.y, p.x, p.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    const lineGrad = ctx.createLinearGradient(padding.left, 0, w - padding.right, 0);
    lineGrad.addColorStop(0, "#a855f7");
    lineGrad.addColorStop(1, "#06b6d4");

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) / 3;
        const cpx2 = prev.x + ((p.x - prev.x) * 2) / 3;
        ctx.bezierCurveTo(cpx1, prev.y, cpx2, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === hoveredIndex ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === hoveredIndex ? "#a855f7" : "rgba(168,85,247,0.6)";
      ctx.fill();
      if (i === hoveredIndex) {
        ctx.strokeStyle = "rgba(168,85,247,0.3)";
        ctx.lineWidth = 8;
        ctx.stroke();
      }
    });

    // Date labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(data.length / 6));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1) {
        const date = new Date(p.date);
        ctx.fillText(
          `${date.getMonth() + 1}/${date.getDate()}`,
          p.x,
          h - padding.bottom + 15
        );
      }
    });
  }, [data, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartW = rect.width;
    const index = Math.round((x / chartW) * (data.length - 1));
    setHoveredIndex(Math.max(0, Math.min(data.length - 1, index)));
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ width: "100%", height: "10rem", cursor: "crosshair" }}
      />
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div style={{
          position: "absolute", top: "0.5rem", right: "0.5rem",
          padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
          background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
          fontSize: "0.6875rem", pointerEvents: "none",
        }}>
          <span style={{ color: "var(--text-muted)" }}>
            {new Date(data[hoveredIndex].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
          <span style={{ fontWeight: 700, color: "var(--glow-purple)", marginLeft: "0.5rem" }}>
            {data[hoveredIndex].visits.toLocaleString()} visits
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{
      height: "10rem", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "0.5rem",
    }}>
      <BarChart3 size={24} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No data yet</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      padding: "2rem", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "0.5rem",
    }}>
      <Eye size={20} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Store } from "@/types";
import {
  BarChart3,
  Users,
  MessageCircle,
  Eye,
  TrendingUp,
  Calendar,
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
}

export function AnalyticsDashboard({ store }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?store_id=${store.id}&period=${period}`
      );
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total Visits",
      value: data?.totalVisits || 0,
      icon: Users,
      color: "text-[var(--glow-purple)]",
    },
    {
      label: "WhatsApp Clicks",
      value: data?.whatsappClicks || 0,
      icon: MessageCircle,
      color: "text-green-500",
    },
    {
      label: "Product Views",
      value: data?.productViews || 0,
      icon: Eye,
      color: "text-[var(--glow-cyan)]",
    },
    {
      label: "Conversion Rate",
      value: `${data?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "text-[var(--glow-green)]",
    },
  ];

  // Simple bar chart using CSS
  const maxVisits = Math.max(...(data?.chartData.map((d) => d.visits) || [1]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--glow-purple)]" />
          <h2 className="text-xl font-bold">Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--glow-purple)]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="ambient-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-sm text-[var(--text-muted)]">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="ambient-card p-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">
          Daily Visits
        </h3>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : data?.chartData && data.chartData.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {data.chartData.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full bg-gradient-to-t from-[var(--glow-purple)] to-[var(--glow-purple)]/50 rounded-t"
                  style={{
                    height: `${(day.visits / maxVisits) * 100}%`,
                    minHeight: day.visits > 0 ? "4px" : "0px",
                  }}
                />
                {i % Math.ceil(data.chartData.length / 7) === 0 && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(day.date).toLocaleDateString("en", {
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-[var(--text-muted)] text-sm">
            No data yet
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="ambient-card p-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">
          Top Products
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-[var(--bg-secondary)] animate-pulse" />
            ))}
          </div>
        ) : data?.topProducts && data.topProducts.length > 0 ? (
          <div className="space-y-2">
            {data.topProducts.map((product, i) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--text-muted)]">
                    {i + 1}.
                  </span>
                  <span className="text-sm">{product.name}</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  {product.count} views
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            No product views yet
          </p>
        )}
      </div>
    </div>
  );
}

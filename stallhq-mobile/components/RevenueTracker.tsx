import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../lib/theme";
import { WEB_API_URL } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react-native";

interface RevenueData {
  total: number;
  this_period: number;
  last_period: number;
  trend: number;
  order_count: number;
}

interface Props {
  storeId: string;
  days?: number;
}

/**
 * Revenue tracker card for vendor dashboard.
 * Shows total revenue, this period vs last period, trend arrow, and order count.
 */
export function RevenueTracker({ storeId, days = 30 }: Props) {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, [storeId, days]);

  async function fetchRevenue() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${WEB_API_URL}/api/analytics/revenue?store_id=${storeId}&days=${days}`,
        { headers: { "x-access-token": session.access_token } }
      );
      if (res.ok) {
        const result = await res.json();
        setData(result.revenue);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading revenue...</Text>
      </View>
    );
  }

  if (!data) return null;

  const isPositive = data.trend >= 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <DollarSign size={18} color={Colors.green} />
        </View>
        <Text style={styles.title}>Revenue ({days}d)</Text>
      </View>

      {/* Main Revenue */}
      <Text style={styles.amount}>₦{data.this_period.toLocaleString()}</Text>

      {/* Trend */}
      <View style={styles.trendRow}>
        {isPositive ? (
          <TrendingUp size={14} color={Colors.green} />
        ) : (
          <TrendingDown size={14} color={Colors.red} />
        )}
        <Text style={[styles.trendText, { color: isPositive ? Colors.green : Colors.red }]}>
          {isPositive ? "+" : ""}{data.trend}% vs last {days}d
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>₦{data.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{data.order_count}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>₦{data.order_count > 0 ? Math.round(data.this_period / data.order_count).toLocaleString() : 0}</Text>
          <Text style={styles.statLabel}>Avg Order</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...ambientCard,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.green,
    marginBottom: Spacing.sm,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.lg,
  },
  trendText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderSubtle,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    padding: Spacing.lg,
  },
});

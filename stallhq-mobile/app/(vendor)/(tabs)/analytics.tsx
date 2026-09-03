import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { Eye, Link, ShoppingCart, DollarSign, TrendingUp, Calendar } from "lucide-react-native";
import { IconBox } from "../../../components/ui/IconBox";

type Period = "7d" | "30d" | "all";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayPoint {
  date: string;
  visits: number;
  clicks: number;
  views: number;
}

export default function AnalyticsScreen() {
  const { store } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState({
    visits: 0,
    clicks: 0,
    views: 0,
    orders: 0,
    revenue: 0,
    conversionRate: 0,
    bestDay: "",
    dailyData: [] as DayPoint[],
  });

  const load = async () => {
    if (!store) return;
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    // Aggregated daily rollups (populated by the analytics-aggregate cron)
    const [aggRes, todayEvents, ordersRes] = await Promise.all([
      supabase
        .from("analytics_aggregates")
        .select("date, visits, whatsapp_clicks, product_views")
        .eq("store_id", store.id)
        .gte("date", sinceStr),
      // Today's raw events (not yet rolled up by the cron)
      supabase
        .from("analytics")
        .select("event_type, created_at")
        .eq("store_id", store.id)
        .gte("created_at", todayStr + "T00:00:00"),
      supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("store_id", store.id)
        .gte("created_at", since.toISOString()),
    ]);

    const dayMap = new Map<string, DayPoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, { date: key, visits: 0, clicks: 0, views: 0 });
    }

    (aggRes.data ?? []).forEach((a: any) => {
      const point = dayMap.get(a.date);
      if (!point) return;
      point.visits += a.visits || 0;
      point.clicks += a.whatsapp_clicks || 0;
      point.views += a.product_views || 0;
    });

    (todayEvents.data ?? []).forEach((e: any) => {
      const day = String(e.created_at).split("T")[0];
      const point = dayMap.get(day);
      if (!point) return;
      if (e.event_type === "visit") point.visits += 1;
      else if (e.event_type === "whatsapp_click") point.clicks += 1;
      else if (e.event_type === "product_view") point.views += 1;
    });

    const dailyData = [...dayMap.values()].filter((d) => d.date <= todayStr);

    // Orders: any non-cancelled order counts toward revenue
    const orders = (ordersRes.data ?? []) as { total: number; status: string }[];
    const revenueOrders = orders.filter((o) => o.status !== "cancelled");

    const visits = dailyData.reduce((s, d) => s + d.visits, 0);
    const clicks = dailyData.reduce((s, d) => s + d.clicks, 0);
    const views = dailyData.reduce((s, d) => s + d.views, 0);
    const revenue = revenueOrders.reduce((s, o) => s + o.total, 0);
    const conversionRate = visits > 0 ? Math.round((clicks / visits) * 100) : 0;

    // Best day: weekday with highest average visits
    const dayTotals: Record<number, { visits: number; count: number }> = {};
    dailyData.forEach((d) => {
      const dow = new Date(d.date).getDay();
      if (!dayTotals[dow]) dayTotals[dow] = { visits: 0, count: 0 };
      dayTotals[dow].visits += d.visits;
      dayTotals[dow].count += 1;
    });
    const bestDay = Object.entries(dayTotals)
      .filter(([, t]) => t.visits > 0)
      .sort((a, b) => b[1].visits / b[1].count - a[1].visits / a[1].count)[0];

    setData({
      visits,
      clicks,
      views,
      orders: orders.length,
      revenue,
      conversionRate,
      bestDay: bestDay ? DAY_NAMES[Number(bestDay[0])] : "",
      dailyData,
    });
  };

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [store?.id, period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const maxVisits = Math.max(...data.dailyData.map((d) => d.visits), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        <Text style={styles.title}>Analytics</Text>

        <View style={styles.periodRow}>
          {(["7d", "30d", "all"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === "all" ? "30 days" : p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <IconBox size="sm" accent="purple"><Eye size={14} color={Colors.purple} /></IconBox>
            <Text style={styles.heroLabel}>Visits</Text>
            <Text style={styles.heroValue}>{data.visits.toLocaleString()}</Text>
          </View>
          <View style={styles.heroCard}>
            <IconBox size="sm" accent="cyan"><Link size={14} color={Colors.cyan} /></IconBox>
            <Text style={styles.heroLabel}>WA Clicks</Text>
            <Text style={styles.heroValue}>{data.clicks.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <IconBox size="sm" accent="amber"><ShoppingCart size={14} color={Colors.amber} /></IconBox>
            <Text style={styles.heroLabel}>Orders</Text>
            <Text style={styles.heroValue}>{data.orders}</Text>
          </View>
          <View style={styles.heroCard}>
            <IconBox size="sm" accent="green"><DollarSign size={14} color={Colors.green} /></IconBox>
            <Text style={styles.heroLabel}>Revenue</Text>
            <Text style={[styles.heroValue, { color: Colors.green }]}>₦{data.revenue.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conversion Funnel</Text>
          <View style={styles.funnelRow}>
            <View style={styles.funnelItem}><Text style={styles.funnelValue}>{data.visits}</Text><Text style={styles.funnelLabel}>Visits</Text></View>
            <Text style={styles.funnelArrow}>→</Text>
            <View style={styles.funnelItem}><Text style={styles.funnelValue}>{data.clicks}</Text><Text style={styles.funnelLabel}>Clicks</Text></View>
            <Text style={styles.funnelArrow}>→</Text>
            <View style={styles.funnelItem}><Text style={styles.funnelValue}>{data.orders}</Text><Text style={styles.funnelLabel}>Orders</Text></View>
          </View>
          <Text style={styles.conversionText}>
            Visit → WhatsApp rate: {data.conversionRate}%
          </Text>
          {data.views > 0 && (
            <Text style={[styles.conversionText, { marginTop: 4 }]}>
              {data.views} product view{data.views !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {data.bestDay ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}><Calendar size={16} color={Colors.purple} /><Text style={styles.cardTitle}>Best Day</Text></View>
            <Text style={styles.bestDay}>{data.bestDay}</Text>
            <Text style={styles.bestDaySub}>Your busiest day of the week</Text>
          </View>
        ) : null}

        {data.dailyData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}><TrendingUp size={16} color={Colors.purple} /><Text style={styles.cardTitle}>Daily Visits</Text></View>
            <View style={styles.chartRow}>
              {data.dailyData.slice(-7).map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max((d.visits / maxVisits) * 120, 3) }]} />
                  <Text style={styles.barLabel}>
                    {DAY_NAMES[new Date(d.date).getDay()]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.lg },
  periodRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  periodChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  periodActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  periodText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" },
  periodTextActive: { color: Colors.purple },
  heroRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  heroCard: {
    flex: 1, backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1,
    borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  heroLabel: { ...labelStyle, marginBottom: 4 },
  heroValue: { fontSize: 22, fontWeight: "700", color: Colors.text, lineHeight: 28 },
  card: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  funnelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  funnelItem: { alignItems: "center", flex: 1 },
  funnelValue: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  funnelLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  funnelArrow: { fontSize: FontSize.xl, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  conversionText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center" },
  bestDay: { fontSize: 36, fontWeight: "800", color: Colors.purple, textAlign: "center" },
  bestDaySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", marginTop: 4 },
  chartRow: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    height: 160, paddingTop: Spacing.md,
  },
  barCol: { alignItems: "center", flex: 1 },
  bar: { width: 22, borderRadius: 4, backgroundColor: Colors.purple, opacity: 0.85 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
});

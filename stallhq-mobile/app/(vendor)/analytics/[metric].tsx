import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { ArrowLeft, Eye, Link, ShoppingCart, DollarSign, Calendar, TrendingUp } from "lucide-react-native";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Metric = "visits" | "clicks" | "orders" | "bestday" | "funnel";

interface DayPoint {
  date: string;
  visits: number;
  clicks: number;
  views: number;
  revenue: number;
  orders: number;
}

const METRIC_META: Record<Metric, { title: string; subtitle: string }> = {
  visits: { title: "Daily Visits", subtitle: "Every visit to your store, day by day" },
  clicks: { title: "WhatsApp Clicks", subtitle: "Times customers tapped to chat or order" },
  orders: { title: "Orders & Revenue", subtitle: "Each order placed through your channels" },
  bestday: { title: "Best Day Analysis", subtitle: "Which weekdays drive the most traffic" },
  funnel: { title: "Conversion Funnel", subtitle: "Visits → clicks → orders step by step" },
};

export default function AnalyticsDetailScreen() {
  const router = useRouter();
  const { metric = "visits", period = "7d" } = useLocalSearchParams<{ metric?: Metric; period?: string }>();
  const { store } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const load = async () => {
    if (!store) return;
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    const [aggRes, todayEvents, ordersRes] = await Promise.all([
      supabase.from("analytics_aggregates").select("date, visits, whatsapp_clicks, product_views")
        .eq("store_id", store.id).gte("date", sinceStr),
      supabase.from("analytics").select("event_type, created_at")
        .eq("store_id", store.id).gte("created_at", todayStr + "T00:00:00"),
      supabase.from("orders").select("id, customer_name, total, status, created_at, items")
        .eq("store_id", store.id).gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }).limit(100),
    ]);

    const map = new Map<string, DayPoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      map.set(key, { date: key, visits: 0, clicks: 0, views: 0, revenue: 0, orders: 0 });
    }
    (aggRes.data ?? []).forEach((a: any) => {
      const p = map.get(a.date); if (!p) return;
      p.visits += a.visits || 0; p.clicks += a.whatsapp_clicks || 0; p.views += a.product_views || 0;
    });
    (todayEvents.data ?? []).forEach((e: any) => {
      const p = map.get(String(e.created_at).split("T")[0]); if (!p) return;
      if (e.event_type === "visit") p.visits += 1;
      else if (e.event_type === "whatsapp_click") p.clicks += 1;
      else if (e.event_type === "product_view") p.views += 1;
    });
    const o = (ordersRes.data ?? []) as any[];
    o.forEach((order) => {
      const p = map.get(String(order.created_at).split("T")[0]); if (!p) return;
      p.orders += 1;
      if (order.status !== "cancelled") p.revenue += Number(order.total) || 0;
    });

    setPoints([...map.values()].filter((d) => d.date <= todayStr));
    setOrders(o);
  };

  useEffect(() => { if (store) load(); }, [store?.id, period, metric]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totals = points.reduce((acc, p) => ({
    visits: acc.visits + p.visits,
    clicks: acc.clicks + p.clicks,
    views: acc.views + p.views,
    orders: acc.orders + p.orders,
    revenue: acc.revenue + p.revenue,
  }), { visits: 0, clicks: 0, views: 0, orders: 0, revenue: 0 });

  const maxVal = Math.max(...points.map((p) => p.visits), ...points.map((p) => p.clicks), 1);

  // Weekday analysis (best day)
  const dowTotals: Record<number, { visits: number; clicks: number; count: number }> = {};
  points.forEach((p) => {
    const dow = new Date(p.date).getDay();
    if (!dowTotals[dow]) dowTotals[dow] = { visits: 0, clicks: 0, count: 0 };
    dowTotals[dow].visits += p.visits;
    dowTotals[dow].clicks += p.clicks;
    dowTotals[dow].count += 1;
  });
  const weekdayRows = DAY_NAMES.map((name, i) => {
    const t = dowTotals[i];
    return {
      name,
      avgVisits: t && t.count ? Math.round((t.visits / t.count) * 10) / 10 : 0,
      avgClicks: t && t.count ? Math.round((t.clicks / t.count) * 10) / 10 : 0,
      totalVisits: t?.visits || 0,
    };
  }).sort((a, b) => b.avgVisits - a.avgVisits);
  const maxDayAvg = Math.max(...weekdayRows.map((r) => r.avgVisits), 1);

  const meta = METRIC_META[metric as Metric] ?? METRIC_META.visits;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{meta.title}</Text>
          <Text style={styles.subtitle}>{meta.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        {/* Totals strip */}
        <View style={styles.totalsRow}>
          <View style={styles.totalCard}><Eye size={13} color={Colors.purple} /><Text style={styles.totalValue}>{totals.visits}</Text><Text style={styles.totalLabel}>Visits</Text></View>
          <View style={styles.totalCard}><Link size={13} color={Colors.cyan} /><Text style={styles.totalValue}>{totals.clicks}</Text><Text style={styles.totalLabel}>Clicks</Text></View>
          <View style={styles.totalCard}><ShoppingCart size={13} color={Colors.green} /><Text style={styles.totalValue}>{totals.orders}</Text><Text style={styles.totalLabel}>Orders</Text></View>
          <View style={styles.totalCard}><DollarSign size={13} color={Colors.amber} /><Text style={styles.totalValue}>₦{totals.revenue.toLocaleString()}</Text><Text style={styles.totalLabel}>Revenue</Text></View>
        </View>

        {/* Full per-day table */}
        <View style={styles.card}>
          <View style={styles.cardHead}><TrendingUp size={14} color={Colors.purple} /><Text style={styles.cardTitle}>Full breakdown</Text></View>
          {points.length === 0 ? (
            <Text style={styles.emptyText}>No data for this period yet.</Text>
          ) : (
            points.slice().reverse().map((p) => (
              <View key={p.date} style={styles.dayRow}>
                <Text style={styles.dayLabel}>
                  {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Text>
                <View style={styles.dayBarWrap}>
                  <View style={[styles.dayBar, { width: `${Math.max((p.visits / maxVal) * 100, 2)}%`, backgroundColor: Colors.purple }]} />
                </View>
                <Text style={styles.dayVisits}>{p.visits}</Text>
                <Text style={styles.dayClicks}>{p.clicks} ↵</Text>
                <Text style={styles.dayOrders}>{p.orders} ord</Text>
              </View>
            ))
          )}
        </View>

        {/* Best day of week */}
        <View style={styles.card}>
          <View style={styles.cardHead}><Calendar size={14} color={Colors.purple} /><Text style={styles.cardTitle}>By weekday (avg visits)</Text></View>
          {weekdayRows.map((r) => (
            <View key={r.name} style={styles.weekRow}>
              <Text style={[styles.dayLabel, { width: 48 }]}>{r.name}</Text>
              <View style={styles.dayBarWrap}>
                <View style={[styles.dayBar, { width: `${Math.max((r.avgVisits / maxDayAvg) * 100, 2)}%`, backgroundColor: r.name === weekdayRows[0].name ? Colors.green : Colors.purple }]} />
              </View>
              <Text style={styles.dayVisits}>{r.avgVisits}</Text>
              <Text style={styles.dayClicks}>{r.avgClicks} ↵</Text>
            </View>
          ))}
        </View>

        {/* Orders */}
        <View style={styles.card}>
          <View style={styles.cardHead}><ShoppingCart size={14} color={Colors.green} /><Text style={styles.cardTitle}>Orders ({orders.length})</Text></View>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders in this period.</Text>
          ) : orders.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderName}>{o.customer_name || "Anonymous"}</Text>
                <Text style={styles.orderMeta}>
                  {new Date(o.created_at).toLocaleDateString()} · {Array.isArray(o.items) ? o.items.length : 0} item(s)
                </Text>
              </View>
              <Text style={styles.orderTotal}>₦{Number(o.total).toLocaleString()}</Text>
              <View style={[styles.statusPill, { backgroundColor: Colors.greenDim }]}>
                <Text style={{ color: Colors.green, fontSize: FontSize.xs, fontWeight: "600", textTransform: "capitalize" }}>{o.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: "center", alignItems: "center" },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  totalsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  totalCard: { flex: 1, backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center", gap: 2 },
  totalValue: { fontSize: FontSize.md, fontWeight: "800", color: Colors.text, marginTop: 2 },
  totalLabel: { ...labelStyle, fontSize: 8 },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  cardHead: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  dayRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 5 },
  dayLabel: { fontSize: FontSize.xs, color: Colors.textMuted, width: 72 },
  dayBarWrap: { flex: 1, height: 12, backgroundColor: Colors.bgSecondary, borderRadius: 6, overflow: "hidden" },
  dayBar: { height: "100%", borderRadius: 6, opacity: 0.85 },
  dayVisits: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.text, width: 26, textAlign: "right" },
  dayClicks: { fontSize: FontSize.xs, color: Colors.cyan, width: 40, textAlign: "right" },
  dayOrders: { fontSize: FontSize.xs, color: Colors.green, width: 44, textAlign: "right" },
  weekRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 5 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
  orderRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.borderSubtle },
  orderName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  orderMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  orderTotal: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.green },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
});

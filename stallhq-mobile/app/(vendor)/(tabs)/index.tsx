import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase, Order } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import {
  Link,
  Users,
  Package,
  LogOut,
  Plus,
  BarChart3,
  ShoppingCart,
  MessageCircle,
  Settings,
  ArrowRight,
  Crown,
  Clock,
  AlertTriangle,
  MousePointerClick,
  TrendingUp,
  Store,
  Sparkles,
} from "lucide-react-native";
import { IconBox } from "../../../components/ui/IconBox";
import { Sparkline } from "../../../components/ui/Sparkline";
import {
  isTrial,
  getDaysRemaining,
  getPlanName,
  getProductLimit,
  getPlanUsagePercent,
} from "../../../lib/subscription";

// ── Stat Card with gradient icon + sparkline (matches web glass card) ───
function StatCard({
  label,
  value,
  accent,
  sparkline,
  sparkColor,
  children,
  valueColor,
  valueSize,
  numberOfLines,
}: {
  label: string;
  value: string | number;
  accent: "purple" | "green" | "cyan" | "amber";
  sparkline?: number[];
  sparkColor?: string;
  children: React.ReactNode;
  valueColor?: string;
  valueSize?: number;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statRow}>
        <IconBox size="sm" accent={accent}>{children}</IconBox>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text
        style={[
          styles.statValue,
          valueColor ? { color: valueColor } : null,
          valueSize ? { fontSize: valueSize, lineHeight: valueSize + 4 } : null,
        ]}
        numberOfLines={numberOfLines ?? 1}
      >
        {value}
      </Text>
      {sparkline ? (
        <View style={styles.sparkWrap}>
          <Sparkline data={sparkline} color={sparkColor ?? accentColorHex(accent)} />
        </View>
      ) : (
        <View style={styles.sparkPlaceholder} />
      )}
    </View>
  );
}

function accentColorHex(accent: string): string {
  switch (accent) {
    case "purple": return Colors.purple;
    case "green": return Colors.green;
    case "cyan": return Colors.cyan;
    case "amber": return Colors.amber;
    default: return Colors.purple;
  }
}

export default function VendorDashboard() {
  const router = useRouter();
  const { store, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [trend, setTrend] = useState<{
    visits: number[];
    clicks: number[];
    orders: number[];
  } | null>(null);
  const [liveVisitors, setLiveVisitors] = useState<number | null>(null);

  // ── Data load (used by mount + pull-to-refresh) ──
  const loadData = async () => {
    if (!store) return;

    const now = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    const sinceISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sinceDay = sinceISO.split("T")[0];

    const todayStr = now.toISOString().split("T")[0];
    const [ordersRes, productsRes, aggRes, todayRes] = await Promise.all([
      supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
      // Daily rollup table populated by the analytics-aggregate cron (matches web rollup endpoint)
      supabase.from("analytics_aggregates").select("date, visits, whatsapp_clicks, product_views")
        .eq("store_id", store.id).gte("date", sinceDay),
      // Today's raw events (the cron only rolls up through yesterday)
      supabase.from("analytics").select("event_type, created_at")
        .eq("store_id", store.id).gte("created_at", todayStr + "T00:00:00"),
    ]);

    const orders = (ordersRes.data ?? []) as Order[];

    // Merge rollups + today's raw events per day
    const visitsByDay: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};
    (aggRes.data ?? []).forEach((a: any) => {
      visitsByDay[a.date] = (visitsByDay[a.date] || 0) + (a.visits || 0);
      clicksByDay[a.date] = (clicksByDay[a.date] || 0) + (a.whatsapp_clicks || 0);
    });
    (todayRes.data ?? []).forEach((e: any) => {
      const day = String(e.created_at).split("T")[0];
      if (e.event_type === "visit") visitsByDay[day] = (visitsByDay[day] || 0) + 1;
      else if (e.event_type === "whatsapp_click") clicksByDay[day] = (clicksByDay[day] || 0) + 1;
    });

    const ordersByDay: Record<string, number> = {};
    orders.forEach((o) => {
      const day = String(o.created_at).split("T")[0];
      if (day >= sinceDay) ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    });

    setTrend({
      visits: days.map((d) => visitsByDay[d] || 0),
      clicks: days.map((d) => clicksByDay[d] || 0),
      orders: days.map((d) => ordersByDay[d] || 0),
    });
    setTotalProducts(productsRes.count ?? 0);
    setRecentOrders(orders.slice(0, 5));
  };

  useEffect(() => {
    if (!store) return;
    let cancelled = false;

    // Live visitors — count all-time visit events (matches web visitors endpoint),
    // then bump the counter for new visit events arriving in real time.
    const sessionStart = Date.now();
    (async () => {
      const { count } = await supabase
        .from("analytics")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("event_type", "visit");
      if (!cancelled) setLiveVisitors(count ?? 0);
    })();

    const channel = supabase
      .channel(`visitors-${store.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "analytics", filter: `store_id=eq.${store.id}` },
        (payload) => {
          const row = payload.new as any;
          if (row.event_type === "visit") {
            const t = new Date(row.created_at).getTime();
            if (t >= sessionStart) setLiveVisitors((v) => (v ?? 0) + 1);
          }
        }
      )
      .subscribe();

    loadData();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [store?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return Colors.amber;
      case "confirmed": return Colors.blue;
      case "shipped": return Colors.cyan;
      case "delivered": return Colors.green;
      case "cancelled": return Colors.red;
      default: return Colors.textMuted;
    }
  };

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ color: Colors.textSecondary }}>Loading store...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trial = isTrial(store);
  const daysLeft = getDaysRemaining(store);
  const productLimit = getProductLimit(store);
  const usagePercent = getPlanUsagePercent(store, totalProducts);
  const atLimit = productLimit > 0 && totalProducts >= productLimit;
  const usageColor = atLimit ? Colors.red : usagePercent > 80 ? Colors.amber : Colors.green;
  const showUrgentBanner = trial && daysLeft !== null && daysLeft <= 3;
  const visitsTotal = (trend?.visits ?? []).reduce((a, b) => a + b, 0);
  const clicksTotal7d = (trend?.clicks ?? []).reduce((a, b) => a + b, 0);
  const ordersTotal7d = (trend?.orders ?? []).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {store.logo_url ? (
            <Image source={{ uri: store.logo_url }} style={styles.headerLogo} />
          ) : (
            <View style={[styles.headerLogo, styles.headerLogoPlaceholder]}>
              <Package size={18} color={Colors.purple} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{store.name}</Text>
            <Text style={styles.headerSlug} numberOfLines={1}>
              stallhq.link/{store.slug}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(`/(customer)/store/${store.slug}`)}
          >
            <Store size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/(vendor)/settings")}
          >
            <Settings size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={signOut}>
            <LogOut size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* ── Stats Grid (mirrors web) ── */}
        <View style={styles.statsGrid}>
          <StatCard label="Products" value={totalProducts} accent="purple" sparkline={trend?.visits} sparkColor={Colors.purple}>
            <Package size={14} color={Colors.purple} />
          </StatCard>
          <StatCard
            label="Store URL"
            value={`/${store.slug}`}
            accent="cyan"
            valueColor={Colors.cyan}
            valueSize={15}
            numberOfLines={1}
            sparkline={trend?.clicks}
            sparkColor={Colors.cyan}
          >
            <Link size={14} color={Colors.cyan} />
          </StatCard>
          <StatCard label="Visitors" value={liveVisitors ?? visitsTotal} accent="amber" sparkline={trend?.visits} sparkColor={Colors.amber}>
            <Users size={14} color={Colors.amber} />
          </StatCard>
          <StatCard label="Clicks (7d)" value={clicksTotal7d} accent="cyan" sparkline={trend?.clicks} sparkColor={Colors.cyan}>
            <MousePointerClick size={14} color={Colors.cyan} />
          </StatCard>
          <StatCard label="Orders (7d)" value={ordersTotal7d} accent="green" sparkline={trend?.orders} sparkColor={Colors.green}>
            <TrendingUp size={14} color={Colors.green} />
          </StatCard>
        </View>

        {/* ── Trial urgency banner ─────── */}
        {showUrgentBanner && (
          <View style={styles.urgentCard}>
            <View style={styles.urgentIcon}>
              <AlertTriangle size={14} color={Colors.red} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.urgentTitle}>
                {daysLeft === 0 ? "Trial expires today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial`}
              </Text>
              <Text style={styles.urgentSub}>Upgrade now to keep your store live and products listed.</Text>
            </View>
            <TouchableOpacity
              style={styles.urgentBtn}
              onPress={() => Linking.openURL("https://hqlink.vercel.app/upgrade")}
            >
              <Text style={styles.urgentBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Plan Info Bar ─────── */}
        <View style={styles.planCard}>
          <View style={styles.planRow}>
            <View style={styles.planLeft}>
              <View style={[styles.planBadge, { backgroundColor: trial ? Colors.purpleDim : Colors.greenDim }]}>
                {trial ? (
                  <Clock size={10} color={Colors.purple} />
                ) : (
                  <Crown size={10} color={Colors.green} />
                )}
                <Text style={[styles.planText, { color: trial ? Colors.purple : Colors.green }]}>
                  {getPlanName(store)}
                </Text>
              </View>
              {daysLeft !== null && !showUrgentBanner && (
                <Text style={[styles.daysLeft, { color: daysLeft <= 3 ? Colors.red : Colors.textMuted }]}>
                  {trial ? `${daysLeft}d trial left` : `Expires in ${daysLeft}d`}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://hqlink.vercel.app/upgrade")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={styles.upgradeLink}>{trial ? "Upgrade" : "View Plans"}</Text>
              <ArrowRight size={11} color={Colors.purple} />
            </TouchableOpacity>
          </View>

          {productLimit > 0 ? (
            <View>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Products</Text>
                <Text style={styles.usageLabel}>
                  {totalProducts}/{productLimit}
                </Text>
              </View>
              <View style={styles.usageTrack}>
                <View style={[styles.usageFill, { width: `${Math.max(2, usagePercent)}%`, backgroundColor: usageColor }]} />
              </View>
            </View>
          ) : (
            <Text style={styles.usageLabel}>{totalProducts} products — unlimited</Text>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(customer)/store/${store.slug}`)}
          >
            <IconBox size="sm" accent="purple"><Store size={14} color={Colors.purple} /></IconBox>
            <Text style={styles.actionText}>View Store</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (store.whatsapp_number) {
                const num = store.whatsapp_number.replace(/[^0-9]/g, "");
                Linking.openURL(`https://wa.me/${num}`);
              }
            }}
          >
            <IconBox size="sm" accent="green"><MessageCircle size={14} color={Colors.green} /></IconBox>
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(vendor)/promo-cards")}
          >
            <IconBox size="sm" accent="cyan"><Sparkles size={14} color={Colors.cyan} /></IconBox>
            <Text style={styles.actionText}>Promo Cards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(vendor)/(tabs)/analytics")}
          >
            <IconBox size="sm" accent="amber"><BarChart3 size={14} color={Colors.amber} /></IconBox>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(vendor)/monitoring")}
          >
            <IconBox size="sm" accent="green"><AlertTriangle size={14} color={Colors.green} /></IconBox>
            <Text style={styles.actionText}>Reviews & Reports</Text>
          </TouchableOpacity>
        </View>

        {/* ── Discover other stores ── */}
        <TouchableOpacity
          style={styles.discoverCard}
          onPress={() => router.push("/(vendor)/browse")}
          activeOpacity={0.8}
        >
          <View style={styles.discoverIcon}>
            <Store size={20} color={Colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.discoverTitle}>Browse Stores</Text>
            <Text style={styles.discoverSub}>Discover other vendors on stallHq and shop their products</Text>
          </View>
          <ArrowRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* ── Products Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionCount}>
                {totalProducts} product{totalProducts !== 1 ? "s" : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/(vendor)/(tabs)/products")}
            >
              <Text style={styles.secondaryBtnText}>Manage</Text>
              <ArrowRight size={13} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {totalProducts === 0 && (
            <View style={styles.emptyCard}>
              <IconBox size="lg" accent="purple"><Package size={22} color={Colors.purple} /></IconBox>
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptySub}>Add your first product to start selling.</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/(vendor)/products/new")}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Recent Orders ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              onPress={() => router.push("/(vendor)/(tabs)/orders")}
            >
              <Text style={styles.seeAll}>See All</Text>
              <ArrowRight size={11} color={Colors.purple} />
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <ShoppingCart size={20} color={Colors.purple} />
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>Share your store link to get started!</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/(vendor)/orders/${order.id}`)}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderCustomer}>{order.customer_name || "Anonymous"}</Text>
                  <Text style={styles.orderItems}>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>₦{order.total.toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, height: 56,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    backgroundColor: "rgba(6,6,11,0.85)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  headerLogo: { width: 36, height: 36, borderRadius: BorderRadius.md, marginRight: Spacing.md },
  headerLogoPlaceholder: {
    backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center",
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  headerSlug: { fontSize: 10, color: Colors.textMuted },
  headerActions: { flexDirection: "row", gap: Spacing.xs },
  iconBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: Colors.borderSubtle,
  },

  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    width: "48%", flexGrow: 1,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  statLabel: { ...labelStyle, marginBottom: 0, flex: 1, fontSize: 9.5 },
  statValue: { fontSize: 24, fontWeight: "700", color: Colors.text, lineHeight: 28 },
  sparkWrap: { marginTop: Spacing.sm, height: 26, justifyContent: "flex-end" },
  sparkPlaceholder: { marginTop: Spacing.sm, height: 26 },

  // Plan
  planCard: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  planLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  planBadge: {
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 3, borderRadius: BorderRadius.full,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  planText: { fontSize: FontSize.xs, fontWeight: "600" },
  daysLeft: { fontSize: FontSize.xs, flexShrink: 1 },
  upgradeLink: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.purple },
  usageHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  usageLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  usageTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.bgSecondary, overflow: "hidden" },
  usageFill: { height: "100%", borderRadius: 3 },

  // Urgent (trial ending) banner
  urgentCard: {
    backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  urgentIcon: {
    width: 30, height: 30, borderRadius: BorderRadius.md,
    backgroundColor: Colors.redDim, justifyContent: "center", alignItems: "center",
  },
  urgentTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  urgentSub: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  urgentBtn: {
    backgroundColor: Colors.red, borderRadius: BorderRadius.md,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  urgentBtnText: { color: "#fff", fontSize: FontSize.xs, fontWeight: "600" },

  // Quick Actions (2x2 grid)
  actionsRow: {
    flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    width: "48%", flexGrow: 1,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
    alignItems: "center", gap: 8,
  },
  actionText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary, textAlign: "center" },

  // Discover stores card
  discoverCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  discoverIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: Colors.cyanDim, justifyContent: "center", alignItems: "center",
  },
  discoverTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  discoverSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Section
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  sectionCount: { ...labelStyle, marginTop: 2 },
  seeAll: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.purple },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.purple, borderRadius: BorderRadius.lg,
    paddingVertical: 12, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: "600" },
  secondaryBtn: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  secondaryBtnText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "600" },

  // Empty
  emptyCard: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.xxxl, alignItems: "center",
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg },

  // Orders
  orderCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  orderLeft: {},
  orderCustomer: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  orderItems: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  orderRight: { alignItems: "flex-end" },
  orderTotal: { fontSize: FontSize.md, fontWeight: "700", color: Colors.green, marginBottom: 4 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: "600", textTransform: "capitalize" },
});

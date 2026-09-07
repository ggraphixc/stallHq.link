import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase, Order } from "../../../lib/supabase";
import { NotificationBell } from "../../../components/NotificationBell";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  labelStyle,
} from "../../../lib/theme";
import {
  MessageCircle,
  Inbox,
  Hash,
  Circle,
} from "lucide-react-native";

const STATUS_FILTERS = ["all", "pending", "confirmed", "shipped", "delivered"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function OrdersScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { store } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (signal?: { cancelled: boolean }) => {
      if (!store) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      if (!signal?.cancelled) setOrders(data ?? []);
    },
    [store?.id],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    fetchOrders(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = STATUS_FILTERS.reduce(
    (acc, s) => {
      acc[s] = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<StatusFilter, number>,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.amber;
      case "confirmed":
        return Colors.blue;
      case "shipped":
        return Colors.cyan;
      case "delivered":
        return Colors.green;
      case "cancelled":
        return Colors.red;
      default:
        return Colors.textMuted;
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const openWhatsApp = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${digits}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Orders</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orders.length}</Text>
          </View>
        </View>
        <NotificationBell />
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => {
          const count = statusCounts[f];
          const active = filter === f;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
        renderItem={({ item }) => {
          const color = getStatusColor(item.status);
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => router.push(`/(vendor)/orders/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.customerName}>
                    {item.customer_name || "Anonymous"}
                  </Text>
                  <View style={styles.idRow}>
                    <Hash size={10} color={Colors.textMuted} />
                    <Text style={styles.orderId}>
                      {item.id.slice(0, 8)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
              </View>

              <Text style={styles.orderTotal}>₦{item.total.toLocaleString()}</Text>

              <View style={styles.itemPreview}>
                {item.items.slice(0, 2).map((it, i) => (
                  <Text key={i} style={styles.itemText} numberOfLines={1}>
                    {it.quantity}× {it.product_name}
                  </Text>
                ))}
                {item.items.length > 2 && (
                  <Text style={styles.moreItems}>+{item.items.length - 2} more</Text>
                )}
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.statusBadge}>
                  <Circle size={8} color={color} fill={color} />
                  <Text style={[styles.statusText, { color }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
                {item.customer_phone && (
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => openWhatsApp(item.customer_phone!)}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={16} color="#25d366" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Inbox size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders from customers will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    /* ── Header ─────────────────────────────────── */
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.sm },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
    countBadge: {
      backgroundColor: Colors.purpleDim,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    countBadgeText: {
      fontSize: FontSize.xs,
      fontWeight: "700" as const,
      color: Colors.purple,
    },

    /* ── Filter Chips ───────────────────────────── */
    filterRow: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    filterChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
    },
    filterChipActive: {
      backgroundColor: Colors.purpleDim,
      borderColor: Colors.borderGlow,
    },
    filterText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" as const },
    filterTextActive: { color: Colors.purple },
    filterCount: {
      backgroundColor: Colors.bgSecondary,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BorderRadius.full,
      minWidth: 20,
      alignItems: "center" as const,
    },
    filterCountActive: {
      backgroundColor: Colors.purple,
    },
    filterCountText: {
      fontSize: FontSize.xs,
      fontWeight: "700" as const,
      color: Colors.textSecondary,
    },
    filterCountTextActive: {
      color: "#fff",
    },

    /* ── Order List ─────────────────────────────── */
    list: { padding: Spacing.lg, paddingTop: 0 },

    /* ── Order Card ─────────────────────────────── */
    orderCard: {
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardTop: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: Spacing.sm,
    },
    cardTopLeft: { flex: 1 },
    customerName: {
      fontSize: FontSize.md,
      fontWeight: "700" as const,
      color: Colors.text,
    },
    idRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      marginTop: 3,
    },
    orderId: { fontSize: FontSize.xs, color: Colors.textMuted },
    timeAgo: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

    /* ── Total ──────────────────────────────────── */
    orderTotal: {
      fontSize: FontSize.xl,
      fontWeight: "800" as const,
      color: Colors.green,
      marginBottom: Spacing.sm,
    },

    /* ── Item Preview ───────────────────────────── */
    itemPreview: { marginBottom: Spacing.md, gap: 2 },
    itemText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
    moreItems: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

    /* ── Card Bottom ────────────────────────────── */
    cardBottom: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    statusBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.bgSecondary,
    },
    statusText: {
      fontSize: FontSize.sm,
      fontWeight: "600" as const,
      textTransform: "capitalize" as const,
    },
    whatsappBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: "rgba(37, 211, 102, 0.12)" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },

    /* ── Empty State ────────────────────────────── */
    emptyState: {
      alignItems: "center" as const,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xxxl * 2,
      paddingHorizontal: Spacing.xxl,
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.purpleDim,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: Spacing.xl,
    },
    emptyTitle: {
      fontSize: FontSize.lg,
      fontWeight: "700" as const,
      color: Colors.text,
      marginBottom: Spacing.xs,
    },
    emptySubtitle: {
      fontSize: FontSize.sm,
      color: Colors.textMuted,
      textAlign: "center" as const,
    },
  });

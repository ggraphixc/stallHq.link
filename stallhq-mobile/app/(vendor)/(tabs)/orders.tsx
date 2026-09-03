import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase, Order } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { Phone } from "lucide-react-native";

const STATUS_FILTERS = ["all", "pending", "confirmed", "shipped", "delivered"];

export default function OrdersScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!store) return;
    const { data } = await supabase
      .from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    if (!signal?.cancelled) setOrders(data ?? []);
  }, [store?.id]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchOrders(signal);
    return () => { signal.cancelled = true; };
  }, [fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

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

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.count}>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</Text>
        </View>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/(vendor)/orders/${item.id}`)} activeOpacity={0.7}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.customerName}>{item.customer_name || "Anonymous"}</Text>
                <Text style={styles.orderTime}>{getTimeAgo(item.created_at)}</Text>
              </View>
              <Text style={styles.orderTotal}>₦{item.total.toLocaleString()}</Text>
            </View>
            <View style={styles.orderItems}>
              {item.items.slice(0, 3).map((item_, i) => (
                <Text key={i} style={styles.itemText}>{item_.quantity}× {item_.product_name}</Text>
              ))}
              {item.items.length > 3 && <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>}
            </View>
            <View style={styles.orderFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
              {item.customer_phone && (
                <View style={styles.phoneRow}>
                  <Phone size={12} color={Colors.textMuted} />
                  <Text style={styles.phone}>{item.customer_phone}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  count: { ...labelStyle, marginTop: 2 },
  filterRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  filterChipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  filterText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" },
  filterTextActive: { color: Colors.purple },
  list: { padding: Spacing.lg, paddingTop: 0 },
  orderCard: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  customerName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  orderTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  orderTotal: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.green },
  orderItems: { marginBottom: Spacing.sm },
  itemText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  moreItems: { fontSize: FontSize.xs, color: Colors.textMuted },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: "600", textTransform: "capitalize" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  phone: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 2 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
});

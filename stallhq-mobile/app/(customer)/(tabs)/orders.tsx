import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase, Order } from "../../../lib/supabase";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.amber,
  confirmed: Colors.blue,
  shipped: Colors.cyan,
  delivered: Colors.green,
  cancelled: Colors.red,
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupMode, setLookupMode] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");

  const loadOrders = async (userEmail?: string) => {
    try {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (userEmail) {
        query = query.eq("customer_email", userEmail);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          query = query.eq("customer_email", user.email);
        } else {
          setOrders([]);
          setLoading(false);
          return;
        }
      }
      const { data } = await query;
      setOrders(data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleLookup = async () => {
    if (!lookupEmail.trim()) return;
    setLoading(true);
    setLookupMode(true);
    await loadOrders(lookupEmail.trim());
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || Colors.textMuted;

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && !refreshing) return <BrandLoader label="Loading orders" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        <Text style={styles.title}>My Orders</Text>

        {/* Email lookup for guest users */}
        {orders.length === 0 && !lookupMode && (
          <View style={styles.lookupCard}>
            <Text style={styles.lookupTitle}>Find your orders</Text>
            <Text style={styles.lookupSub}>Enter the email you used when ordering</Text>
            <View style={styles.lookupRow}>
              <View style={styles.lookupInput}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <Text style={styles.lookupPlaceholder}>Email address</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup}>
              <Text style={styles.lookupBtnText}>Look up orders</Text>
            </TouchableOpacity>
          </View>
        )}

        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No orders found</Text>
            <TouchableOpacity onPress={() => router.replace("/(customer)/(tabs)")}>
              <Text style={styles.emptyLink}>Browse stores</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push({ pathname: "/(customer)/order/[id]", params: { id: order.id } })}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>

              <View style={styles.orderItems}>
                {order.items.slice(0, 3).map((item, i) => (
                  <Text key={i} style={styles.itemText} numberOfLines={1}>
                    {item.quantity}× {item.product_name}
                  </Text>
                ))}
                {order.items.length > 3 && (
                  <Text style={styles.moreText}>+{order.items.length - 3} more</Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.orderMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.orderTime}>{formatTime(order.created_at)}</Text>
                </View>
                <Text style={styles.orderTotal}>₦{order.total.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xl },
  lookupCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.xl },
  lookupTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  lookupSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  lookupRow: { flexDirection: "row", gap: Spacing.sm },
  lookupInput: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  lookupPlaceholder: { fontSize: FontSize.md, color: Colors.textMuted },
  lookupBtn: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center", marginTop: Spacing.md },
  lookupBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: Spacing.xxxl * 2 },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, marginTop: Spacing.lg },
  emptyLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600", marginTop: Spacing.md },
  orderCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderIdRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  orderId: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: "700", textTransform: "capitalize" },
  orderItems: { marginTop: Spacing.sm, gap: 2 },
  itemText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  moreText: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: "italic" },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  orderTotal: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.green },
});

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Order } from "../../../lib/supabase";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { Ionicons } from "@expo/vector-icons";

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

const STATUS_META: Record<string, { iconName: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  pending: { iconName: "time-outline", color: Colors.amber, label: "Pending" },
  confirmed: { iconName: "checkmark-circle", color: Colors.blue, label: "Confirmed" },
  shipped: { iconName: "car-outline", color: Colors.cyan, label: "Shipped" },
  delivered: { iconName: "location-outline", color: Colors.green, label: "Delivered" },
  cancelled: { iconName: "close-circle", color: Colors.red, label: "Cancelled" },
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    supabase.from("orders").select("*").eq("id", id).single()
      .then(({ data }) => { if (!cancelled) { setOrder(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  const getStatusColor = (status: string) => STATUS_META[status]?.color || Colors.textMuted;

  const currentIdx = order ? STATUSES.indexOf(order.status as any) : -1;

  if (loading || !order) return <BrandLoader label="Loading order" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
        </View>

        {/* Status timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardLabel}>ORDER TIMELINE</Text>
          {STATUSES.map((s, i) => {
            const meta = STATUS_META[s];
            const isCompleted = i <= currentIdx && order.status !== "cancelled";
            const isCurrent = order.status === s;
            return (
              <View key={s} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, isCompleted && { backgroundColor: meta.color }, isCurrent && styles.timelineDotCurrent]}>
                    <Ionicons name={meta.iconName} size={12} color={isCompleted ? "#fff" : Colors.textMuted} />
                  </View>
                  {i < STATUSES.length - 1 && (
                    <View style={[styles.timelineLine, isCompleted && { backgroundColor: meta.color }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, isCompleted && { color: Colors.text }, isCurrent && { fontWeight: "700" }]}>{meta.label}</Text>
                  {isCurrent && <Text style={styles.timelineCurrent}>Current status</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ITEMS</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}× {item.product_name}</Text>
              <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{order.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CONTACT</Text>
          <Text style={styles.infoText}>{order.customer_name || "Anonymous"}</Text>
          {order.customer_phone && (
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`https://wa.me/${order.customer_phone!.replace(/[^0-9]/g, "")}`)}>
              <Ionicons name="call-outline" size={14} color={Colors.purple} /><Text style={styles.link}>{order.customer_phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NOTES</Text>
            <Text style={styles.infoText}>{order.notes}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TIMESTAMPS</Text>
          <Text style={styles.metaText}>Created: {new Date(order.created_at).toLocaleString()}</Text>
          <Text style={styles.metaText}>Updated: {new Date(order.updated_at).toLocaleString()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.sm },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.xl },
  statusText: { fontSize: FontSize.md, fontWeight: "700", textTransform: "capitalize" },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  cardLabel: { ...labelStyle, marginBottom: Spacing.sm },
  timelineCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  timelineRow: { flexDirection: "row", gap: Spacing.md },
  timelineLeft: { alignItems: "center", width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: "center", alignItems: "center" },
  timelineDotCurrent: { borderWidth: 2, borderColor: Colors.purple },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.borderSubtle, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: Spacing.md },
  timelineLabel: { fontSize: FontSize.md, color: Colors.textMuted },
  timelineCurrent: { fontSize: FontSize.xs, color: Colors.purple, marginTop: 2 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  itemName: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  itemPrice: { fontSize: FontSize.md, color: Colors.text, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.md },
  totalLabel: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.green },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.sm },
  link: { fontSize: FontSize.md, color: Colors.purple },
  infoText: { fontSize: FontSize.md, color: Colors.text },
  metaText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
});

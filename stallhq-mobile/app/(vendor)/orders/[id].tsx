import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from "react-native";
import { alert } from "../../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Order } from "../../../lib/supabase";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { ArrowLeft, Phone, Clock, StickyNote } from "lucide-react-native";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

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

  const updateStatus = async (status: string) => {
    if (!order) return;
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (error) alert("Error", error.message);
    else setOrder({ ...order, status: status as Order["status"] });
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

  if (loading || !order) {
    return <BrandLoader label="Loading order" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>

        <View style={styles.card}>
          <Text style={styles.label}>STATUS</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>CUSTOMER</Text>
          <Text style={styles.value}>{order.customer_name || "Anonymous"}</Text>
          {order.customer_phone && (
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`https://wa.me/${order.customer_phone!.replace(/[^0-9]/g, "")}`)}>
              <Phone size={14} color={Colors.purple} /><Text style={styles.link}>{order.customer_phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>ITEMS</Text>
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

        {order.notes && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}><StickyNote size={14} color={Colors.textMuted} /><Text style={styles.label}>NOTES</Text></View>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>UPDATE STATUS</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.statusBtn, order.status === s && styles.statusBtnActive, { borderColor: getStatusColor(s) }]}
                onPress={() => alert("Update", `Change to "${s}"?`, [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: () => updateStatus(s) }])}>
                <Text style={[styles.statusBtnText, { color: getStatusColor(s) }, order.status === s && { fontWeight: "800" }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}><Clock size={14} color={Colors.textMuted} /><Text style={styles.label}>TIMESTAMPS</Text></View>
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xl },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.sm },
  label: { ...labelStyle, marginBottom: Spacing.sm },
  value: { fontSize: FontSize.md, color: Colors.text },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.sm },
  link: { fontSize: FontSize.md, color: Colors.purple },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.md, fontWeight: "700", textTransform: "capitalize" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  itemName: { fontSize: FontSize.md, color: Colors.text },
  itemPrice: { fontSize: FontSize.md, color: Colors.text, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.md },
  totalLabel: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.green },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  statusBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, backgroundColor: Colors.bgSecondary },
  statusBtnActive: { backgroundColor: Colors.bgCardHover },
  statusBtnText: { fontSize: FontSize.sm, fontWeight: "600" },
  metaText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
});

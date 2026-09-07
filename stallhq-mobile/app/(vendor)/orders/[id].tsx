import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { alert } from "../../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Order } from "../../../lib/supabase";
import { BrandLoader } from "../../../components/BrandLoader";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  labelStyle,
} from "../../../lib/theme";
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  StickyNote,
  MessageCircle,
  Circle,
  Check,
  ShoppingBag,
} from "lucide-react-native";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function OrderDetailScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setOrder(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) alert("Error", error.message);
    else setOrder({ ...order, status: status as Order["status"] });
  };

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

  const openWhatsApp = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${digits}`);
  };

  if (loading || !order) {
    return <BrandLoader label="Loading order" />;
  }

  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Back Button ─────────────────────────── */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={Colors.purple} />
          <Text style={styles.backText}>Orders</Text>
        </TouchableOpacity>

        {/* ── Large Status Badge ──────────────────── */}
        <View style={[styles.heroStatus, { backgroundColor: statusColor + "15" }]}>
          <Circle size={12} color={statusColor} fill={statusColor} />
          <Text style={[styles.heroStatusText, { color: statusColor }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>

        {/* ── Customer Card ───────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <ShoppingBag size={16} color={Colors.purple} />
            </View>
            <Text style={styles.cardLabel}>Customer</Text>
          </View>

          <Text style={styles.customerName}>
            {order.customer_name || "Anonymous"}
          </Text>

          {order.customer_phone && (
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactLink}
                onPress={() => openWhatsApp(order.customer_phone!)}
                activeOpacity={0.7}
              >
                <MessageCircle size={16} color="#25d366" />
                <Text style={styles.contactLinkText}>{order.customer_phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${order.customer_phone}`)}
                activeOpacity={0.7}
              >
                <Phone size={14} color={Colors.purple} />
              </TouchableOpacity>
            </View>
          )}

          {order.customer_email && (
            <View style={styles.emailRow}>
              <Mail size={14} color={Colors.textMuted} />
              <Text style={styles.emailText}>{order.customer_email}</Text>
            </View>
          )}
        </View>

        {/* ── Items List ──────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <ShoppingBag size={16} color={Colors.purple} />
            </View>
            <Text style={styles.cardLabel}>Items</Text>
          </View>

          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.quantity}×</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product_name}
                  {item.variant_name ? ` (${item.variant_name})` : ""}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                ₦{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{order.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Notes ───────────────────────────────── */}
        {order.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <StickyNote size={16} color={Colors.amber} />
              </View>
              <Text style={styles.cardLabel}>Customer Notes</Text>
            </View>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {order.vendor_notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <StickyNote size={16} color={Colors.blue} />
              </View>
              <Text style={styles.cardLabel}>Vendor Notes</Text>
            </View>
            <Text style={styles.notesText}>{order.vendor_notes}</Text>
          </View>
        )}

        {/* ── Update Status ───────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Circle size={16} color={Colors.green} />
            </View>
            <Text style={styles.cardLabel}>Update Status</Text>
          </View>

          <View style={styles.statusGrid}>
            {STATUSES.map((s) => {
              const sColor = getStatusColor(s);
              const isActive = order.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusBtn,
                    { borderColor: isActive ? sColor : Colors.borderSubtle },
                    isActive && { backgroundColor: sColor + "18" },
                  ]}
                  onPress={() =>
                    alert(
                      "Update Status",
                      `Change to "${s}"?`,
                      [
                        { text: "Cancel", style: "cancel" as const },
                        { text: "OK", onPress: () => updateStatus(s) },
                      ],
                    )
                  }
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <View style={[styles.activeIndicator, { backgroundColor: sColor }]}>
                      <Check size={10} color="#fff" />
                    </View>
                  ) : (
                    <Circle size={8} color={sColor} fill={sColor + "40"} />
                  )}
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: isActive ? sColor : Colors.textSecondary },
                      isActive && { fontWeight: "700" as const },
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Timestamps ──────────────────────────── */}
        <View style={[styles.card, { marginBottom: Spacing.xxxl }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Clock size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.cardLabel}>Timestamps</Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Created</Text>
            <Text style={styles.timestampValue}>
              {new Date(order.created_at).toLocaleString()}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Updated</Text>
            <Text style={styles.timestampValue}>
              {new Date(order.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 100 },

    /* ── Back Button ────────────────────────────── */
    backBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginBottom: Spacing.lg,
    },
    backText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600" as const },

    /* ── Hero Status ────────────────────────────── */
    heroStatus: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
      alignSelf: "flex-start" as const,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.xl,
    },
    heroStatusText: {
      fontSize: FontSize.xl,
      fontWeight: "700" as const,
      textTransform: "capitalize" as const,
    },

    /* ── Card ───────────────────────────────────── */
    card: {
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    cardHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    cardIconWrap: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.purpleDim,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    cardLabel: {
      ...labelStyle,
      marginBottom: 0,
    },

    /* ── Customer ───────────────────────────────── */
    customerName: {
      fontSize: FontSize.lg,
      fontWeight: "700" as const,
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    contactRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: Spacing.sm,
    },
    contactLink: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
    },
    contactLinkText: { fontSize: FontSize.md, color: "#25d366", fontWeight: "600" as const },
    callBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.purpleDim,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    emailRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    emailText: { fontSize: FontSize.sm, color: Colors.textMuted },

    /* ── Items ──────────────────────────────────── */
    itemRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderSubtle,
    },
    itemLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
      flex: 1,
    },
    itemQty: {
      fontSize: FontSize.sm,
      fontWeight: "700" as const,
      color: Colors.purple,
      minWidth: 28,
    },
    itemName: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
    itemPrice: { fontSize: FontSize.md, color: Colors.text, fontWeight: "600" as const },

    divider: {
      height: 1,
      backgroundColor: Colors.borderSubtle,
      marginVertical: Spacing.md,
    },

    totalRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    totalLabel: { fontSize: FontSize.lg, fontWeight: "700" as const, color: Colors.text },
    totalValue: { fontSize: FontSize.xl, fontWeight: "800" as const, color: Colors.green },

    /* ── Notes ──────────────────────────────────── */
    notesText: {
      fontSize: FontSize.md,
      color: Colors.textSecondary,
      lineHeight: 22,
    },

    /* ── Status Grid ────────────────────────────── */
    statusGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: Spacing.sm,
    },
    statusBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      backgroundColor: Colors.bgSecondary,
    },
    activeIndicator: {
      width: 18,
      height: 18,
      borderRadius: BorderRadius.full,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    statusBtnText: { fontSize: FontSize.sm, fontWeight: "600" as const },

    /* ── Timestamps ─────────────────────────────── */
    timestampRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      paddingVertical: Spacing.xs,
    },
    timestampLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
    timestampValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  });

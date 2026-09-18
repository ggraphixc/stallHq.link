import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";
import { getStoreComparison, type StoreComparison } from "../../lib/storeComparison";
import { X, Star, Package, ShoppingCart, Eye, BadgeCheck } from "lucide-react-native";

/**
 * Store Comparison Screen
 * Shows side-by-side comparison of 2-4 stores.
 * Accessed via /compare?slugs=slug1,slug2,slug3
 */
export default function CompareScreen() {
  const { slugs } = useLocalSearchParams<{ slugs: string }>();
  const [stores, setStores] = useState<StoreComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugs) return;
    const slugList = slugs.split(",").filter(Boolean);
    if (slugList.length < 2) return;

    getStoreComparison(slugList).then((data) => {
      setStores(data);
      setLoading(false);
    });
  }, [slugs]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.purple} />
        <Text style={styles.loadingText}>Comparing stores...</Text>
      </View>
    );
  }

  if (stores.length < 2) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load comparison data</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const colWidth = stores.length === 2 ? "48%" : "31%";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compare Stores</Text>
        <Pressable onPress={() => router.back()}>
          <X size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Store Cards */}
      <View style={styles.storeRow}>
        {stores.map((store) => (
          <Pressable
            key={store.id}
            style={[styles.storeCard, { width: colWidth as any }]}
            onPress={() => router.push(`/(customer)/store/${store.slug}`)}
          >
            {/* Logo */}
            {store.logo_url ? (
              <Image source={{ uri: store.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{store.name[0]}</Text>
              </View>
            )}

            {/* Name + Badge */}
            <View style={styles.nameRow}>
              <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
              {store.verified && <BadgeCheck size={14} color={Colors.purple} />}
            </View>

            <Text style={styles.storeCategory}>{store.category || "General"}</Text>
          </Pressable>
        ))}
      </View>

      {/* Comparison Table */}
      <View style={styles.table}>
        {/* Products */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Products</Text>
          {stores.map((s) => (
            <Text key={s.id} style={[styles.tableValue, { width: colWidth as any }]}>
              {s.stats.product_count}
            </Text>
          ))}
        </View>

        {/* Rating */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Rating</Text>
          {stores.map((s) => (
            <View key={s.id} style={[styles.tableValueRow, { width: colWidth as any }]}>
              <Star size={12} color={Colors.amber} fill={Colors.amber} />
              <Text style={styles.tableValue}>
                {s.stats.avg_rating > 0 ? s.stats.avg_rating.toFixed(1) : "—"}
              </Text>
              <Text style={styles.tableSubtext}>({s.stats.review_count})</Text>
            </View>
          ))}
        </View>

        {/* Orders (30d) */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Orders (30d)</Text>
          {stores.map((s) => (
            <Text key={s.id} style={[styles.tableValue, { width: colWidth as any }]}>
              {s.stats.orders_30d}
            </Text>
          ))}
        </View>

        {/* Visits (30d) */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Visits (30d)</Text>
          {stores.map((s) => (
            <Text key={s.id} style={[styles.tableValue, { width: colWidth as any }]}>
              {s.stats.visits_30d}
            </Text>
          ))}
        </View>

        {/* Price Range */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Price Range</Text>
          {stores.map((s) => (
            <Text key={s.id} style={[styles.tableValue, { width: colWidth as any }]}>
              {s.stats.price_range.min > 0
                ? `₦${s.stats.price_range.min.toLocaleString()} - ₦${s.stats.price_range.max.toLocaleString()}`
                : "—"}
            </Text>
          ))}
        </View>

        {/* Avg Price */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Avg Price</Text>
          {stores.map((s) => (
            <Text key={s.id} style={[styles.tableValue, styles.priceValue, { width: colWidth as any }]}>
              {s.stats.price_range.avg > 0 ? `₦${s.stats.price_range.avg.toLocaleString()}` : "—"}
            </Text>
          ))}
        </View>

        {/* Plan */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Plan</Text>
          {stores.map((s) => (
            <View key={s.id} style={[styles.tableValueRow, { width: colWidth as any }]}>
              <View style={[styles.planDot, { backgroundColor: s.plan === "trial" ? Colors.amber : Colors.green }]} />
              <Text style={[styles.tableValue, { textTransform: "capitalize" }]}>{s.plan}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Visit Buttons */}
      <View style={styles.storeRow}>
        {stores.map((store) => (
          <Pressable
            key={store.id}
            style={[styles.visitBtn, { width: colWidth as any }]}
            onPress={() => router.push(`/(customer)/store/${store.slug}`)}
          >
            <Text style={styles.visitBtnText}>Visit Store</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg, gap: Spacing.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text },
  storeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.lg, gap: Spacing.sm },
  storeCard: {
    ...ambientCard,
    padding: Spacing.md,
    alignItems: "center",
  },
  logo: { width: 48, height: 48, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  logoPlaceholder: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.sm,
  },
  logoText: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.purple },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  storeName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  storeCategory: { fontSize: FontSize.xs, color: Colors.textMuted },
  table: { marginBottom: Spacing.lg },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tableLabel: { width: 80, fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase" },
  tableValue: { fontSize: FontSize.sm, color: Colors.text, textAlign: "center" },
  tableValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  tableSubtext: { fontSize: FontSize.xs, color: Colors.textMuted },
  priceValue: { color: Colors.green, fontWeight: "700" },
  planDot: { width: 8, height: 8, borderRadius: 4 },
  visitBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  visitBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: "#fff" },
  loadingText: { fontSize: FontSize.md, color: Colors.textMuted },
  errorText: { fontSize: FontSize.md, color: Colors.textMuted },
  backBtn: { backgroundColor: Colors.purple, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  backBtnText: { color: "#fff", fontWeight: "600" },
});

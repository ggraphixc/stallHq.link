import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  TextInput, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase, Store } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../../lib/theme";
import { Search, Store as StoreIcon, ShoppingCart } from "lucide-react-native";
import { useAuth } from "../../../lib/auth";
import { BrandLogo } from "../../../components/BrandLogo";
import { StoreFavoriteButton } from "../../../components/StoreFavoriteButton";
import { useCart } from "../../../lib/cart";

const SCREEN_WIDTH = Dimensions.get("window").width;

const CATEGORY_PRESETS = [
  { label: "All", value: "" },
  { label: "Fashion", value: "fashion" },
  { label: "Electronics", value: "electronics" },
  { label: "Food", value: "food" },
  { label: "Skincare", value: "skincare" },
  { label: "Home", value: "home" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { session, store: vendorStore } = useAuth();
  const cart = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("setup_complete", true)
      .order("created_at", { ascending: false });
    setStores(data ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => { await loadStores(); })();
    return () => { cancelled = true; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  const filtered = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory
      ? s.category?.toLowerCase() === selectedCategory.toLowerCase()
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <BrandLogo size={24} />
            <Text style={styles.title}>stallHq</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(customer)/cart")}
            activeOpacity={0.7}
          >
            <ShoppingCart size={18} color={Colors.textSecondary} />
            {cart.itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.itemCount > 99 ? "99+" : cart.itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={15} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.chipRow}>
        {CATEGORY_PRESETS.map((cat) => {
          const active = selectedCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(active ? "" : cat.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Store List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/(customer)/store/${item.slug}`)}
          >
            {/* Banner */}
            {item.banner_url ? (
              <Image source={{ uri: item.banner_url }} style={styles.banner} />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}

            <View style={styles.cardBody}>
              {/* Logo + Name + Favorite */}
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logo} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <StoreIcon size={14} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.storeSlug}>/{item.slug}</Text>
                  </View>
                </View>
                <StoreFavoriteButton slug={item.slug} size={16} />
              </View>

              {/* Description */}
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}

              {/* Footer: Plan badge + category */}
              <View style={styles.cardFooter}>
                <View style={[styles.planDot, { backgroundColor: item.plan === "trial" ? Colors.amber : Colors.green }]} />
                <Text style={styles.planLabel}>{item.plan === "trial" ? "New" : item.plan}</Text>
                {item.category ? (
                  <>
                    <Text style={styles.footerSep}>·</Text>
                    <Text style={styles.catLabel}>{item.category}</Text>
                  </>
                ) : null}
                {item.whatsapp_number ? (
                  <>
                    <Text style={styles.footerSep}>·</Text>
                    <Text style={styles.waLabel}>WhatsApp</Text>
                  </>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No stores found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text, letterSpacing: -0.3 },
  cartBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.purple, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Search
  searchWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchBox: {
    ...ambientInput, padding: Spacing.sm + 2,
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text, padding: 0 },

  // Category chips
  chipRow: {
    flexDirection: "row", paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    marginBottom: Spacing.md, flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  chipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.purple },
  chipText: { fontSize: FontSize.xs, fontWeight: "500", color: Colors.textMuted },
  chipTextActive: { color: Colors.purple },

  // List
  list: { padding: Spacing.lg, paddingTop: 0 },

  // Store Card
  card: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: "hidden",
  },
  banner: { width: "100%", height: 100 },
  bannerPlaceholder: { width: "100%", height: 40, backgroundColor: Colors.bgCard },
  cardBody: { padding: Spacing.md },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  logo: { width: 36, height: 36, borderRadius: BorderRadius.sm },
  logoPlaceholder: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center",
  },
  storeName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  desc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 17 },

  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: Spacing.sm, gap: Spacing.xs },
  planDot: { width: 6, height: 6, borderRadius: 3 },
  planLabel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted, textTransform: "capitalize" },
  catLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  waLabel: { fontSize: FontSize.xs, color: Colors.green },
  footerSep: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Empty
  empty: {
    alignItems: "center", padding: Spacing.xxxl * 2,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "500" },
});

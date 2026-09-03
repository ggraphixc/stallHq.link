import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  TextInput, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase, Store } from "../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";
import { ArrowLeft, Search, Store as StoreIcon, MessageCircle, Camera, Compass } from "lucide-react-native";

/**
 * Store directory inside the vendor flow — lets signed-in vendors discover
 * other public stores and open them in the native storefront screen.
 */
export default function BrowseScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    const { data } = await supabase
      .from("stores")
      .select("id, slug, name, description, logo_url, banner_url, category, plan, verified, whatsapp_number, instagram_handle")
      .eq("setup_complete", true)
      .order("created_at", { ascending: false });
    if (!signal?.cancelled) setStores((data ?? []) as Store[]);
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => { signal.cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const q = search.trim().toLowerCase();
  const filtered = stores.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Browse Stores</Text>
          <Text style={styles.subtitle}>Discover other vendors on stallHq</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores by name or category..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storeCard}
            onPress={() => router.push(`/(customer)/store/${item.slug}`)}
            activeOpacity={0.7}
          >
            {item.banner_url ? (
              <Image source={{ uri: item.banner_url }} style={styles.banner} />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            <View style={styles.storeContent}>
              <View style={styles.storeHeader}>
                {item.logo_url ? (
                  <Image source={{ uri: item.logo_url }} style={styles.logo} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <StoreIcon size={18} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.storeSlug}>/{item.slug}</Text>
                </View>
              </View>
              {item.description && (
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={styles.channels}>
                {item.category ? (
                  <View style={styles.chip}>
                    <Compass size={11} color={Colors.purple} />
                    <Text style={styles.chipText}>{item.category}</Text>
                  </View>
                ) : null}
                {item.whatsapp_number ? (
                  <View style={styles.chip}>
                    <MessageCircle size={11} color={Colors.green} />
                    <Text style={styles.chipText}>WhatsApp</Text>
                  </View>
                ) : null}
                {item.instagram_handle ? (
                  <View style={styles.chip}>
                    <Camera size={11} color={Colors.purple} />
                    <Text style={styles.chipText}>Instagram</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {q ? "No stores match your search" : "No public stores yet"}
            </Text>
            <Text style={styles.emptySub}>
              {q ? "Try a different name or category." : "Stores appear here once they're set up."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchContainer: {
    ...ambientInput, padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, padding: 0 },
  list: { padding: Spacing.lg, paddingTop: 0 },
  storeCard: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: "hidden",
  },
  banner: { width: "100%", height: 110 },
  bannerPlaceholder: { width: "100%", height: 56, backgroundColor: Colors.bgSecondary },
  storeContent: { padding: Spacing.lg },
  storeHeader: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, borderRadius: BorderRadius.md, marginRight: Spacing.md },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary,
    justifyContent: "center", alignItems: "center", marginRight: Spacing.md,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.xs, color: Colors.textMuted },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 },
  channels: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, flexWrap: "wrap" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: {
    alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1,
    borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl * 2, gap: 8,
  },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
});

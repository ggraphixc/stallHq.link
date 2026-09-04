import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  TextInput, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase, Store } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../../lib/theme";
import { Search, Store as StoreIcon, MessageCircle, Camera, Sparkles } from "lucide-react-native";
import { useAuth } from "../../../lib/auth";
import { BrandLogo } from "../../../components/BrandLogo";
import { StoreFavoriteButton } from "../../../components/StoreFavoriteButton";

export default function ExploreScreen() {
  const router = useRouter();
  const { session, store: vendorStore } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("setup_complete", true)
        .order("created_at", { ascending: false });
      if (!cancelled) setStores(data ?? []);
    };
    load();
    return () => { cancelled = true; };
  }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("setup_complete", true)
      .order("created_at", { ascending: false });
    setStores(data ?? []);
    setRefreshing(false);
  };

  const filtered = stores.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.xs }}>
          <BrandLogo size={30} />
          <Text style={styles.title}>Explore Stores</Text>
        </View>
        <Text style={styles.subtitle}>Discover local vendors on stallHq</Text>
      </View>

      {/* Identity-aware hub card: guests get a sign-in CTA; customers w/o a
          store get a 'Become a Vendor' dashboard card. */}
      {session ? (
        !vendorStore ? (
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => router.push("/(customer)/become-vendor")}
            activeOpacity={0.85}
          >
            <View style={styles.hubIcon}><Sparkles size={18} color={Colors.purple} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubTitle}>Have something to sell?</Text>
              <Text style={styles.hubSub}>Upgrade your account into a store in under a minute</Text>
            </View>
            <Text style={styles.hubCta}>Start ›</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => router.push("/(vendor)/(tabs)")}
            activeOpacity={0.85}
          >
            <View style={[styles.hubIcon, { backgroundColor: Colors.greenDim }]}><Sparkles size={18} color={Colors.green} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubTitle}>Open your vendor dashboard</Text>
              <Text style={styles.hubSub}>Manage {vendorStore.name} — orders, products & analytics</Text>
            </View>
            <Text style={[styles.hubCta, { color: Colors.green }]}>Dashboard ›</Text>
          </TouchableOpacity>
        )
      ) : (
        <TouchableOpacity
          style={styles.hubCard}
          onPress={() => router.push("/(auth)/select-role")}
          activeOpacity={0.85}
        >
          <View style={styles.hubIcon}><Sparkles size={18} color={Colors.purple} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hubTitle}>Create a free account</Text>
            <Text style={styles.hubSub}>Save favorite stores and become a vendor anytime</Text>
          </View>
          <Text style={styles.hubCta}>Join ›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search stores..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        renderItem={({ item }) => (
          <View style={styles.storeCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/(customer)/store/${item.slug}`)}
            >
              {item.banner_url ? <Image source={{ uri: item.banner_url }} style={styles.banner} /> : <View style={styles.bannerPlaceholder} />}
              <View style={styles.storeContent}>
                <View style={styles.storeHeader}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logo} />
                  ) : (
                    <View style={styles.logoPlaceholder}><StoreIcon size={18} color={Colors.textMuted} /></View>
                  )}
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.storeSlug}>/{item.slug}</Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: item.plan === "trial" ? Colors.amberDim : Colors.greenDim }]}>
                    <Text style={[styles.planText, { color: item.plan === "trial" ? Colors.amber : Colors.green }]}>{item.plan}</Text>
                  </View>
                </View>
                {item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
                <View style={styles.channels}>
                  {item.whatsapp_number && (
                    <View style={styles.channelChip}><MessageCircle size={12} color={Colors.green} /><Text style={styles.channelText}>WhatsApp</Text></View>
                  )}
                  {item.instagram_handle && (
                    <View style={styles.channelChip}><Camera size={12} color={Colors.purple} /><Text style={styles.channelText}>Instagram</Text></View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            {/* Favorite heart — outside the navigation touchable */}
            <View style={styles.favOverlay}>
              <StoreFavoriteButton slug={item.slug} size={18} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No stores found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchContainer: { ...ambientInput, padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, padding: 0 },
  hubCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  hubIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center",
  },
  hubTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  hubSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1, lineHeight: 16 },
  hubCta: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.purple },
  list: { padding: Spacing.lg, paddingTop: 0 },
  storeCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: "hidden" },
  banner: { width: "100%", height: 120 },
  bannerPlaceholder: { width: "100%", height: 60, backgroundColor: Colors.bgSecondary },
  storeContent: { padding: Spacing.lg },
  storeHeader: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, borderRadius: BorderRadius.md, marginRight: Spacing.md },
  logoPlaceholder: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  storeInfo: { flex: 1 },
  storeName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.xs, color: Colors.textMuted },
  planBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  planText: { fontSize: FontSize.xs, fontWeight: "600", textTransform: "capitalize" },
  favOverlay: { position: "absolute", top: Spacing.sm, right: Spacing.sm },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 },
  channels: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  channelChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary },
  channelText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 3, gap: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
});

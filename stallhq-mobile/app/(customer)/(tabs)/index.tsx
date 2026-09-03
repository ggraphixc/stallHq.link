import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  TextInput, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase, Store } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../../lib/theme";
import { Search, Store as StoreIcon, MessageCircle, Camera } from "lucide-react-native";

export default function ExploreScreen() {
  const router = useRouter();
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
        <Text style={styles.title}>Explore Stores</Text>
        <Text style={styles.subtitle}>Discover local vendors</Text>
      </View>

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
          <TouchableOpacity style={styles.storeCard} onPress={() => router.push(`/(customer)/store/${item.slug}`)} activeOpacity={0.7}>
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
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 },
  channels: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  channelChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary },
  channelText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 3, gap: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
});

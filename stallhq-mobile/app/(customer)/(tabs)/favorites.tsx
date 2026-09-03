import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, Store } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { Heart, Store as StoreIcon, ChevronRight } from "lucide-react-native";

const FAVORITES_KEY = "stallhq_favorites";

export default function FavoritesScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (!stored || cancelled) return;
        const slugs: string[] = JSON.parse(stored);
        if (slugs.length === 0) return;
        const { data } = await supabase.from("stores").select("*").in("slug", slugs).eq("is_active", true);
        if (!cancelled) setStores(data ?? []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Favorites</Text></View>
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(customer)/store/${item.slug}`)}>
            {item.logo_url ? <Image source={{ uri: item.logo_url }} style={styles.logo} /> : (
              <View style={styles.logoPlaceholder}><StoreIcon size={18} color={Colors.textMuted} /></View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.slug}>/{item.slug}</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Heart size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySub}>Tap the heart on a store to save it</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  logo: { width: 44, height: 44, borderRadius: BorderRadius.md, marginRight: Spacing.lg },
  logoPlaceholder: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  slug: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 3, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
});

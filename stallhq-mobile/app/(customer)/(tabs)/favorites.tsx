import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase, Store, Product } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { Heart, Store as StoreIcon, ChevronRight, Package } from "lucide-react-native";
import { loadFavoriteSlugs } from "../../../components/StoreFavoriteButton";
import { getProductFavorites } from "../../../lib/productFavorites";

interface ProductFav {
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    in_stock: boolean;
    stores: { id: string; slug: string; name: string } | null;
  };
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [productFavs, setProductFavs] = useState<ProductFav[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stores" | "products">("stores");

  const load = useCallback(async () => {
    try {
      const slugs = await loadFavoriteSlugs();
      if (slugs.length > 0) {
        const { data } = await supabase
          .from("stores")
          .select("*")
          .in("slug", slugs)
          .eq("setup_complete", true);
        if (data) setStores(data);
      } else {
        setStores([]);
      }
      const favs = await getProductFavorites();
      setProductFavs(favs);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await load();
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [load])
  );

  const hasAny = stores.length > 0 || productFavs.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      {hasAny && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === "stores" && styles.tabActive]}
            onPress={() => setTab("stores")}
          >
            <StoreIcon size={14} color={tab === "stores" ? Colors.purple : Colors.textMuted} />
            <Text style={[styles.tabText, tab === "stores" && styles.tabTextActive]}>
              Stores ({stores.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "products" && styles.tabActive]}
            onPress={() => setTab("products")}
          >
            <Package size={14} color={tab === "products" ? Colors.purple : Colors.textMuted} />
            <Text style={[styles.tabText, tab === "products" && styles.tabTextActive]}>
              Products ({productFavs.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === "stores" ? (
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
            loading ? (
              <Text style={{ textAlign: "center", color: Colors.textMuted, marginTop: 40 }}>Loading…</Text>
            ) : (
              <View style={styles.emptyState}>
                <Heart size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No store favorites yet</Text>
                <Text style={styles.emptySub}>Tap the heart on a store to save it</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={productFavs}
          keyExtractor={(item) => item.product_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const p = item.products;
            if (!p) return null;
            const store = p.stores;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: "/(customer)/product/[id]", params: { id: p.id } })}
              >
                {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.logo} /> : (
                  <View style={styles.logoPlaceholder}><Package size={18} color={Colors.textMuted} /></View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.slug}>₦{p.price.toLocaleString()}{store ? ` · ${store.name}` : ""}</Text>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <Text style={{ textAlign: "center", color: Colors.textMuted, marginTop: 40 }}>Loading…</Text>
            ) : (
              <View style={styles.emptyState}>
                <Package size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No product favorites yet</Text>
                <Text style={styles.emptySub}>Tap the heart on a product to save it</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  tabRow: {
    flexDirection: "row", gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  tabActive: { borderColor: Colors.purple, backgroundColor: Colors.purpleDim },
  tabText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.purple },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  logo: { width: 44, height: 44, borderRadius: BorderRadius.md, marginRight: Spacing.lg },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary,
    justifyContent: "center", alignItems: "center", marginRight: Spacing.lg,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  slug: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: {
    alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1,
    borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl * 3, gap: 12,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
});

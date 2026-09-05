import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  TextInput, RefreshControl, ActivityIndicator,
} from "react-native";
import { alert } from "../../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase, Product } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput, labelStyle } from "../../../lib/theme";
import { Plus, Search, Package, Sparkles, Lock } from "lucide-react-native";
import { WEB_API_URL } from "../../../lib/config";

export default function ProductsScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [bulkAI, setBulkAI] = useState({ running: false, done: 0, total: 0, error: "" });

  const fetchProducts = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!store) return;
    const { data } = await supabase
      .from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    if (!signal?.cancelled) setProducts(data ?? []);
  }, [store?.id]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchProducts(signal);
    return () => { signal.cancelled = true; };
  }, [fetchProducts]);

  const onRefresh = async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); };

  const deleteProduct = (product: Product) => {
    alert("Delete Product", `Delete "${product.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("products").delete().eq("id", product.id);
        fetchProducts();
      }},
    ]);
  };

  const missingCount = products.filter((p) => !p.description || !p.description.trim()).length;
  const isTrial = store?.plan === "trial";

  const runBulkAI = async () => {
    if (!store || bulkAI.running) return;
    if (isTrial) {
      alert("Pro feature", "AI descriptions require a paid plan. Upgrade to generate descriptions for all your products at once.");
      return;
    }
    alert(
      "Generate descriptions",
      `Create AI descriptions for ${missingCount} product${missingCount !== 1 ? "s" : ""} without one? This may take a minute or two.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Generate", onPress: async () => {
          setBulkAI({ running: true, done: 0, total: missingCount, error: "" });
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${WEB_API_URL}/api/ai/bulk-descriptions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-access-token": session?.access_token ?? "",
              },
              body: JSON.stringify({ productIds: products.filter((p) => !p.description || !p.description.trim()).map((p) => p.id) }),
            });
            const data = await res.json();
            if (!res.ok) {
              if (data?.upgradeRequired) throw new Error("AI descriptions require a paid plan");
              throw new Error(data?.error || "Generation failed");
            }
            setBulkAI((s) => ({ ...s, done: data.processed ?? missingCount }));
            alert("Done", `${data.succeeded ?? 0} description${data.succeeded !== 1 ? "s" : ""} generated${data.failed ? `, ${data.failed} failed` : ""}.`);
            await fetchProducts();
          } catch (e: any) {
            setBulkAI((s) => ({ ...s, error: e?.message || "Something went wrong" }));
          } finally {
            setBulkAI((s) => ({ ...s, running: false }));
          }
        }},
      ]
    );
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/(vendor)/products/${item.id}`)}
      onLongPress={() => deleteProduct(item)}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}><Package size={20} color={Colors.textMuted} /></View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        {item.category && <Text style={styles.productCategory}>{item.category}</Text>}
        <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.productRight}>
        <View style={[styles.availDot, { backgroundColor: item.in_stock ? Colors.green : Colors.red }]} />
        <Text style={styles.availText}>{item.in_stock ? "Active" : "Hidden"}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.count}>{products.length} product{products.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(vendor)/products/new")}>
          <Plus size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Bulk AI banner */}
      {missingCount > 0 && !bulkAI.running && (
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={runBulkAI}
          activeOpacity={0.8}
        >
          <View style={styles.aiBannerIcon}>
            {isTrial ? <Lock size={16} color={Colors.textMuted} /> : <Sparkles size={16} color={Colors.purple} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>
              {isTrial ? "AI descriptions (Pro)" : `Generate ${missingCount} description${missingCount !== 1 ? "s" : ""} with AI`}
            </Text>
            <Text style={styles.aiBannerSub}>
              {isTrial ? "Upgrade to auto-write descriptions for products missing one" : "Auto-write sales copy for products without a description"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {bulkAI.running && (
        <View style={styles.aiProgress}>
          <ActivityIndicator size="small" color={Colors.purple} />
          <Text style={styles.aiProgressText}>
            Generating descriptions… {bulkAI.done}/{bulkAI.total}
          </Text>
        </View>
      )}

      {!!bulkAI.error && (
        <View style={[styles.aiBanner, { borderColor: "rgba(239,68,68,0.3)" }]}>
          <Text style={[styles.aiBannerSub, { color: Colors.red, flex: 1 }]}>{bulkAI.error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Package size={24} color={Colors.purple} /></View>
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubtext}>Tap Add to create your first product</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/(vendor)/products/new")} activeOpacity={0.8}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  count: { ...labelStyle, marginTop: 2 },
  primaryBtn: {
    backgroundColor: Colors.purple, borderRadius: BorderRadius.lg,
    paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: "600" },
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchContainer: {
    ...ambientInput, padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, padding: 0 },
  list: { padding: Spacing.lg, paddingTop: 0 },

  // AI banner
  aiBanner: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: "rgba(168,85,247,0.25)",
    borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  aiBannerIcon: {
    width: 34, height: 34, borderRadius: BorderRadius.md,
    backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center",
  },
  aiBannerTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  aiBannerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  aiProgress: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  aiProgressText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  productCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  productImage: { width: 52, height: 52, borderRadius: BorderRadius.md, marginRight: Spacing.md },
  productImagePlaceholder: {
    width: 52, height: 52, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary,
    justifyContent: "center", alignItems: "center", marginRight: Spacing.md,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  productCategory: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  productPrice: { fontSize: FontSize.md, fontWeight: "700", color: Colors.green, marginTop: 2 },
  productRight: { alignItems: "center" },
  availDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  availText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: {
    alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1,
    borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 2,
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.lg, backgroundColor: Colors.purpleDim,
    justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg,
  },
  emptyText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  fab: {
    position: "absolute", right: Spacing.lg, bottom: Spacing.xxxl,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.purple,
    justifyContent: "center", alignItems: "center",
    shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});

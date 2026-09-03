import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  Linking, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Store, Product } from "../../../lib/supabase";
import { trackStoreVisit, trackStoreClick } from "../../../lib/track";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { ArrowLeft, Store as StoreIcon, MessageCircle, Camera, Minus, Plus, Package, Bot } from "lucide-react-native";
import { AssistantChat } from "../../../components/AssistantChat";

export default function StoreDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).single();
      if (cancelled) return;
      if (s) {
        setStore(s);
        const { data: p } = await supabase.from("products").select("*").eq("store_id", s.id).eq("in_stock", true).order("created_at", { ascending: false });
        if (!cancelled) setProducts(p ?? []);
        // Count the visit — unless the viewer is the store owner (their own preview)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || user.id !== s.user_id) {
          trackStoreVisit(s.id);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const fetchData = async () => {
    if (!slug) return;
    const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).single();
    if (s) {
      setStore(s);
      const { data: p } = await supabase.from("products").select("*").eq("store_id", s.id).eq("in_stock", true).order("created_at", { ascending: false });
      setProducts(p ?? []);
    }
  };
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const toggle = (id: string) => {
    setSelected((prev) => { const n = new Map(prev); if (n.has(id)) n.delete(id); else n.set(id, 1); return n; });
  };
  const updateQty = (id: string, q: number) => {
    if (q < 1) { toggle(id); return; }
    setSelected((prev) => { const n = new Map(prev); n.set(id, q); return n; });
  };

  const orderWhatsApp = () => {
    if (!store?.whatsapp_number) return;
    trackStoreClick(store.id);
    const num = store.whatsapp_number.replace(/[^0-9]/g, "");
    let msg = `Hi! I'd like to order from ${store.name}:\n\n`;
    selected.forEach((qty, id) => {
      const p = products.find((pp) => pp.id === id);
      if (p) msg += `• ${qty}× ${p.name} — ₦${(p.price * qty).toLocaleString()}\n`;
    });
    const total = Array.from(selected.entries()).reduce((s, [id, q]) => { const p = products.find((pp) => pp.id === id); return s + (p ? p.price * q : 0); }, 0);
    msg += `\nTotal: ₦${total.toLocaleString()}`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
  };

  const total = Array.from(selected.entries()).reduce((s, [id, q]) => { const p = products.find((pp) => pp.id === id); return s + (p ? p.price * q : 0); }, 0);
  const totalQty = Array.from(selected.values()).reduce((s, q) => s + q, 0);

  if (!store) return <BrandLoader label="Opening store" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {store.banner_url && <Image source={{ uri: store.banner_url }} style={styles.banner} />}

        <View style={styles.storeInfo}>
          <View style={styles.storeRow}>
            {store.logo_url ? <Image source={{ uri: store.logo_url }} style={styles.logo} /> : (
              <View style={styles.logoPlaceholder}><StoreIcon size={22} color={Colors.textMuted} /></View>
            )}
            <View><Text style={styles.storeName}>{store.name}</Text><Text style={styles.storeSlug}>/{store.slug}</Text></View>
          </View>
          {store.description && <Text style={styles.description}>{store.description}</Text>}
          <View style={styles.channels}>
            {store.whatsapp_number && <View style={styles.chip}><MessageCircle size={12} color={Colors.green} /><Text style={styles.chipText}>WhatsApp</Text></View>}
            {store.instagram_handle && <View style={styles.chip}><Camera size={12} color={Colors.purple} /><Text style={styles.chipText}>@{store.instagram_handle}</Text></View>}
            <TouchableOpacity style={[styles.chip, { backgroundColor: Colors.purpleDim }]} onPress={() => setChatOpen(true)} activeOpacity={0.7}>
              <Bot size={12} color={Colors.purple} />
              <Text style={[styles.chipText, { color: Colors.purple }]}>Ask AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          {products.length === 0 ? (
            <View style={styles.emptyCard}><Package size={40} color={Colors.textMuted} /><Text style={styles.emptyText}>No products yet</Text></View>
          ) : products.map((p) => {
            const qty = selected.get(p.id) ?? 0;
            return (
              <TouchableOpacity key={p.id} style={[styles.productCard, qty > 0 && styles.productCardSelected]} onPress={() => toggle(p.id)} activeOpacity={0.7}>
                {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.productImage} /> : (
                  <View style={styles.productImagePlaceholder}><Package size={20} color={Colors.textMuted} /></View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  {p.description && <Text style={styles.productDesc} numberOfLines={2}>{p.description}</Text>}
                  <Text style={styles.productPrice}>₦{p.price.toLocaleString()}</Text>
                </View>
                {qty > 0 && (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(p.id, qty - 1)}><Minus size={14} color="#fff" /></TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(p.id, qty + 1)}><Plus size={14} color="#fff" /></TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* AI Assistant chat */}
      <AssistantChat
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        storeSlug={store.slug}
        storeName={store.name}
      />

      {totalQty > 0 && (
        <View style={styles.orderBar}>
          <View>
            <Text style={styles.orderCount}>{totalQty} item{totalQty !== 1 ? "s" : ""}</Text>
            <Text style={styles.orderTotal}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.orderBtn} onPress={orderWhatsApp} activeOpacity={0.8}>
            <MessageCircle size={18} color="#fff" /><Text style={styles.orderBtnText}>Order via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: Spacing.lg, paddingBottom: Spacing.sm },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  banner: { width: "100%", height: 180 },
  storeInfo: { padding: Spacing.lg },
  storeRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  logo: { width: 56, height: 56, borderRadius: BorderRadius.md, marginRight: Spacing.lg },
  logoPlaceholder: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  storeName: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.sm, color: Colors.textMuted },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  channels: { flexDirection: "row", gap: Spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgCard },
  chipText: { fontSize: FontSize.xs, color: Colors.textMuted },
  productsSection: { padding: Spacing.lg, paddingTop: 0 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  emptyCard: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 2, gap: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
  productCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  productCardSelected: { borderColor: Colors.purple, backgroundColor: "rgba(168,85,247,0.03)" },
  productImage: { width: 64, height: 64, borderRadius: BorderRadius.sm, marginRight: Spacing.md },
  productImagePlaceholder: { width: 64, height: 64, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  productDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  productPrice: { fontSize: FontSize.md, fontWeight: "700", color: Colors.green, marginTop: 4 },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, minWidth: 24, textAlign: "center" },
  orderBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSecondary, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, padding: Spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  orderTotal: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.green },
  orderBtn: { backgroundColor: "#25d366", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, flexDirection: "row", alignItems: "center", gap: 6 },
  orderBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
});

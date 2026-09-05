import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image,
  ActivityIndicator, Share, Platform,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../lib/auth";
import { supabase, Product } from "../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import {
  ArrowLeft, Sparkles, Download, Share2, Package, Check, Layout, Palette, Store,
} from "lucide-react-native";

// ── Card design tokens (mirrors the web PromoCardGenerator) ──
type CardStyleKey = "aurora" | "neon" | "sunset" | "ocean" | "royal";
type FormatKey = "status" | "story" | "post";

const CARD_STYLES: Record<CardStyleKey, {
  label: string; bgTop: string; bgBot: string; accent: string; accentEnd: string;
  orb1: string; orb2: string; orb3: string; text: string; subtext: string;
}> = {
  aurora: { label: "Aurora", bgTop: "#0b0820", bgBot: "#050410", accent: "#a855f7", accentEnd: "#06b6d4", orb1: "#7c3aed", orb2: "#0ea5e9", orb3: "#d946ef", text: "#f8fafc", subtext: "#cbd5e1" },
  neon:   { label: "Neon",   bgTop: "#1a0612", bgBot: "#080406", accent: "#f43f5e", accentEnd: "#f59e0b", orb1: "#ef4444", orb2: "#f59e0b", orb3: "#ec4899", text: "#fafafa", subtext: "#d4d4d8" },
  sunset: { label: "Sunset", bgTop: "#1f0814", bgBot: "#0a0306", accent: "#f97316", accentEnd: "#ec4899", orb1: "#f97316", orb2: "#ec4899", orb3: "#8b5cf6", text: "#fff7ed", subtext: "#fed7aa" },
  ocean:  { label: "Ocean",  bgTop: "#04101f", bgBot: "#020812", accent: "#06b6d4", accentEnd: "#3b82f6", orb1: "#06b6d4", orb2: "#3b82f6", orb3: "#8b5cf6", text: "#ecfeff", subtext: "#a5f3fc" },
  royal:  { label: "Royal",  bgTop: "#160624", bgBot: "#08030f", accent: "#c084fc", accentEnd: "#f472b6", orb1: "#a855f7", orb2: "#f472b6", orb3: "#818cf8", text: "#faf5ff", subtext: "#ddd6fe" },
};

const FORMATS: Record<FormatKey, { label: string; ratio: number; icon: string }> = {
  status: { label: "Status 9:16", ratio: 9 / 16, icon: "📱" },
  story:  { label: "Story 9:16",  ratio: 9 / 16, icon: "📸" },
  post:   { label: "Post 1:1",    ratio: 1,      icon: "🖼️" },
};

export default function PromoCardsScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [styleKey, setStyleKey] = useState<CardStyleKey>("aurora");
  const [formatKey, setFormatKey] = useState<FormatKey>("status");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!store) return;
    (async () => {
      const { data } = await supabase
        .from("products").select("*").eq("store_id", store!.id).order("created_at", { ascending: false });
      const items = (data ?? []) as Product[];
      setProducts(items);
      if (items.length > 0) setSelectedId(items[0].id);
      setLoading(false);
    })();
  }, [store?.id]);

  const product = products.find((p) => p.id === selectedId);
  const style = CARD_STYLES[styleKey];
  const format = FORMATS[formatKey];

  const shareCard = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      const caption = [
        `🔥 *${product?.name}*`,
        ``,
        `💰 Price: *₦${product?.price.toLocaleString()}*`,
        `🏪 Store: *${store?.name}*`,
        ``,
        `✅ Available now — order via WhatsApp!`,
      ].join("\n");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share promo card" });
      } else if (Platform.OS === "ios") {
        await Share.share({ url: uri, message: caption });
      } else {
        alert("Sharing unavailable", "Sharing isn't supported on this device.");
      }
    } catch (e) {
      alert("Share failed", "Could not generate the card image. Try again.");
    } finally {
      setSharing(false);
    }
  };

  const cardWidth = "100%";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Promo Cards</Text>
          <Text style={styles.subtitle}>Create & share product cards</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product selector */}
        <Text style={styles.label}>Select product</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.productChip, selectedId === p.id && { borderColor: Colors.purple, backgroundColor: Colors.purpleDim }]}
              onPress={() => setSelectedId(p.id)}
            >
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={styles.chipImage} />
              ) : (
                <View style={[styles.chipImage, { justifyContent: "center", alignItems: "center" }]}>
                  <Package size={14} color={Colors.textMuted} />
                </View>
              )}
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.chipName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.chipPrice}>₦{p.price.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {products.length === 0 && !loading && (
            <View style={styles.noProducts}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Add a product first to make a promo card.</Text>
            </View>
          )}
        </ScrollView>

        {/* Controls: format + style */}
        <View style={styles.controlsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}><Layout size={10} color={Colors.purple} /> Format</Text>
            <View style={styles.chipRow}>
              {(Object.entries(FORMATS) as [FormatKey, (typeof FORMATS)[FormatKey]][]).map(([key, f]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionChip, formatKey === key && { borderColor: style.accent, backgroundColor: style.accent + "18" }]}
                  onPress={() => setFormatKey(key)}
                >
                  <Text style={[styles.optionChipText, formatKey === key && { color: style.accent }]}>
                    {f.icon} {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.label}><Palette size={10} color={Colors.purple} /> Style</Text>
        <View style={styles.chipRow}>
          {(Object.entries(CARD_STYLES) as [CardStyleKey, (typeof CARD_STYLES)[CardStyleKey]][]).map(([key, s]) => (
            <TouchableOpacity
              key={key}
              style={[styles.styleChip, styleKey === key && { borderColor: s.accent }]}
              onPress={() => setStyleKey(key)}
            >
              <View style={[styles.dot, { backgroundColor: s.accent }]} />
              <Text style={[styles.styleChipText, styleKey === key && { color: s.accent }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Card preview (captured for sharing) ── */}
        {product ? (
          <View style={styles.cardWrap}>
            <View collapsable={false} ref={cardRef} style={{ width: cardWidth, aspectRatio: format.ratio, alignSelf: "center" }}>
              <LinearGradient colors={[style.bgTop, style.bgBot]} style={StyleSheet.absoluteFill} />
              {/* glass panel */}
              <View style={styles.panel}>
                {/* top: avatar + store + exclusive pill */}
                <View style={styles.cardTop}>
                  <LinearGradient colors={[style.accent, style.accentEnd]} style={styles.avatar}>
                    <Text style={styles.avatarText}>{(store?.name || "S").charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: style.text }]} numberOfLines={1}>{store?.name}</Text>
                    <Text style={[styles.storeSub, { color: style.subtext }]}>StallHq Store</Text>
                  </View>
                  <View style={[styles.exclusivePill, { backgroundColor: hexA(style.accent, 0.3) }]}>
                    <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
                  </View>
                </View>

                {/* product image */}
                <View style={{ alignItems: "center", marginTop: "2%" }}>
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} style={[styles.productImg, { borderRadius: 16, borderColor: hexA(style.accent, 0.5) }]} />
                  ) : (
                    <View style={[styles.productImg, styles.productImgPlaceholder, { borderColor: hexA(style.accent, 0.4) }]}>
                      <Package size={40} color={style.accent} />
                    </View>
                  )}
                </View>

                {/* name + price */}
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: style.text, textShadowColor: style.accent }]} numberOfLines={2}>
                    {product.name.toUpperCase()}
                  </Text>
                  <Text style={[styles.cardPriceEyebrow, { color: style.subtext }]}>OFFER PRICE</Text>
                  <Text style={[styles.cardPrice, { color: style.accentEnd }]}>
                    ₦{product.price.toLocaleString()}
                  </Text>
                  {!!product.description && (
                    <Text style={[styles.cardDesc, { color: style.subtext }]} numberOfLines={2}>{product.description}</Text>
                  )}
                  {!!product.category && (
                    <View style={[styles.categoryChip, { backgroundColor: hexA(style.accent, 0.16) }]}>
                      <Text style={[styles.categoryText, { color: style.accent }]}>{product.category.toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                {/* bottom CTA */}
                <View style={styles.cardBottom}>
                  <Text style={[styles.orderEyebrow, { color: hexA(style.text, 0.7) }]}>ORDER NOW ON</Text>
                  <LinearGradient colors={[style.accent, style.accentEnd, style.orb3]} style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>Shop Now</Text>
                  </LinearGradient>
                  <Text style={[styles.cardUrl, { color: hexA(style.subtext, 0.65) }]}>
                    stallhq.com/{store?.slug}
                  </Text>
                </View>
              </View>
            </View>

            {/* Share */}
            <TouchableOpacity style={styles.shareBtn} onPress={shareCard} disabled={sharing} activeOpacity={0.8}>
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Share2 size={16} color="#fff" />
                  <Text style={styles.shareBtnText}>Share card</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.shareHint}>Share to WhatsApp, Instagram or save to your gallery</Text>
          </View>
        ) : (
          !loading && (
            <View style={styles.noProductCard}>
              <Sparkles size={32} color={Colors.textMuted} />
              <Text style={{ color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                Select a product to preview its promo card
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** rgba() string helper from a hex color */
function hexA(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.borderSubtle },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  label: {
    fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.04, marginBottom: Spacing.sm, marginTop: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  productRow: { gap: Spacing.sm, paddingBottom: 4 },
  productChip: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.sm, maxWidth: 220,
  },
  chipImage: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary },
  chipName: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.text, maxWidth: 130 },
  chipPrice: { fontSize: FontSize.xs, color: Colors.green, fontWeight: "700" },
  noProducts: { padding: Spacing.lg },
  chipRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  optionChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  optionChipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  styleChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  styleChipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  controlsRow: { flexDirection: "row", gap: Spacing.lg },
  cardWrap: { marginTop: Spacing.lg },
  panel: {
    flex: 1, margin: 6, borderRadius: 18, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    padding: 14, justifyContent: "space-between",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  storeName: { fontSize: 13, fontWeight: "700" },
  storeSub: { fontSize: 9, fontWeight: "500" },
  exclusivePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  exclusiveText: { color: "#fff", fontWeight: "800", fontSize: 8 },
  productImg: { width: "86%", aspectRatio: 1.1, borderWidth: 1.5 },
  productImgPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center",
  },
  cardBody: { alignItems: "center", marginTop: 6 },
  cardName: {
    fontSize: 18, fontWeight: "900", textAlign: "center",
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  cardPriceEyebrow: { fontSize: 7, fontWeight: "700", letterSpacing: 1, marginTop: 8 },
  cardPrice: { fontSize: 17, fontWeight: "900", marginTop: 2 },
  cardDesc: { fontSize: 8.5, textAlign: "center", marginTop: 4, paddingHorizontal: 8 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99, marginTop: 6 },
  categoryText: { fontSize: 7, fontWeight: "700", letterSpacing: 0.5 },
  cardBottom: { alignItems: "center" },
  orderEyebrow: { fontSize: 7, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  ctaBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 40, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  cardUrl: { fontSize: 8.5, fontWeight: "500", marginTop: 6 },
  shareBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.purple, borderRadius: BorderRadius.lg,
    paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: Spacing.sm,
  },
  shareBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  shareHint: { textAlign: "center", color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
  noProductCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.xxxl, alignItems: "center", marginTop: Spacing.xl,
  },
});

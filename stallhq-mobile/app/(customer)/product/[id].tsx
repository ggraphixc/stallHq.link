import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  Linking, TextInput, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Product } from "../../../lib/supabase";
import { trackStoreClick, trackEvent } from "../../../lib/track";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { ArrowLeft, Package, MessageCircle, Star, Send, Flag, ChevronRight } from "lucide-react-native";
import { WEB_API_URL } from "../../../lib/auth";

const REASONS = [
  { value: "fake", label: "Fake or counterfeit" },
  { value: "misleading", label: "Misleading description" },
  { value: "prohibited", label: "Prohibited item" },
  { value: "offensive", label: "Offensive content" },
  { value: "other", label: "Something else" },
];

function Stars({ value, size = 14, onSelect }: { value: number; size?: number; onSelect?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} disabled={!onSelect} onPress={() => onSelect?.(i)}>
          <Star size={size} color={i <= value ? Colors.amber : Colors.textMuted} fill={i <= value ? Colors.amber : "none"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<(Product & { store?: any }) | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const { data: p } = await supabase.from("products").select("*").eq("id", id).single();
      if (cancelled || !p) return;
      setProduct(p as any);
      trackEvent(p.store_id, "product_view", { productId: p.id });

      // Store info for channel buttons
      const { data: s } = await supabase.from("stores").select("name, slug, whatsapp_number, instagram_handle").eq("id", p.store_id).single();
      if (!cancelled && s) setProduct({ ...(p as any), store: s });

      // Reviews
      try {
        const res = await fetch(`${WEB_API_URL}/api/reviews?product_id=${p.id}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.reviews || [];
          setReviews(list);
          if (list.length) setAvg(Math.round((list.reduce((s2: number, r: any) => s2 + r.rating, 0) / list.length) * 10) / 10);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [id]);

  const orderWhatsApp = () => {
    if (!product?.store?.whatsapp_number) return;
    trackStoreClick(product.store_id, "whatsapp");
    const num = String(product.store.whatsapp_number).replace(/[^0-9]/g, "");
    const msg = `Hi ${product.store.name}! I'd like to order:\n\n• ${product.name} — ₦${product.price.toLocaleString()}\n\nIs it available?`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
  };

  const submitReview = async () => {
    if (!name.trim()) { Alert.alert("Missing name", "Enter your name."); return; }
    if (!rating) { Alert.alert("Missing rating", "Tap a star to rate."); return; }
    if (!product) return;
    setBusy(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, store_id: product.store_id, reviewer_name: name.trim(), rating, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setName(""); setRating(0); setComment("");
        const data = await res.json();
        const fresh = [data, ...reviews];
        setReviews(fresh);
        setAvg(Math.round((fresh.reduce((s2, r) => s2 + r.rating, 0) / fresh.length) * 10) / 10);
      } else {
        const d = await res.json();
        Alert.alert("Review failed", d.error || "Please try again.");
      }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!reason) { Alert.alert("Pick a reason", "Choose why you're reporting this product."); return; }
    if (!product) return;
    setReporting(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, store_id: product.store_id, reason, details: details.trim() || undefined }),
      });
      if (res.ok) setReported(true);
      else { const d = await res.json(); Alert.alert("Report failed", d.error || "Please try again."); setReportOpen(false); }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
      setReportOpen(false);
    } finally {
      setReporting(false);
    }
  };

  if (!product) return <BrandLoader label="Loading product" />;

  const images = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Gallery */}
        {images.length > 0 ? (
          <Image source={{ uri: images[0] }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, { justifyContent: "center", alignItems: "center", backgroundColor: Colors.bgSecondary }]}>
            <Package size={60} color={Colors.textMuted} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              {product.category ? (
                <View style={styles.catChip}><Text style={styles.catText}>{product.category}</Text></View>
              ) : null}
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
            </View>
          </View>

          {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

          {product.store ? (
            <TouchableOpacity
              style={styles.storeCard}
              onPress={() => router.push({ pathname: "/(customer)/store/[slug]", params: { slug: product.store.slug } })}
            >
              <View style={styles.storeAvatar}><Text style={{ color: Colors.purple, fontWeight: "800", fontSize: FontSize.md }}>{String(product.store.name).slice(0, 2).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: Colors.text }}>{product.store.name}</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>View store</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          {/* Order */}
          {product.store?.whatsapp_number ? (
            <TouchableOpacity style={styles.orderBtn} onPress={orderWhatsApp} activeOpacity={0.8}>
              <MessageCircle size={18} color="#fff" /><Text style={styles.orderText}>Order via WhatsApp</Text>
            </TouchableOpacity>
          ) : null}

          {/* Report */}
          <TouchableOpacity style={styles.reportBtn} onPress={() => { setReportOpen(true); setReported(false); setReason(""); setDetails(""); }}>
            <Flag size={13} color={Colors.textMuted} /><Text style={styles.reportText}>Report product</Text>
          </TouchableOpacity>

          {/* Reviews */}
          <View style={{ marginTop: Spacing.xl }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md }}>
              <Star size={16} color={Colors.amber} />
              <Text style={styles.sectionTitle}>Product Reviews</Text>
              {reviews.length > 0 ? <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>({avg} ★ · {reviews.length})</Text> : null}
            </View>

            <View style={styles.reviewForm}>
              <Text style={styles.label}>Your name</Text>
              <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} maxLength={100} />
              <Text style={styles.label}>Rating</Text>
              <Stars value={rating} size={30} onSelect={setRating} />
              <Text style={styles.label}>Comment (optional)</Text>
              <TextInput style={[styles.input, { minHeight: 64, textAlignVertical: "top" }]} placeholder="Share your experience…" placeholderTextColor={Colors.textMuted} value={comment} onChangeText={setComment} multiline maxLength={1000} />
              <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.6 }]} onPress={submitReview} disabled={busy}>
                <Send size={14} color="#fff" /><Text style={{ color: "#fff", fontSize: FontSize.sm, fontWeight: "700" }}>{busy ? "Submitting…" : "Submit Review"}</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <Text style={{ fontSize: FontSize.sm, color: Colors.textMuted, marginVertical: Spacing.md }}>No reviews yet — be the first!</Text>
            ) : reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                  <View style={styles.avatar}><Text style={{ color: Colors.purple, fontWeight: "700", fontSize: FontSize.xs }}>{String(r.reviewer_name || "?").slice(0, 2).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.text }}>{r.reviewer_name}</Text>
                    <Text style={{ fontSize: 10, color: Colors.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Stars value={r.rating} />
                </View>
                {r.comment ? <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 19 }}>{r.comment}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Report modal */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {reported ? (
              <>
                <View style={styles.doneIcon}><Flag size={20} color={Colors.green} /></View>
                <Text style={styles.modalTitle}>Report submitted</Text>
                <Text style={styles.modalSub}>Thanks — our team and the vendor will review it.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setReportOpen(false)}><Text style={styles.primaryBtnText}>Done</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Report “{product.name}”</Text>
                <Text style={styles.modalSub}>Reports are private and reviewed by the vendor & moderation team.</Text>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.reasonBtn, reason === r.value && { borderColor: Colors.purple, backgroundColor: Colors.purpleDim }]}
                    onPress={() => setReason(r.value)}
                  >
                    <Text style={{ color: reason === r.value ? Colors.purple : Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600" }}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]} placeholder="Add details (optional)" placeholderTextColor={Colors.textMuted} value={details} onChangeText={setDetails} multiline maxLength={1000} />
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setReportOpen(false)}><Text style={{ color: Colors.textMuted, fontWeight: "600" }}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }, reporting && { opacity: 0.6 }]} onPress={submitReport} disabled={reporting}>
                    <Text style={styles.primaryBtnText}>{reporting ? "Submitting…" : "Submit report"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },
  topRow: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  heroImage: { width: "100%", height: 280 },
  content: { padding: Spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  name: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text, marginTop: Spacing.xs },
  price: { fontSize: 26, fontWeight: "800", color: Colors.green, marginTop: Spacing.sm },
  desc: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginTop: Spacing.md },
  catChip: { alignSelf: "flex-start", paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, backgroundColor: Colors.purpleDim },
  catText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.purple, textTransform: "uppercase" },
  storeCard: { flexDirection: "row", alignItems: "center", gap: Spacing.md, backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.xl },
  storeAvatar: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center" },
  orderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25d366", borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl },
  orderText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "center", marginTop: Spacing.md, padding: Spacing.sm },
  reportText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  reviewForm: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.xs },
  label: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md },
  reviewCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xxl, gap: Spacing.md, paddingBottom: 44 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  modalSub: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 19 },
  reasonBtn: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderSubtle, backgroundColor: Colors.bgCard },
  primaryBtn: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  secondaryBtn: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center" },
  doneIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.greenDim, justifyContent: "center", alignItems: "center", alignSelf: "center" },
});

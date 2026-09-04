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
import { ArrowLeft, Package, MessageCircle, Star, Send, Flag, ChevronRight, Pencil, Trash2, Reply, X } from "lucide-react-native";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  // Author edit state
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  // Owner reply state
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const loadReviews = async (pid: string) => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/reviews?product_id=${pid}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.reviews || [];
        setReviews(list);
        if (list.length) setAvg(Math.round((list.reduce((s2: number, r: any) => s2 + r.rating, 0) / list.length) * 10) / 10);
      }
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const { data: p } = await supabase.from("products").select("*, stores(name, slug, user_id, whatsapp_number, instagram_handle)").eq("id", id).single();
      if (cancelled || !p) return;
      const storeRow = Array.isArray(p.stores) ? p.stores[0] : p.stores;
      setProduct({ ...(p as any), store: storeRow || undefined });
      trackEvent(p.store_id, "product_view", { productId: p.id });

      // Current signed-in user (for author edit/delete + owner reply)
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user) {
        setCurrentUserId(user.id);
        if (storeRow && storeRow.user_id === user.id) setIsStoreOwner(true);
      }

      await loadReviews(p.id);
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
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: product.id,
          store_id: product.store_id,
          reviewer_name: name.trim(),
          rating,
          comment: comment.trim() || null,
          user_id: user?.id || null,
        })
        .select()
        .single();
      if (error) {
        Alert.alert("Review failed", error.message || "Please try again.");
      } else if (data) {
        setName(""); setRating(0); setComment("");
        const fresh = [data, ...reviews];
        setReviews(fresh);
        setAvg(Math.round((fresh.reduce((s2, r) => s2 + r.rating, 0) / fresh.length) * 10) / 10);
      }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editingReview) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ rating: editRating, comment: editComment.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", editingReview.id);
      if (error) { Alert.alert("Update failed", error.message); }
      else {
        const fresh = reviews.map((r) => (r.id === editingReview.id ? { ...r, rating: editRating, comment: editComment.trim() || null } : r));
        setReviews(fresh);
        if (fresh.length) setAvg(Math.round((fresh.reduce((s2, r) => s2 + r.rating, 0) / fresh.length) * 10) / 10);
        setEditingReview(null);
      }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    Alert.alert("Delete review?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
          if (error) { Alert.alert("Delete failed", error.message); return; }
          const fresh = reviews.filter((r) => r.id !== reviewId);
          setReviews(fresh);
          if (fresh.length) setAvg(Math.round((fresh.reduce((s2, r) => s2 + r.rating, 0) / fresh.length) * 10) / 10);
          else setAvg(0);
        },
      },
    ]);
  };

  const saveReply = async () => {
    if (!replyingTo) return;
    setBusy(true);
    try {
      const trimmed = replyDraft.trim();
      const { error } = await supabase
        .from("reviews")
        .update({
          reply: trimmed || null,
          replied_at: trimmed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", replyingTo.id);
      if (error) { Alert.alert("Reply failed", error.message); }
      else {
        const fresh = reviews.map((r) => (r.id === replyingTo.id ? { ...r, reply: trimmed || null, replied_at: trimmed ? new Date().toISOString() : null } : r));
        setReviews(fresh);
        setReplyingTo(null);
        setReplyDraft("");
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
  const canManage = (r: any) => isStoreOwner || (currentUserId !== null && r.user_id === currentUserId);

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
                    <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.text }}>
                      {r.reviewer_name}
                      {currentUserId && r.user_id === currentUserId ? <Text style={{ color: Colors.purple, fontSize: 10 }}> (you)</Text> : null}
                    </Text>
                    <Text style={{ fontSize: 10, color: Colors.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Stars value={r.rating} />
                </View>
                {r.comment ? <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 19 }}>{r.comment}</Text> : null}

                {/* Author / owner actions */}
                {canManage(r) || isStoreOwner ? (
                  <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm }}>
                    {isStoreOwner ? (
                      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => { setReplyingTo(r); setReplyDraft(r.reply || ""); }}>
                        <Reply size={13} color={Colors.cyan} /><Text style={{ fontSize: 11, color: Colors.cyan, fontWeight: "600" }}>{r.reply ? "Edit reply" : "Reply"}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canManage(r) ? (
                      <>
                        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => { setEditingReview(r); setEditRating(r.rating); setEditComment(r.comment || ""); }}>
                          <Pencil size={13} color={Colors.textMuted} /><Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: "600" }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => deleteReview(r.id)}>
                          <Trash2 size={13} color={Colors.red} /><Text style={{ fontSize: 11, color: Colors.red, fontWeight: "600" }}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                ) : null}

                {/* Store reply */}
                {r.reply ? (
                  <View style={styles.replyBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <Reply size={12} color={Colors.cyan} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.cyan }}>
                        {product.store?.name || "Store"}
                        {r.replied_at ? ` · ${new Date(r.replied_at).toLocaleDateString()}` : ""}
                      </Text>
                    </View>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 }}>{r.reply}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit review modal */}
      <Modal visible={!!editingReview} transparent animationType="slide" onRequestClose={() => setEditingReview(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.modalTitle}>Edit review</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)}><X size={18} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            <Text style={styles.label}>Rating</Text>
            <Stars value={editRating} size={30} onSelect={setEditRating} />
            <Text style={styles.label}>Comment (optional)</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} value={editComment} onChangeText={setEditComment} multiline maxLength={1000} placeholderTextColor={Colors.textMuted} placeholder="Share your experience…" />
            <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={saveEdit} disabled={busy}>
              <Text style={styles.primaryBtnText}>{busy ? "Saving…" : "Save changes"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Owner reply modal */}
      <Modal visible={!!replyingTo} transparent animationType="slide" onRequestClose={() => setReplyingTo(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.modalTitle}>Reply to review</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}><X size={18} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>
              {replyingTo?.reviewer_name}: {replyingTo?.comment ? String(replyingTo.comment).slice(0, 120) : "no comment"}
            </Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top", marginTop: Spacing.md }]} value={replyDraft} onChangeText={setReplyDraft} multiline maxLength={1000} placeholderTextColor={Colors.textMuted} placeholder={`Reply as ${product.store?.name || "store"}…`} />
            <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={saveReply} disabled={busy}>
              <Text style={styles.primaryBtnText}>{busy ? "Posting…" : replyDraft.trim() ? "Post reply" : "Remove reply"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  replyBox: { marginTop: Spacing.sm, backgroundColor: "rgba(6,182,212,0.05)", borderWidth: 1, borderColor: "rgba(6,182,212,0.15)", borderRadius: BorderRadius.md, padding: Spacing.md },
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

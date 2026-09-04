import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  Linking, RefreshControl, TextInput, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, Store, Product } from "../../../lib/supabase";
import { trackStoreVisit, trackStoreClick } from "../../../lib/track";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import {
  ArrowLeft, Store as StoreIcon, MessageCircle, Camera, Package, Bot,
  ChevronRight, Star, Heart, Send, Pencil, Trash2, Reply, X,
} from "lucide-react-native";
import { AssistantChat } from "../../../components/AssistantChat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WEB_API_URL } from "../../../lib/auth";

const FAVORITES_KEY = "stallhq_favorites";

function StoreReviews({ storeId, storeName, storeUserId }: { storeId: string; storeName?: string; storeUserId?: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isOwner = storeUserId != null && currentUserId === storeUserId;
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/reviews?store_id=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        const storeReviews = (data.reviews || []).filter((r: any) => !r.product_id);
        setReviews(storeReviews);
        if (storeReviews.length) {
          setAvg(Math.round((storeReviews.reduce((s: number, r: any) => s + r.rating, 0) / storeReviews.length) * 10) / 10);
        }
      }
    } catch {}
  };
  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [storeId]);

  const submit = async () => {
    if (!name.trim()) { Alert.alert("Missing name", "Please enter your name."); return; }
    if (!rating) { Alert.alert("Missing rating", "Tap a star to rate this store."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          store_id: storeId,
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
        setName(""); setRating(0); setComment(""); setShowForm(false);
        await load();
      }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const canManage = (r: any) => isOwner || (currentUserId !== null && r.user_id === currentUserId);

  const saveEdit = async () => {
    if (!editingReview) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ rating: editRating, comment: editComment.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", editingReview.id);
      if (error) { Alert.alert("Update failed", error.message); }
      else { setEditingReview(null); await load(); }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const removeReview = async (id: string) => {
    Alert.alert("Delete review?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("reviews").delete().eq("id", id);
          if (error) { Alert.alert("Delete failed", error.message); return; }
          await load();
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
      else { setReplyingTo(null); setReplyDraft(""); await load(); }
    } catch {
      Alert.alert("Network error", "Please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color={i <= Math.round(value) ? Colors.amber : Colors.textMuted} fill={i <= Math.round(value) ? Colors.amber : "none"} />
      ))}
    </View>
  );

  return (
    <View style={styles.reviewSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Star size={16} color={Colors.amber} />
          <Text style={styles.sectionTitle}>Store Reviews</Text>
          {reviews.length > 0 && <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>({avg} ★ · {reviews.length})</Text>}
        </View>
        {!showForm && (
          <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.writeReviewText}>Write review</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View style={styles.reviewForm}>
          <Text style={styles.reviewFormLabel}>Your name</Text>
          <TextInput style={styles.reviewInput} placeholder="Name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} maxLength={100} />
          <Text style={styles.reviewFormLabel}>Rating</Text>
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Star size={30} color={i <= rating ? Colors.amber : Colors.textMuted} fill={i <= rating ? Colors.amber : "none"} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.reviewFormLabel}>Comment (optional)</Text>
          <TextInput style={[styles.reviewInput, { minHeight: 70, textAlignVertical: "top" }]} placeholder="How was shopping here?" placeholderTextColor={Colors.textMuted} value={comment} onChangeText={setComment} multiline maxLength={1000} />
          <TouchableOpacity style={[styles.submitReviewBtn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            <Send size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: FontSize.sm, fontWeight: "700" }}>{busy ? "Submitting…" : "Submit Review"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {reviews.length === 0 && !showForm ? (
        <Text style={{ fontSize: FontSize.sm, color: Colors.textMuted, marginVertical: Spacing.md }}>
          No reviews yet — be the first to review this store.
        </Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <View style={styles.reviewAvatar}><Text style={{ color: Colors.purple, fontWeight: "700", fontSize: FontSize.xs }}>{String(r.reviewer_name || "?").slice(0, 2).toUpperCase()}</Text></View>
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
            {canManage(r) ? (
              <View style={{ flexDirection: "row", gap: Spacing.lg, marginTop: Spacing.sm }}>
                {isOwner ? (
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => { setReplyingTo(r); setReplyDraft(r.reply || ""); }}>
                    <Reply size={13} color={Colors.cyan} /><Text style={{ fontSize: 11, color: Colors.cyan, fontWeight: "600" }}>{r.reply ? "Edit reply" : "Reply"}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => { setEditingReview(r); setEditRating(r.rating); setEditComment(r.comment || ""); }}>
                  <Pencil size={13} color={Colors.textMuted} /><Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: "600" }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => removeReview(r.id)}>
                  <Trash2 size={13} color={Colors.red} /><Text style={{ fontSize: 11, color: Colors.red, fontWeight: "600" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Store reply */}
            {r.reply ? (
              <View style={styles.replyBox}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Reply size={12} color={Colors.cyan} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.cyan }}>
                    {storeName || "Store"}
                    {r.replied_at ? ` · ${new Date(r.replied_at).toLocaleDateString()}` : ""}
                  </Text>
                </View>
                <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 }}>{r.reply}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      {/* Edit review modal */}
      <Modal visible={!!editingReview} transparent animationType="slide" onRequestClose={() => setEditingReview(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.modalTitle}>Edit review</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)}><X size={18} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            <Text style={styles.reviewFormLabel}>Rating</Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setEditRating(i)}>
                  <Star size={30} color={i <= editRating ? Colors.amber : Colors.textMuted} fill={i <= editRating ? Colors.amber : "none"} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.reviewFormLabel}>Comment (optional)</Text>
            <TextInput style={[styles.reviewInput, { minHeight: 80, textAlignVertical: "top" }]} value={editComment} onChangeText={setEditComment} multiline maxLength={1000} placeholderTextColor={Colors.textMuted} placeholder="Share your experience…" />
            <TouchableOpacity style={[styles.submitReviewBtn, busy && { opacity: 0.6 }]} onPress={saveEdit} disabled={busy}>
              <Text style={{ color: "#fff", fontSize: FontSize.md, fontWeight: "700" }}>{busy ? "Saving…" : "Save changes"}</Text>
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
            <TextInput
              style={[styles.reviewInput, { minHeight: 80, textAlignVertical: "top", marginTop: Spacing.md }]}
              value={replyDraft}
              onChangeText={setReplyDraft}
              multiline
              maxLength={1000}
              placeholderTextColor={Colors.textMuted}
              placeholder={`Reply as ${storeName || "store"}…`}
            />
            <TouchableOpacity style={[styles.submitReviewBtn, busy && { opacity: 0.6 }]} onPress={saveReply} disabled={busy}>
              <Text style={{ color: "#fff", fontSize: FontSize.md, fontWeight: "700" }}>{busy ? "Posting…" : replyDraft.trim() ? "Post reply" : "Remove reply"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function StoreDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [faved, setFaved] = useState(false);

  // Favorite (store) state
  const loadFav = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      setFaved(slugs.includes(slug || ""));
    } catch {}
  };
  const toggleFav = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      const next = faved ? slugs.filter((s) => s !== slug) : [...slugs, slug as string];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setFaved(!faved);
    } catch {}
  };

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== s.user_id) trackStoreVisit(s.id);
      }
    })();
    loadFav();
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

  const openWhatsApp = () => {
    if (!store?.whatsapp_number) return;
    trackStoreClick(store.id, "whatsapp");
    const num = store.whatsapp_number.replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(`Hi ${store.name}! 👋`)}`);
  };

  const openInstagram = () => {
    if (!store?.instagram_handle) return;
    trackStoreClick(store.id, "instagram");
    const handle = store.instagram_handle.replace(/^@/, "");
    Linking.openURL(`https://instagram.com/${handle}`);
  };

  if (!store) return <BrandLoader label="Opening store" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.favBtn, faved && { borderColor: Colors.red }]} onPress={toggleFav}>
            <Heart size={18} color={faved ? Colors.red : Colors.textMuted} fill={faved ? Colors.red : "none"} />
          </TouchableOpacity>
        </View>

        {store.banner_url && <Image source={{ uri: store.banner_url }} style={styles.banner} />}

        <View style={styles.storeInfo}>
          <View style={styles.storeRow}>
            {store.logo_url ? <Image source={{ uri: store.logo_url }} style={styles.logo} /> : (
              <View style={styles.logoPlaceholder}><StoreIcon size={22} color={Colors.textMuted} /></View>
            )}
            <View style={{ flex: 1 }}><Text style={styles.storeName}>{store.name}</Text><Text style={styles.storeSlug}>/{store.slug}</Text></View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </View>
          {store.description && <Text style={styles.description}>{store.description}</Text>}

          {/* Channel chips — now tappable */}
          <View style={styles.channels}>
            {store.whatsapp_number ? (
              <TouchableOpacity style={[styles.chip, { borderColor: "rgba(37,211,102,0.3)" }]} onPress={openWhatsApp} activeOpacity={0.7}>
                <MessageCircle size={13} color={Colors.green} />
                <Text style={[styles.chipText, { color: Colors.green }]}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
            {store.instagram_handle ? (
              <TouchableOpacity style={[styles.chip, { borderColor: "rgba(225,48,108,0.3)" }]} onPress={openInstagram} activeOpacity={0.7}>
                <Camera size={13} color={Colors.purple} />
                <Text style={[styles.chipText, { color: Colors.purple }]}>@{store.instagram_handle.replace(/^@/, "")}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.chip, { backgroundColor: Colors.purpleDim }]} onPress={() => setChatOpen(true)} activeOpacity={0.7}>
              <Bot size={13} color={Colors.purple} />
              <Text style={[styles.chipText, { color: Colors.purple }]}>Ask AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products — each opens product detail */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          {products.length === 0 ? (
            <View style={styles.emptyCard}><Package size={40} color={Colors.textMuted} /><Text style={styles.emptyText}>No products yet</Text></View>
          ) : products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productCard}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/(customer)/product/[id]", params: { id: p.id, slug: store.slug } })}
            >
              {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.productImage} /> : (
                <View style={styles.productImagePlaceholder}><Package size={20} color={Colors.textMuted} /></View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                {p.description ? <Text style={styles.productDesc} numberOfLines={2}>{p.description}</Text> : null}
                <Text style={styles.productPrice}>₦{p.price.toLocaleString()}</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Store reviews */}
        <View style={styles.productsSection}>
          <StoreReviews storeId={store.id} storeName={store.name} storeUserId={store.user_id} />
        </View>
      </ScrollView>

      <AssistantChat visible={chatOpen} onClose={() => setChatOpen(false)} storeSlug={store.slug} storeName={store.name} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 60 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  favBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.borderSubtle, backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center" },
  banner: { width: "100%", height: 180 },
  storeInfo: { padding: Spacing.lg },
  storeRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  logo: { width: 56, height: 56, borderRadius: BorderRadius.md, marginRight: Spacing.lg },
  logoPlaceholder: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  storeName: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.sm, color: Colors.textMuted },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  channels: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted },
  productsSection: { padding: Spacing.lg, paddingTop: 0 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  emptyCard: { alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxxl * 2, gap: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary },
  productCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  productImage: { width: 64, height: 64, borderRadius: BorderRadius.sm, marginRight: Spacing.md },
  productImagePlaceholder: { width: 64, height: 64, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  productDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  productPrice: { fontSize: FontSize.md, fontWeight: "700", color: Colors.green, marginTop: 4 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  writeReviewBtn: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.purpleDim },
  writeReviewText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.purple },
  reviewSection: { marginTop: Spacing.md },
  reviewForm: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.xs },
  reviewFormLabel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.sm },
  reviewInput: { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text },
  submitReviewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md },
  reviewCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center" },
  replyBox: { marginTop: Spacing.sm, backgroundColor: "rgba(6,182,212,0.05)", borderWidth: 1, borderColor: "rgba(6,182,212,0.15)", borderRadius: BorderRadius.md, padding: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xxl, gap: Spacing.md, paddingBottom: 44 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
});

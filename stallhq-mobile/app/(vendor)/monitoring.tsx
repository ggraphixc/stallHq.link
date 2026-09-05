import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  TextInput, Modal,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { postReviewReply } from "../../lib/reviewActions";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { ArrowLeft, Star, Trash2, Flag, ShieldAlert, MessageSquare, Inbox, Reply, X, CheckCircle2, Clock } from "lucide-react-native";

type Mode = "reviews" | "reports" | "history";

const REASON_LABELS: Record<string, string> = {
  fake: "Fake/counterfeit", counterfeit: "Counterfeit", misleading: "Misleading",
  prohibited: "Prohibited item", offensive: "Offensive", other: "Other",
};

const REVIEW_REPORT_LABELS: Record<string, string> = {
  fake: "Fake review", offensive: "Offensive", spam: "Spam",
  harassment: "Harassment", irrelevant: "Irrelevant", other: "Other",
};

export default function MonitoringScreen() {
  const router = useRouter();
  const { store, user } = useAuth();
  const [mode, setMode] = useState<Mode>("reviews");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reviewReports, setReviewReports] = useState<any[]>([]);
  const [resolvedReports, setResolvedReports] = useState<any[]>([]);
  const [resolvedReviewReports, setResolvedReviewReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const load = useCallback(async () => {
    if (!store) return;
    const [r, p, rr, hr, hrr] = await Promise.all([
      supabase
        .from("reviews")
        .select("*, products(name)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("product_reports")
        .select("*, products(name)")
        .eq("store_id", store.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("review_reports")
        .select("*, reviews(id, rating, comment, reviewer_name)")
        .eq("store_id", store.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("product_reports")
        .select("*, products(name)")
        .eq("store_id", store.id)
        .in("status", ["reviewed", "dismissed"])
        .order("resolved_at", { ascending: false })
        .limit(100),
      supabase
        .from("review_reports")
        .select("*, reviews(id, rating, comment, reviewer_name)")
        .eq("store_id", store.id)
        .in("status", ["reviewed", "dismissed"])
        .order("resolved_at", { ascending: false })
        .limit(100),
    ]);
    setReviews(r.data ?? []);
    setReports(p.data ?? []);
    setReviewReports(rr.data ?? []);
    setResolvedReports(hr.data ?? []);
    setResolvedReviewReports(hrr.data ?? []);
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const deleteReview = async (id: string) => {
    alert("Delete review?", "This removes the review permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setBusyId(id);
          await supabase.from("reviews").delete().eq("id", id);
          setReviews((prev) => prev.filter((x) => x.id !== id));
          setBusyId(null);
        },
      },
    ]);
  };

  const saveReply = async () => {
    if (!replyingTo) return;
    setBusyId(replyingTo.id);
    const trimmed = replyDraft.trim();
    const err = await postReviewReply(replyingTo.id, trimmed);
    setBusyId(null);
    if (err) { alert("Reply failed", err); return; }
    setReplyingTo(null);
    setReplyDraft("");
    await load();
  };

  const resolveReport = async (id: string, status: "reviewed" | "dismissed") => {
    setBusyId(id);
    await supabase
      .from("product_reports")
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", id);
    await load();
    setBusyId(null);
  };

  const resolveReviewReport = async (id: string, status: "reviewed" | "dismissed", hideReview: boolean) => {
    setBusyId(id);
    if (hideReview) {
      // Vendor treats the review as a violation — hide it and resolve the report
      const target = reviewReports.find((x) => x.id === id) ?? resolvedReviewReports.find((x) => x.id === id);
      if (target?.review_id) {
        await supabase.from("reviews").update({ hidden: true, updated_at: new Date().toISOString() }).eq("id", target.review_id);
      }
    }
    await supabase
      .from("review_reports")
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", id);
    await load();
    setBusyId(null);
  };

  const tabs: { key: Mode; label: string; count: number }[] = [
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "reports", label: "Reports", count: reports.length + reviewReports.length },
    { key: "history", label: "History", count: resolvedReports.length + resolvedReviewReports.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reviews & Reports</Text>
          <Text style={styles.subtitle}>Customer feedback on your store</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, mode === t.key && styles.tabActive]}
            onPress={() => setMode(t.key)}
          >
            {t.key === "reviews" ? (
              <MessageSquare size={13} color={mode === t.key ? Colors.purple : Colors.textMuted} />
            ) : t.key === "reports" ? (
              <Flag size={13} color={mode === t.key ? Colors.red : Colors.textMuted} />
            ) : (
              <Clock size={13} color={mode === t.key ? Colors.cyan : Colors.textMuted} />
            )}
            <Text style={[styles.tabText, mode === t.key && styles.tabTextActive]}>
              {t.label} ({t.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        {mode === "reviews" ? (
          reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Inbox size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySub}>When customers rate your products or store, they appear here.</Text>
            </View>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={12} color={i <= r.rating ? Colors.amber : Colors.textMuted} fill={i <= r.rating ? Colors.amber : "none"} />
                      ))}
                    </View>
                    <Text style={styles.itemName}>{r.reviewer_name}</Text>
                    <Text style={styles.itemMeta}>
                      {r.products?.name ? `On: ${r.products.name} · ` : "On: store page · "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: Spacing.sm, alignItems: "center" }}>
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => { setReplyingTo(r); setReplyDraft(r.reply || ""); }}
                    >
                      <Reply size={15} color={Colors.cyan} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteReview(r.id)}
                      disabled={busyId === r.id}
                    >
                      <Trash2 size={15} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
                {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                {r.hidden ? (
                  <Text style={{ fontSize: FontSize.xs, color: Colors.amber, marginTop: Spacing.sm, fontWeight: "600" }}>
                    Hidden from public — visible only to you
                  </Text>
                ) : null}
                {r.reply ? (
                  <View style={styles.replyBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <Reply size={12} color={Colors.cyan} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.cyan }}>
                        Your reply{r.replied_at ? ` · ${new Date(r.replied_at).toLocaleDateString()}` : ""}
                      </Text>
                    </View>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 }}>{r.reply}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )
        ) : mode === "reports" ? (
          reports.length === 0 && reviewReports.length === 0 ? (
            <View style={styles.emptyState}>
              <ShieldAlert size={36} color={Colors.green} />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySub}>No pending reports on your products or reviews. Nice!</Text>
            </View>
          ) : (
            <>
              {reports.map((r) => (
                <View key={r.id} style={[styles.itemCard, { borderColor: "rgba(239,68,68,0.25)" }]}>
                  <View style={styles.itemHead}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <Flag size={12} color={Colors.red} />
                        <Text style={[styles.itemName, { color: Colors.red }]}>{REASON_LABELS[r.reason] || r.reason}</Text>
                      </View>
                      <Text style={styles.itemMeta}>
                        {r.products?.name ? `On: ${r.products.name} · ` : ""}
                        {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                      {r.details ? <Text style={styles.comment}>{r.details}</Text> : null}
                    </View>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.redDim }]} onPress={() => resolveReport(r.id, "reviewed")} disabled={busyId === r.id}>
                      <Text style={[styles.actionText, { color: Colors.red }]}>Keep hidden</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.greenDim }]} onPress={() => resolveReport(r.id, "dismissed")} disabled={busyId === r.id}>
                      <Text style={[styles.actionText, { color: Colors.green }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {reviewReports.map((rr) => {
                const review = rr.reviews;
                return (
                  <View key={rr.id} style={[styles.itemCard, { borderColor: "rgba(239,68,68,0.25)" }]}>
                    <View style={styles.itemHead}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <Flag size={12} color={Colors.red} />
                          <Text style={[styles.itemName, { color: Colors.red }]}>
                            {REVIEW_REPORT_LABELS[rr.reason] || rr.reason}
                          </Text>
                        </View>
                        <Text style={styles.itemMeta}>
                          {review
                            ? `${review.reviewer_name || "Customer"} · ${review.rating ?? 0}/5 stars${review.comment ? ` · "${String(review.comment).slice(0, 90)}"` : ""} · `
                            : ""}
                          {new Date(rr.created_at).toLocaleDateString()}
                        </Text>
                        {rr.details ? <Text style={styles.comment}>{rr.details}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.redDim }]}
                        onPress={() => resolveReviewReport(rr.id, "reviewed", true)}
                        disabled={busyId === rr.id}
                      >
                        <Text style={[styles.actionText, { color: Colors.red }]}>Hide review</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.greenDim }]}
                        onPress={() => resolveReviewReport(rr.id, "dismissed", false)}
                        disabled={busyId === rr.id}
                      >
                        <Text style={[styles.actionText, { color: Colors.green }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </>
          )
        ) : resolvedReports.length === 0 && resolvedReviewReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySub}>Resolved and dismissed reports will appear here with timestamps.</Text>
          </View>
        ) : (
          <>
            {resolvedReports.map((r) => (
              <View key={r.id} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      {r.status === "reviewed" ? (
                        <CheckCircle2 size={13} color={Colors.red} />
                      ) : (
                        <CheckCircle2 size={13} color={Colors.green} />
                      )}
                      <Text style={[styles.itemName, { color: r.status === "reviewed" ? Colors.red : Colors.green, marginTop: 0 }]}>
                        {REASON_LABELS[r.reason] || r.reason} — {r.status === "reviewed" ? "Acted on" : "Dismissed"}
                      </Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      {r.products?.name ? `On: ${r.products.name} · ` : ""}
                      {r.resolved_at ? `Resolved ${new Date(r.resolved_at).toLocaleDateString()} ${new Date(r.resolved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </Text>
                    {r.details ? <Text style={styles.comment}>{r.details}</Text> : null}
                  </View>
                </View>
              </View>
            ))}
            {resolvedReviewReports.map((rr) => {
              const review = rr.reviews;
              return (
                <View key={rr.id} style={styles.itemCard}>
                  <View style={styles.itemHead}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        {rr.status === "reviewed" ? (
                          <CheckCircle2 size={13} color={Colors.red} />
                        ) : (
                          <CheckCircle2 size={13} color={Colors.green} />
                        )}
                        <Text style={[styles.itemName, { color: rr.status === "reviewed" ? Colors.red : Colors.green, marginTop: 0 }]}>
                          {REVIEW_REPORT_LABELS[rr.reason] || rr.reason} — {rr.status === "reviewed" ? "Review hidden" : "Dismissed"}
                        </Text>
                      </View>
                      <Text style={styles.itemMeta}>
                        {review ? `${review.reviewer_name || "Customer"} · ${review.rating ?? 0}/5 stars · ` : ""}
                        {rr.resolved_at ? `Resolved ${new Date(rr.resolved_at).toLocaleDateString()} ${new Date(rr.resolved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </Text>
                      {rr.details ? <Text style={styles.comment}>{rr.details}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Reply modal */}
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
              style={[styles.replyInput, { marginTop: Spacing.md }]}
              value={replyDraft}
              onChangeText={setReplyDraft}
              multiline
              maxLength={1000}
              placeholderTextColor={Colors.textMuted}
              placeholder={`Reply as ${store?.name || "your store"}…`}
            />
            <TouchableOpacity
              style={[styles.postReplyBtn, busyId === replyingTo?.id && { opacity: 0.6 }]}
              onPress={saveReply}
              disabled={busyId === replyingTo?.id}
            >
              <Text style={{ color: "#fff", fontSize: FontSize.md, fontWeight: "700" }}>
                {busyId === replyingTo?.id ? "Posting…" : replyDraft.trim() ? "Post reply" : "Remove reply"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  backBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: "center", alignItems: "center" },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  tabs: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 0 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle },
  tabActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  tabText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.purple },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  itemCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  itemHead: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  itemName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text, marginTop: 4 },
  itemMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  comment: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 19 },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.redDim, justifyContent: "center", alignItems: "center" },
  replyBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.cyanDim, justifyContent: "center", alignItems: "center" },
  replyBox: { marginTop: Spacing.sm, backgroundColor: "rgba(6,182,212,0.05)", borderWidth: 1, borderColor: "rgba(6,182,212,0.15)", borderRadius: BorderRadius.md, padding: Spacing.md },
  replyInput: { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text, minHeight: 90, textAlignVertical: "top" },
  postReplyBtn: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center", marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xxl, gap: Spacing.md, paddingBottom: 44 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  actionsRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md },
  actionText: { fontSize: FontSize.xs, fontWeight: "700" },
  emptyState: { alignItems: "center", padding: Spacing.xxxl * 2, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary, marginTop: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", lineHeight: 18 },
});

import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { ArrowLeft, Star, Trash2, Flag, ShieldAlert, MessageSquare, Inbox } from "lucide-react-native";

type Mode = "reviews" | "reports";

const REASON_LABELS: Record<string, string> = {
  fake: "Fake/counterfeit", counterfeit: "Counterfeit", misleading: "Misleading",
  prohibited: "Prohibited item", offensive: "Offensive", other: "Other",
};

export default function MonitoringScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [mode, setMode] = useState<Mode>("reviews");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!store) return;
    const [r, p] = await Promise.all([
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
    ]);
    setReviews(r.data ?? []);
    setReports(p.data ?? []);
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const deleteReview = async (id: string) => {
    Alert.alert("Delete review?", "This removes the review permanently.", [
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

  const resolveReport = async (id: string, status: "reviewed" | "dismissed") => {
    setBusyId(id);
    await supabase
      .from("product_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setReports((prev) => prev.filter((x) => x.id !== id));
    setBusyId(null);
  };

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
        {(["reviews", "reports"] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, mode === m && styles.tabActive]}
            onPress={() => setMode(m)}
          >
            {m === "reviews" ? <MessageSquare size={13} color={mode === m ? Colors.purple : Colors.textMuted} /> : <Flag size={13} color={mode === m ? Colors.red : Colors.textMuted} />}
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === "reviews" ? `Reviews (${reviews.length})` : `Reports (${reports.length})`}
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
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteReview(r.id)}
                    disabled={busyId === r.id}
                  >
                    <Trash2 size={15} color={Colors.red} />
                  </TouchableOpacity>
                </View>
                {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
              </View>
            ))
          )
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <ShieldAlert size={36} color={Colors.green} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>No pending reports on your products. Nice!</Text>
          </View>
        ) : (
          reports.map((r) => (
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
          ))
        )}
      </ScrollView>
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
  actionsRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md },
  actionText: { fontSize: FontSize.xs, fontWeight: "700" },
  emptyState: { alignItems: "center", padding: Spacing.xxxl * 2, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textSecondary, marginTop: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", lineHeight: 18 },
});

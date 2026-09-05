import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Linking,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { BrandLoader } from "../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { WEB_API_URL } from "../../lib/auth";

const PLAN_LABELS: Record<string, string> = {
  trial: "Free Trial",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "6-Month",
};

const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  monthly: 3500,
  quarterly: 7500,
  annual: 12000,
};

export default function BillingScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadData = async () => {
    if (!store) return;
    try {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      setPayments(data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [store?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const downloadInvoice = async (paymentId: string) => {
    setDownloading(paymentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${WEB_API_URL}/api/invoices/${paymentId}`, {
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      Linking.openURL(url);
    } catch {
      alert("Error", "Failed to download invoice.");
    } finally {
      setDownloading(null);
    }
  };

  const getPlanStatus = () => {
    if (!store) return { label: "Unknown", active: false, daysLeft: 0 };
    const plan = store.plan || "trial";
    const expiry = store.subscription_expires_at || store.trial_ends_at;
    if (!expiry) return { label: PLAN_LABELS[plan] || plan, active: true, daysLeft: 0 };
    const expDate = new Date(expiry);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / 86400000));
    const active = expDate > now;
    return { label: PLAN_LABELS[plan] || plan, active, daysLeft };
  };

  const planStatus = getPlanStatus();
  const successfulPayments = payments.filter((p) => p.paystack_status === "success");
  const totalSpent = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <BrandLoader label="Loading billing" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Billing & Subscription</Text>

        {/* Current plan */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIconBox}>
              <Ionicons name="card-outline" size={20} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planLabel}>CURRENT PLAN</Text>
              <Text style={styles.planName}>{planStatus.label}</Text>
            </View>
            <View style={[styles.planBadge, { backgroundColor: planStatus.active ? Colors.greenDim : Colors.redDim }]}>
              {planStatus.active ? <Ionicons name="checkmark-circle" size={14} color={Colors.green} /> : <Ionicons name="warning" size={14} color={Colors.red} />}
              <Text style={[styles.planBadgeText, { color: planStatus.active ? Colors.green : Colors.red }]}>
                {planStatus.active ? "Active" : "Expired"}
              </Text>
            </View>
          </View>

          {planStatus.daysLeft > 0 && (
            <Text style={styles.planMeta}>{planStatus.daysLeft} days remaining</Text>
          )}

          {store?.plan !== "annual" && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => Linking.openURL("https://hqlink.vercel.app/upgrade")}
            >
              <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment history */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <Text style={styles.totalSpent}>Total: ₦{totalSpent.toLocaleString()}</Text>
          </View>

          {successfulPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No payments yet</Text>
              <Text style={styles.emptySub}>Your payment history will appear here.</Text>
            </View>
          ) : (
            successfulPayments.map((p) => (
              <View key={p.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View>
                    <Text style={styles.paymentPlan}>{PLAN_LABELS[p.plan] || p.plan}</Text>
                    <Text style={styles.paymentDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>₦{(p.amount || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.paymentFooter}>
                  <Text style={styles.paymentRef}>Ref: {p.paystack_reference || "N/A"}</Text>
                  <TouchableOpacity
                    style={[styles.invoiceBtn, downloading === p.id && { opacity: 0.5 }]}
                    onPress={() => downloadInvoice(p.id)}
                    disabled={downloading === p.id}
                  >
                    <Ionicons name="download-outline" size={14} color={Colors.purple} />
                    <Text style={styles.invoiceBtnText}>
                      {downloading === p.id ? "Loading…" : "Invoice"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xl },
  planCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.xl },
  planHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  planIconBox: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center" },
  planLabel: { ...labelStyle },
  planName: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginTop: 2 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  planBadgeText: { fontSize: FontSize.xs, fontWeight: "700" },
  planMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.md },
  upgradeBtn: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: "center", marginTop: Spacing.lg },
  upgradeBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  totalSpent: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  paymentCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  paymentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  paymentPlan: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  paymentDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paymentAmount: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.green },
  paymentFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  paymentRef: { fontSize: FontSize.xs, color: Colors.textMuted },
  invoiceBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.purpleDim },
  invoiceBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.purple },
});

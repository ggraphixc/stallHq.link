import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BrandLoader } from "../../components/BrandLoader";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import { Send, X, CheckCircle, AlertCircle, Clock, MessageSquare } from "lucide-react-native";
import { WEB_API_URL } from "../../lib/auth";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  store_id?: string | null;
  store?: { name?: string; slug?: string } | null;
  messages?: { id: string; sender_id: string; sender_role: string; message: string; created_at: string }[];
}

const CATEGORIES = ["general", "technical", "billing", "bug_report", "feature_request"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
const STATUS_COLOR: Record<string, string> = { open: Colors.amber, in_progress: Colors.blue, resolved: Colors.green, closed: Colors.textMuted };

export default function SupportScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/support/tickets?admin=true`, {
        headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""}` },
      });
      if (res.ok) setTickets(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${WEB_API_URL}/api/support/tickets`, {
          headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""}` },
        });
        if (!cancelled && res.ok) setTickets(await res.json());
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""}` },
      });
      if (res.ok) setTickets(await res.json());
    } catch {}
    setRefreshing(false);
  };

  const openCreate = () => {
    setCreating(true);
    setSubject(""); setCategory("general"); setPriority("normal"); setMessage("");
  };

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing fields", "Please add a subject and a message.");
      return;
    }
    try {
      const res = await fetch(`${WEB_API_URL}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), category, priority, message: message.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create ticket");
      }
      setCreating(false);
      setSubject(""); setMessage("");
      await load();
      Alert.alert("Ticket created", "Your support ticket has been submitted.", [{ text: "OK" }]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Please try again.");
    }
  };

  const closeCreate = () => { setCreating(false); setSubject(""); setMessage(""); };

  if (loading) return <BrandLoader label="Loading support" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Send size={13} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {creating ? (
        <View style={styles.createPanel}>
          <Text style={styles.createTitle}>New support ticket</Text>
          <Text style={styles.createSub}>Describe your issue and we'll get back to you.</Text>

          <Text style={styles.label}>Subject *</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="What's this about?" placeholderTextColor={Colors.textMuted} maxLength={120} />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c.replace("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Priority</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity key={p} style={[styles.chip, priority === p && styles.chipActive]} onPress={() => setPriority(p)}>
                <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue in detail…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
          />

          <View style={styles.createActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeCreate}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submitTicket}>
              <Send size={14} color="#fff" />
              <Text style={{ color: "#fff", fontSize: FontSize.sm, fontWeight: "700" }}>Submit ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.empty}>
          <MessageSquare size={32} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No support tickets yet</Text>
          <Text style={styles.emptySub}>Tap "New" to open a support ticket.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }>
          {tickets.map((t) => (
            <TouchableOpacity key={t.id} style={styles.card} onPress={() => router.push(`/(vendor)/support/${t.id}`)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
                  <Text style={styles.meta}>#{t.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[t.status] + "18", borderColor: STATUS_COLOR[t.status] + "44" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[t.status] }]}>{STATUS_LABEL[t.status] || t.status}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>{new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Text>
                  <Text style={styles.cardMetaDot}>·</Text>
                  <Text style={styles.cardMeta}>
                    {["general", "technical", "billing", "bug_report", "feature_request"].includes(t.category) ? t.category.replace("_", " ") : t.category}
                  </Text>
                  <Text style={styles.cardMetaDot}>·</Text>
                  <Text style={[styles.cardMeta, { color: t.priority === "urgent" ? Colors.red : t.priority === "high" ? Colors.amber : Colors.textMuted }]}>
                    {t.priority}
                  </Text>
                </View>
                {t.messages && t.messages.length > 0 && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={styles.replyPreviewLabel}>
                      {t.messages.length} {t.messages.length === 1 ? "message" : "messages"}
                    </Text>
                    <Text style={styles.replyPreview} numberOfLines={2}>
                      {t.messages[t.messages.length - 1].message}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: "row" as const, alignItems: "center" as const, padding: Spacing.lg, paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    backBtn: { padding: Spacing.xs },
    backText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.purple },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text, marginHorizontal: Spacing.md },
    createBtn: {
      marginLeft: Spacing.sm, flexDirection: "row" as const, alignItems: "center" as const, gap: 4,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      backgroundColor: Colors.purple, borderRadius: BorderRadius.md,
    },
    createBtnText: { fontSize: FontSize.xs, fontWeight: "700" as const, color: "#fff" },
    createPanel: {
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
    },
    createTitle: { fontSize: FontSize.lg, fontWeight: "700" as const, color: Colors.text, marginBottom: 4 },
    createSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
    label: { ...labelStyle, marginTop: Spacing.md, marginBottom: Spacing.xs, color: Colors.textSecondary },
    input: {
      backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text,
    },
    chipRow: { flexDirection: "row" as const, gap: Spacing.sm, marginBottom: Spacing.xs, paddingVertical: Spacing.xs },
    chip: {
      flexDirection: "row" as const, alignItems: "center" as const, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    },
    chipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
    chipText: { fontSize: FontSize.xs, fontWeight: "600" as const, color: Colors.textMuted },
    chipTextActive: { color: Colors.purple },
    createActions: { flexDirection: "row" as const, gap: Spacing.sm, marginTop: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
    cancelBtn: {
      flex: 1, alignItems: "center" as const, justifyContent: "center" as const,
      padding: Spacing.md, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: Colors.borderSubtle, backgroundColor: "transparent",
    },
    cancelText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.textSecondary },
    submitBtn: {
      flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 4,
      padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.purple,
    },
    empty: { alignItems: "center" as const, padding: Spacing.xxxl * 2, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: "600" as const, color: Colors.textSecondary },
    emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
    list: { padding: Spacing.lg, paddingTop: 0 },
    card: {
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    cardHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: Spacing.xs },
    subject: { fontSize: FontSize.md, fontWeight: "600" as const, color: Colors.text, flex: 1, marginRight: Spacing.sm },
    meta: { fontSize: FontSize.xs, color: Colors.textMuted },
    statusBadge: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
      alignSelf: "flex-start" as const, flexShrink: 1,
    },
    statusText: { fontSize: FontSize.xs, fontWeight: "600" as const, textTransform: "capitalize" as const },
    cardBody: { paddingTop: Spacing.sm },
    cardMetaRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.xs, flexWrap: "wrap" as const },
    cardMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
    cardMetaDot: { fontSize: FontSize.xs, color: Colors.textMuted },
    replyPreviewLabel: { fontSize: FontSize.xs, fontWeight: "600" as const, color: Colors.textMuted, marginTop: Spacing.sm },
    replyPreview: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: 2 },
  }));
  return s;
};
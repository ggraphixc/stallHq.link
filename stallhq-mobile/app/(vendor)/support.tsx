import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, RefreshControl,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { BrandLoader } from "../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle, ambientInput } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { WEB_API_URL } from "../../lib/auth";

const CATEGORIES = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Billing issue" },
  { value: "technical", label: "Technical problem" },
  { value: "feature", label: "Feature request" },
  { value: "bug", label: "Bug report" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.textMuted,
  normal: Colors.blue,
  high: Colors.amber,
  urgent: Colors.red,
};

export default function SupportScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/support/tickets`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTickets();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const createTicket = async () => {
    if (!subject.trim()) { alert("Error", "Please enter a subject"); return; }
    if (!message.trim()) { alert("Error", "Please enter a message"); return; }
    setCreating(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim(),
          store_id: store?.id,
        }),
      });
      if (res.ok) {
        alert("Submitted", "Your support ticket has been created. We'll get back to you soon.");
        setSubject(""); setCategory("general"); setMessage("");
        await loadTickets();
      } else {
        const d = await res.json();
        alert("Error", d.error || "Failed to create ticket.");
      }
    } catch {
      alert("Error", "Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Ionicons name="time-outline" size={14} color={Colors.amber} />;
      case "in_progress": return <Ionicons name="chatbubble-outline" size={14} color={Colors.blue} />;
      case "replied": return <Ionicons name="chatbubble-outline" size={14} color={Colors.cyan} />;
      case "resolved": return <Ionicons name="checkmark-circle" size={14} color={Colors.green} />;
      case "closed": return <Ionicons name="checkmark-circle" size={14} color={Colors.textMuted} />;
      default: return <Ionicons name="time-outline" size={14} color={Colors.textMuted} />;
    }
  };

  if (loading) return <BrandLoader label="Loading support" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Support</Text>

        {/* New ticket form */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>NEW TICKET</Text>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={Colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={200}
          />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
            <Text style={styles.pickerText}>{CATEGORIES.find((c) => c.value === category)?.label}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.pickerOptions}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.pickerOption, category === c.value && styles.pickerOptionActive]}
                  onPress={() => { setCategory(c.value); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, category === c.value && { color: Colors.purple }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
            placeholder="Describe your issue in detail…"
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[styles.submitBtn, creating && { opacity: 0.6 }]}
            onPress={createTicket}
            disabled={creating}
          >
            <Ionicons name="send" size={14} color="#fff" />
            <Text style={styles.submitBtnText}>{creating ? "Submitting…" : "Submit Ticket"}</Text>
          </TouchableOpacity>
        </View>

        {/* Existing tickets */}
        {tickets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Tickets</Text>
            {tickets.map((t) => (
              <View key={t.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                    <Text style={styles.ticketMeta}>{t.category} · {new Date(t.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.ticketStatus}>
                    {getStatusIcon(t.status)}
                    <Text style={styles.ticketStatusText}>{t.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.xl },
  cardLabel: { ...labelStyle, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  picker: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...ambientInput, paddingHorizontal: Spacing.md },
  pickerText: { fontSize: FontSize.md, color: Colors.text },
  pickerOptions: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.md, marginTop: Spacing.xs },
  pickerOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  pickerOptionActive: { backgroundColor: Colors.purpleDim },
  pickerOptionText: { fontSize: FontSize.md, color: Colors.textSecondary },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg },
  submitBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  ticketCard: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  ticketSubject: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  ticketMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  ticketStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketStatusText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary, textTransform: "capitalize" },
});

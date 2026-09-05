import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, RefreshControl,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { BrandLoader } from "../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { WEB_API_URL } from "../../lib/auth";

interface Prefs {
  order_updates: boolean;
  marketing: boolean;
  trial_reminders: boolean;
  product_alerts: boolean;
  review_notifications: boolean;
}

const DEFAULT_PREFS: Prefs = {
  order_updates: true,
  marketing: false,
  trial_reminders: true,
  product_alerts: true,
  review_notifications: true,
};

export default function EmailPreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      const res = await fetch(`${WEB_API_URL}/api/email-preferences`);
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs({ ...DEFAULT_PREFS, ...data.preferences });
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/email-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (res.ok) {
        alert("Saved", "Your email preferences have been updated.");
      } else {
        alert("Error", "Failed to save preferences.");
      }
    } catch {
      alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <BrandLoader label="Loading preferences" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Email Preferences</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>NOTIFICATIONS</Text>

          {[
            { key: "order_updates" as const, label: "Order updates", desc: "Status changes and delivery notifications" },
            { key: "trial_reminders" as const, label: "Trial reminders", desc: "Expiry warnings before your trial ends" },
            { key: "product_alerts" as const, label: "Product alerts", desc: "Low stock and inventory warnings" },
            { key: "review_notifications" as const, label: "Review notifications", desc: "New reviews and replies on your store" },
            { key: "marketing" as const, label: "Marketing emails", desc: "Tips, feature updates, and promotions" },
          ].map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: Colors.bgSecondary, true: Colors.purpleDim }}
                thumbColor={prefs[item.key] ? Colors.purple : Colors.textMuted}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={savePrefs}
          disabled={saving}
        >
          <Ionicons name="save-outline" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Preferences"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xs },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.xl },
  cardLabel: { ...labelStyle, marginBottom: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  rowLabel: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  rowDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  saveBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
});

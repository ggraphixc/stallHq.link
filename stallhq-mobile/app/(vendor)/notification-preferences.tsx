import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";
import { WEB_API_URL } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { ArrowLeft } from "lucide-react-native";

interface NotificationPrefs {
  order_updates: boolean;
  trial_reminders: boolean;
  product_alerts: boolean;
  review_replies: boolean;
  marketing: boolean;
}

const PREF_LABELS: Record<keyof NotificationPrefs, { label: string; description: string }> = {
  order_updates: {
    label: "Order Updates",
    description: "New orders and status changes",
  },
  trial_reminders: {
    label: "Trial Reminders",
    description: "Expiry warnings and upgrade prompts",
  },
  product_alerts: {
    label: "Product Alerts",
    description: "Low stock and inventory notifications",
  },
  review_replies: {
    label: "Review Replies",
    description: "When customers reply to reviews",
  },
  marketing: {
    label: "Marketing",
    description: "Platform tips and promotional content",
  },
};

export default function VendorNotificationPreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    order_updates: true,
    trial_reminders: true,
    product_alerts: true,
    review_replies: true,
    marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrefs();
  }, []);

  async function fetchPrefs() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`${WEB_API_URL}/api/notifications/preferences`, {
        headers: { "x-access-token": session.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) setPrefs(data.preferences);
      }
    } catch (err) {
      console.warn("[vendorNotifPrefs] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`${WEB_API_URL}/api/notifications/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.access_token,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.warn("[vendorNotifPrefs] update error:", err);
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={18} color={Colors.purple} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Notification Preferences</Text>
      <Text style={styles.subtitle}>Control what notifications you receive</Text>

      <View style={styles.card}>
        {(Object.keys(PREF_LABELS) as (keyof NotificationPrefs)[]).map((key, i) => (
          <View key={key}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.label}>{PREF_LABELS[key].label}</Text>
                <Text style={styles.description}>{PREF_LABELS[key].description}</Text>
              </View>
              <Switch
                value={prefs[key]}
                onValueChange={(val) => updatePref(key, val)}
                trackColor={{ false: Colors.bgSecondary, true: Colors.purpleDim }}
                thumbColor={prefs[key] ? Colors.purple : Colors.textMuted}
                disabled={saving}
              />
            </View>
            {i < Object.keys(PREF_LABELS).length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.lg,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.purple,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    ...ambientCard,
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
});

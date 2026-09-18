import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";
import { WEB_API_URL } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

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
    description: "Get notified when your order status changes",
  },
  trial_reminders: {
    label: "Trial Reminders",
    description: "Reminders about your free trial expiry",
  },
  product_alerts: {
    label: "Product Alerts",
    description: "Low stock, back-in-stock, and price drop alerts",
  },
  review_replies: {
    label: "Review Replies",
    description: "When a vendor replies to your review",
  },
  marketing: {
    label: "Marketing",
    description: "Tips, promotions, and platform updates",
  },
};

export default function NotificationPreferencesScreen() {
  const { session } = useAuth();
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
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s?.access_token) return;

      const res = await fetch(`${WEB_API_URL}/api/notifications/preferences`, {
        headers: { "x-access-token": s.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      }
    } catch (err) {
      console.warn("[notifPrefs] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s?.access_token) return;

      await fetch(`${WEB_API_URL}/api/notifications/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": s.access_token,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.warn("[notifPrefs] update error:", err);
      // Revert on error
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
      <Text style={styles.title}>Notification Preferences</Text>
      <Text style={styles.subtitle}>Choose what you'd like to be notified about</Text>

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

      {saving && (
        <Text style={styles.saving}>Saving...</Text>
      )}
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
  saving: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
});

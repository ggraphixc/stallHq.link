import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";
import { WEB_API_URL } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Bell, Check } from "lucide-react-native";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  order: "📦",
  promo: "🎉",
  reply: "💬",
  trend: "📈",
  info: "ℹ️",
  order_status: "📦",
  low_stock: "⚠️",
  back_in_stock: "✅",
  price_drop: "💰",
  new_review: "⭐",
  subscription_expiry: "⏰",
};

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`${WEB_API_URL}/api/notifications/user`, {
        headers: { "x-access-token": session.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn("[notif] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`${WEB_API_URL}/api/notifications/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.access_token,
        },
        body: JSON.stringify({ id, read: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn("[notif] mark read error:", err);
    }
  }

  async function markAllRead() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`${WEB_API_URL}/api/notifications/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.access_token,
        },
        body: JSON.stringify({ read_all: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.warn("[notif] mark all read error:", err);
    }
  }

  function handlePress(notif: Notification) {
    markAsRead(notif.id);
    if (notif.link) {
      router.push(notif.link as any);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Check size={14} color={Colors.purple} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.icon}>{TYPE_ICONS[item.type] || "🔔"}</Text>
            <View style={styles.content}>
              <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  markAllText: { fontSize: FontSize.sm, color: Colors.purple, fontWeight: "600" },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: {
    ...ambientCard,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  icon: { fontSize: 24, marginRight: Spacing.md },
  content: { flex: 1 },
  notifTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text, marginBottom: 2 },
  notifBody: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  time: { fontSize: FontSize.xs, color: Colors.textMuted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.purple,
    marginLeft: Spacing.sm,
  },
  empty: {
    alignItems: "center",
    padding: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "500" },
});

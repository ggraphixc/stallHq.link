import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { Bell, Check, CheckCheck } from "lucide-react-native";

interface UserNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: Colors.cyan,
  order: Colors.green,
  promo: Colors.purple,
  reply: Colors.amber,
  trend: Colors.blue,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "https://hqlink.vercel.app"}/api/notify/user?user_id=${session.user.id}`
      );
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, [session?.user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL || "https://hqlink.vercel.app"}/api/notify/user`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    if (!session?.user) return;
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL || "https://hqlink.vercel.app"}/api/notify/user`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, read_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        renderItem={({ item }) => {
          const color = TYPE_COLORS[item.type] || Colors.textMuted;
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              activeOpacity={0.85}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardText} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardTime}>
                  {timeAgo(item.created_at)}
                </Text>
              </View>
              {!item.read ? (
                <View style={[styles.unreadBadge, { backgroundColor: color }]} />
              ) : (
                <CheckCheck size={14} color={Colors.green} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text },
  markAll: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.purple },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
  },
  cardUnread: { backgroundColor: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.15)" },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  cardText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  cardTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  empty: { alignItems: "center", padding: Spacing.xxxl * 2, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "500" },
});

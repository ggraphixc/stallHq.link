import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { Bell, CheckCheck, X } from "lucide-react-native";
import { useAuth } from "../lib/auth";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { WEB_API_URL } from "../lib/config";

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

/**
 * Bell icon with an unread badge, placed in screen headers (customer + vendor).
 * Tapping it slides up a bottom-sheet overlay with the full notification list.
 */
export function NotificationBell({ size = 36 }: { size?: number }) {
  const styles = useThemeStyles(makeStyles);
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${WEB_API_URL}/api/notify/user?user_id=${userId}`);
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openOverlay = () => {
    load();
    setVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${WEB_API_URL}/api/notify/user`, {
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
    if (!userId) return;
    try {
      await fetch(`${WEB_API_URL}/api/notify/user`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, read_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TouchableOpacity
        style={[styles.bellBtn, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={openOverlay}
        activeOpacity={0.7}
      >
        <Bell size={Math.round(size * 0.48)} color={Colors.textSecondary} strokeWidth={1.8} />
        {userId && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <View style={styles.sheetHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                    <Text style={styles.markAll}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {!userId ? (
              <View style={styles.empty}>
                <Bell size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Sign in to see notifications</Text>
                <Text style={styles.emptySub}>Order updates, replies and alerts will appear here.</Text>
              </View>
            ) : (
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
                        <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
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
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = () => StyleSheet.create({
  bellBtn: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.purple,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingBottom: 40,
    maxHeight: "78%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  sheetHeaderRight: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  markAll: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.purple },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center",
  },

  list: { paddingBottom: Spacing.sm },
  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
  },
  cardUnread: { backgroundColor: "Colors.purpleTint", borderColor: "rgba(168,85,247,0.15)" },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  cardText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  cardTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  empty: { alignItems: "center", paddingVertical: Spacing.xxxl * 2, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "600" },
  emptySub: { fontSize: FontSize.xs, color: Colors.textMuted },
});
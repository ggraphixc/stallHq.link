import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, Linking,
} from "react-native";
import { Bell, CheckCheck, X, ChevronRight, ImageOff } from "lucide-react-native";
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
  image_url?: string;
  action_label?: string;
  action_link?: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: Colors.cyan,
  order: Colors.green,
  promo: Colors.purple,
  reply: Colors.amber,
  trend: Colors.blue,
  success: Colors.green,
  warning: Colors.amber,
  error: Colors.red,
  announcement: Colors.blue,
};

const TYPE_ICONS: Record<string, string> = {
  info: "ℹ️",
  order: "📦",
  promo: "🎉",
  reply: "💬",
  trend: "📈",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  announcement: "📢",
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

export function NotificationBell({ size = 36 }: { size?: number }) {
  const styles = useThemeStyles(makeStyles);
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
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

  const handleAction = (link: string) => {
    Linking.openURL(link).catch(() => {});
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
                  const hasImage = item.image_url && !imgErrors.has(item.id);
                  const hasAction = item.action_label && item.action_link;
                  return (
                    <TouchableOpacity
                      style={[styles.card, !item.read && styles.cardUnread]}
                      activeOpacity={0.85}
                      onPress={() => markRead(item.id)}
                    >
                      {hasImage ? (
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: item.image_url! }}
                            style={styles.image}
                            resizeMode="cover"
                            onError={() => setImgErrors(prev => new Set(prev).add(item.id))}
                          />
                        </View>
                      ) : (
                        <View style={[styles.typeIcon, { backgroundColor: color + "18" }]}>
                          <Text style={styles.typeEmoji}>{TYPE_ICONS[item.type] || "🔔"}</Text>
                        </View>
                      )}
                      <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                          {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                        <View style={styles.cardBottomRow}>
                          <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                          {hasAction && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { borderColor: color + "40" }]}
                              onPress={() => handleAction(item.action_link!)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.actionText, { color }]} numberOfLines={1}>{item.action_label}</Text>
                              <ChevronRight size={10} color={color} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Bell size={32} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptySub}>Order updates and alerts will appear here.</Text>
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
    maxHeight: "82%",
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
    flexDirection: "row", gap: Spacing.sm,
    padding: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  cardUnread: { backgroundColor: Colors.purpleTint, borderColor: "rgba(168,85,247,0.15)" },

  imageContainer: {
    width: 56, height: 56, borderRadius: BorderRadius.md, overflow: "hidden", flexShrink: 0,
  },
  image: { width: "100%", height: "100%" },
  typeIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  typeEmoji: { fontSize: 16 },

  cardContent: { flex: 1, gap: 2 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  cardTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text, flex: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  cardBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  cardBottomRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4,
  },
  cardTime: { fontSize: 10, color: Colors.textMuted },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderRadius: 12,
  },
  actionText: { fontSize: 10, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: Spacing.xxxl * 2, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "600" },
  emptySub: { fontSize: FontSize.xs, color: Colors.textMuted },
});

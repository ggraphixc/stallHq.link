import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, Image, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { supabase } from "../../../lib/supabase";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, shadowMd } from "../../../lib/theme";
import { useAuth, WEB_API_URL } from "../../../lib/auth";
import { BrandLoader } from "../../../components/BrandLoader";
import { MessageCircle, Search, Store, Globe, BellOff } from "lucide-react-native";
import { subscribeResilient } from "../../../lib/globalChat";
import { SwipeableRoomRow } from "../../../components/chat/SwipeableRoomRow";
import { useRoomPrefs, setRoomPref } from "../../../lib/chatRoomPrefs";
import { alert } from "../../../components/ui/CustomAlert";

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  store_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_customer: number;
  unread_vendor: number;
  store?: { id: string; name: string; slug: string; logo_url: string | null };
}

export default function CustomerChatListScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { session } = useAuth();
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const accessToken = session?.access_token;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const prefs = useRoomPrefs();

  const authHeaders: Record<string, string> = accessToken
    ? { "x-access-token": accessToken }
    : {};

  // Store page Message chip → create/find conversation and jump into it
  useEffect(() => {
    if (!storeId || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${WEB_API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ storeId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.conversationId) {
          router.replace(`/(customer)/chat/${data.conversationId}`);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [storeId, accessToken]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${WEB_API_URL}/api/chat?customer_id=${session?.user?.id}`,
        { headers: authHeaders }
      );
      if (res.ok) setConversations(await res.json());
    } catch {}
    setLoading(false);
  }, [session?.user?.id, accessToken]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription with status-aware poll fallback
  useEffect(() => {
    let connected = false;
    const sub = subscribeResilient({
      name: "customer-chat-list",
      table: "messages",
      events: ["INSERT"],
      onRow: () => {
        load();
      },
      onConnected: () => {
        connected = true;
        load();
      },
      onDisconnected: () => {
        connected = false;
      },
    });
    let ticks = 0;
    const poll = setInterval(() => {
      ticks += 1;
      if (!connected || ticks % 5 === 0) load();
    }, 3000);
    return () => {
      sub.destroy();
      clearInterval(poll);
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.store?.name?.toLowerCase().includes(q) || c.last_message?.toLowerCase().includes(q);
  });

  const isActiveRow = (c: Conversation) => {
    const p = prefs[c.id];
    return !p?.archived && !p?.blocked && !p?.hidden;
  };
  const isArchivedRow = (c: Conversation) => {
    const p = prefs[c.id];
    if (p?.hidden) return false;
    return !!(p?.archived || p?.blocked);
  };
  const archivedCount = conversations.filter(isArchivedRow).length;
  const viewList = showArchived ? filtered.filter(isArchivedRow) : filtered.filter(isActiveRow);

  const archive = (id: string) => setRoomPref(id, { archived: true });
  const unarchive = (id: string) => setRoomPref(id, { archived: false });
  const setMuted = (id: string, muted: boolean) => setRoomPref(id, { muted });
  const unblock = (id: string) => setRoomPref(id, { blocked: false });
  const confirmBlock = (id: string) => {
    alert(
      "Block this conversation?",
      "It will be hidden from your list on this device only. You can unblock it from the Archived view.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => setRoomPref(id, { blocked: true }) },
      ]
    );
  };
  const confirmDelete = (id: string) => {
    alert(
      "Delete this conversation from your list?",
      "This only affects your device view — the conversation isn't deleted from the server.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => setRoomPref(id, { hidden: true }) },
      ]
    );
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) return <BrandLoader label="Loading messages" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BlurView
          intensity={Platform.OS === "android" ? 40 : 55}
          tint={Platform.OS === "android" ? "light" : "dark"}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerVeil} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.globalBtn}
          onPress={() => router.push("/(customer)/chat/global")}
          activeOpacity={0.7}
        >
          <Globe size={14} color={Colors.purple} />
          <Text style={styles.globalBtnText}>Community</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search size={14} color={Colors.textMuted} style={{ position: "absolute", left: 12, top: "50%", marginTop: -7 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !showArchived && styles.filterChipActive]}
          onPress={() => setShowArchived(false)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, !showArchived && styles.filterChipTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, showArchived && styles.filterChipActive]}
          onPress={() => setShowArchived(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, showArchived && styles.filterChipTextActive]}>
            Archived ({archivedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {viewList.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {showArchived
              ? "Nothing archived"
              : search
                ? "No conversations match"
                : "No conversations yet"}
          </Text>
          <Text style={styles.emptySub}>
            {showArchived
              ? "Archived conversations appear here"
              : search
                ? "Try another search"
                : "Message a vendor from their store page"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={viewList}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
          renderItem={({ item: conv }) => {
            const unread = conv.unread_customer;
            const pref = prefs[conv.id] ?? {};
            const muted = !!pref.muted;
            const blocked = !!pref.blocked;
            return (
              <View style={styles.convRow}>
                <SwipeableRoomRow
                  style={styles.convItem}
                  onPress={() => router.push(`/(customer)/chat/${conv.id}`)}
                  isArchived={!!pref.archived}
                  isMuted={muted}
                  isBlocked={blocked}
                  onArchive={() => archive(conv.id)}
                  onUnarchive={() => unarchive(conv.id)}
                  onMute={() => setMuted(conv.id, true)}
                  onUnmute={() => setMuted(conv.id, false)}
                  onBlock={() => confirmBlock(conv.id)}
                  onUnblock={() => unblock(conv.id)}
                  onDelete={() => confirmDelete(conv.id)}
                >
                  {conv.store?.logo_url ? (
                    <Image source={{ uri: conv.store.logo_url }} style={styles.logo} />
                  ) : (
                    <View style={styles.avatar}>
                      <Store size={18} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.convInfo}>
                    <View style={styles.convTopRow}>
                      <Text style={[styles.convName, unread > 0 && { fontWeight: "700" }]} numberOfLines={1}>
                        {conv.store?.name || "Store"}
                      </Text>
                      {showArchived && blocked && (
                        <View style={styles.blockedTag}>
                          <Text style={styles.blockedTagText}>Blocked</Text>
                        </View>
                      )}
                      {muted && <BellOff size={12} color={Colors.textMuted} style={{ marginLeft: 6 }} />}
                      {conv.last_message_at && (
                        <Text style={styles.convTime}>{formatTime(conv.last_message_at)}</Text>
                      )}
                    </View>
                    <View style={styles.convBottomRow}>
                      {unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{unread}</Text>
                        </View>
                      )}
                      <Text
                        style={[styles.convPreview, unread > 0 && { color: Colors.text, fontWeight: "500" }]}
                        numberOfLines={1}
                      >
                        {conv.last_message || "No messages yet"}
                      </Text>
                    </View>
                  </View>
                </SwipeableRoomRow>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    overflow: "hidden", position: "relative",
  },
  headerVeil: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: Colors.glass,
  },
  backBtn: { padding: Spacing.xs },
  backText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginHorizontal: Spacing.md, flex: 1 },
  globalBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.borderGlow,
    borderRadius: BorderRadius.md,
  },
  globalBtnText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.purple },
  searchWrap: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md, padding: Spacing.md, paddingLeft: 36,
    fontSize: FontSize.sm, color: Colors.text,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
  filterRow: {
    flexDirection: "row", gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  filterChipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  filterChipText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted },
  filterChipTextActive: { color: Colors.purple },
  convRow: { marginHorizontal: Spacing.lg, marginVertical: 6 },
  convItem: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.md, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass, borderWidth: 1,
    borderColor: Colors.borderSubtle, ...shadowMd,
  },
  blockedTag: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.redDim, marginLeft: 6,
  },
  blockedTagText: { fontSize: 10, fontWeight: "700", color: Colors.red },
  logo: { width: 44, height: 44, borderRadius: BorderRadius.md, marginRight: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgSecondary, alignItems: "center", justifyContent: "center",
    marginRight: Spacing.md,
  },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convName: { fontSize: FontSize.md, fontWeight: "500", color: Colors.text, flex: 1 },
  convTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  convBottomRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: 4 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.purple,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  convPreview: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
});

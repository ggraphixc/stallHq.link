import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput,
  Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../../../../lib/auth";
import {
  useThemeStyles, Colors, FontSize, Spacing, BorderRadius, shadowMd,
} from "../../../../lib/theme";
import { BrandLoader } from "../../../../components/BrandLoader";
import { alert } from "../../../../components/ui/CustomAlert";
import {
  MessageCircle, Search, Plus, Users, Globe, Lock, X, Sparkles, Send, BellOff,
} from "lucide-react-native";
import {
  fetchRooms, createRoom, joinRoom, subscribeResilient, type Room,
} from "../../../../lib/globalChat";
import { SwipeableRoomRow } from "../../../../components/chat/SwipeableRoomRow";
import { useRoomPrefs, setRoomPref } from "../../../../lib/chatRoomPrefs";

const AVATAR_GRADIENTS: [string, string][] = [
  ["#a855f7", "#7c3aed"],
  ["#06b6d4", "#3b82f6"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#ef4444"],
  ["#ec4899", "#a855f7"],
  ["#8b5cf6", "#06b6d4"],
];

function avatarColors(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function formatListTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { year: "2-digit", month: "short", day: "numeric" });
}

export default function GlobalChatScreen() {
  const styles = useThemeStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const prefs = useRoomPrefs();
  const connectedRef = useRef(false);

  const load = useCallback(async () => {
    const data = await fetchRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const sub = subscribeResilient({
      name: "global-rooms-list",
      table: "room_messages",
      events: ["INSERT"],
      onRow: () => {
        load();
      },
      onConnected: () => {
        connectedRef.current = true;
        load();
      },
      onDisconnected: () => {
        connectedRef.current = false;
      },
    });
    let ticks = 0;
    const poll = setInterval(() => {
      ticks += 1;
      if (!connectedRef.current || ticks % 5 === 0) load();
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const isActiveRoom = (r: Room) => {
    const p = prefs[r.id];
    return !p?.archived && !p?.hidden;
  };
  const isArchivedRoom = (r: Room) => {
    const p = prefs[r.id];
    return !p?.hidden && !!p?.archived;
  };
  const archivedCount = rooms.filter(isArchivedRoom).length;
  const viewList = showArchived ? filtered.filter(isArchivedRoom) : filtered.filter(isActiveRoom);

  const archiveRoom = (id: string) => setRoomPref(id, { archived: true });
  const unarchiveRoom = (id: string) => setRoomPref(id, { archived: false });
  const setRoomMuted = (id: string, muted: boolean) => setRoomPref(id, { muted });
  const confirmHideRoom = (id: string) => {
    alert(
      "Hide this room from your list?",
      "This only affects your device view — you'll still be a member and can find the room via search.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Hide", style: "destructive", onPress: () => setRoomPref(id, { hidden: true }) },
      ]
    );
  };

  const openRoom = async (room: Room) => {
    if (session && !room.is_member && room.type === "public") {
      await joinRoom(room.id);
    }
    router.push(`/(customer)/chat/global/${room.id}`);
  };

  const onCreate = async () => {
    if (!session) {
      alert("Sign in required", "Create an account to start a new public room.");
      return;
    }
    if (!newName.trim()) return;
    setCreating(true);
    const room = await createRoom(newName.trim(), newDesc.trim() || undefined);
    setCreating(false);
    if (room) {
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      await load();
      router.push(`/(customer)/chat/global/${room.id}`);
    } else {
      alert("Could not create room", "Please try again.");
    }
  };

  if (loading) return <BrandLoader label="Loading community" />;

  const headerRight = (
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={() => {
        if (!session) {
          alert("Sign in required", "Sign in to create a public room.");
          return;
        }
        setCreateOpen(true);
      }}
      accessibilityLabel="Create room"
    >
      <Plus size={20} color={Colors.purple} />
    </TouchableOpacity>
  );

  const renderItem = ({ item: room }: { item: Room }) => {
    const [c1, c2] = avatarColors(room.id);
    const unread = room.unread_count || 0;
    const members = room.member_count ?? room.members?.count ?? 0;
    const preview =
      room.last_message ||
      room.description ||
      (room.type === "public" ? "Open to everyone" : "Private room");
    const pref = prefs[room.id] ?? {};
    const muted = !!pref.muted;

    return (
      <View style={styles.roomRowWrap}>
        <SwipeableRoomRow
          style={[styles.roomRow, unread > 0 && styles.roomRowUnread]}
          onPress={() => openRoom(room)}
          isArchived={!!pref.archived}
          isMuted={muted}
          onArchive={() => archiveRoom(room.id)}
          onUnarchive={() => unarchiveRoom(room.id)}
          onMute={() => setRoomMuted(room.id, true)}
          onUnmute={() => setRoomMuted(room.id, false)}
          onDelete={() => confirmHideRoom(room.id)}
          deleteLabel="Hide"
        >
          <LinearGradient
            colors={[c1, c2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roomAvatar}
          >
            <Text style={styles.roomAvatarText}>{room.name[0]?.toUpperCase()}</Text>
            {room.type !== "public" && (
              <View style={styles.lockDot}>
                <Lock size={9} color="#fff" />
              </View>
            )}
          </LinearGradient>

          <View style={styles.roomBody}>
            <View style={styles.roomTop}>
              <Text style={[styles.roomName, unread > 0 && styles.roomNameUnread]} numberOfLines={1}>
                {room.name}
              </Text>
              {muted && <BellOff size={12} color={Colors.textMuted} style={{ marginRight: 6 }} />}
              <Text style={styles.roomTime}>{formatListTime(room.last_message_at)}</Text>
            </View>
            <Text style={styles.roomPreview} numberOfLines={1}>
              {preview}
            </Text>
            <View style={styles.roomMetaRow}>
              <View style={styles.metaChip}>
                <Users size={10} color={Colors.textMuted} />
                <Text style={styles.metaChipText}>{members}</Text>
              </View>
              {room.type === "public" && (
                <View style={[styles.metaChip, styles.publicChip]}>
                  <Globe size={10} color={Colors.green} />
                  <Text style={[styles.metaChipText, { color: Colors.green }]}>Public</Text>
                </View>
              )}
              {room.is_member && (
                <View style={styles.metaChip}>
                  <MessageCircle size={10} color={Colors.purple} />
                  <Text style={[styles.metaChipText, { color: Colors.purple }]}>Joined</Text>
                </View>
              )}
              {showArchived && pref.archived && (
                <View style={styles.archivedChip}>
                  <Text style={styles.archivedChipText}>Archived</Text>
                </View>
              )}
            </View>
          </View>

          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
            </View>
          )}
        </SwipeableRoomRow>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <BlurView
          intensity={Platform.OS === "android" ? 40 : 55}
          tint={Platform.OS === "android" ? "light" : "dark"}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerVeil} />
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Community</Text>
            <Text style={styles.subtitle}>Buyers, sellers & visitors — open chat</Text>
          </View>
        </View>
        {headerRight}
      </View>

      <View style={styles.hero}>
        <Sparkles size={14} color={Colors.purple} />
        <Text style={styles.heroText}>
          Free public space — drop in, say hi, get help, discover stores
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={14} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search rooms..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {!session && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => router.push("/(auth)/select-role")}
        >
          <Text style={styles.guestBannerText}>
            Sign in to join rooms &amp; send messages · anyone can browse
          </Text>
        </TouchableOpacity>
      )}

      {viewList.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MessageCircle size={32} color={Colors.purple} />
          </View>
          <Text style={styles.emptyTitle}>
            {showArchived
              ? "Nothing archived"
              : search
                ? "No rooms match"
                : "No rooms yet"}
          </Text>
          <Text style={styles.emptySub}>
            {showArchived
              ? "Archived rooms appear here"
              : search
                ? "Try another search"
                : "Be the first to start a public conversation"}
          </Text>
          {!search && !showArchived && (
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => setCreateOpen(true)}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyCtaText}>Create room</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={viewList}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.purple}
            />
          }
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
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
              <Text style={styles.sectionLabel}>
                Open rooms · {viewList.length}
              </Text>
            </View>
          }
        />
      )}

      {/* Create room modal */}
      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New public room</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Room name</Text>
            <TextInput
              style={styles.field}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Deals & Drops"
              placeholderTextColor={Colors.textMuted}
              maxLength={40}
            />
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.field, styles.fieldMultiline]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="What is this room about?"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={140}
            />
            <TouchableOpacity
              style={[styles.createBtn, (!newName.trim() || creating) && styles.createBtnDisabled]}
              onPress={onCreate}
              disabled={!newName.trim() || creating}
            >
              <Send size={16} color="#fff" />
              <Text style={styles.createBtnText}>
                {creating ? "Creating..." : "Create room"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    overflow: "hidden",
    position: "relative",
  },
  headerVeil: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.glass,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  backText: { fontSize: 28, color: Colors.purple, lineHeight: 30, marginTop: -4 },
  title: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  heroText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchIcon: { position: "absolute", left: Spacing.lg + 12, top: "50%", marginTop: -2 },
  searchInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl + 8,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  guestBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },
  guestBannerText: { fontSize: FontSize.xs, color: Colors.green, textAlign: "center", fontWeight: "600" },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.08,
    paddingHorizontal: Spacing.lg + 4,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  listContent: { paddingBottom: 100, paddingTop: Spacing.sm },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg + 4,
    paddingTop: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterChipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  filterChipText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted },
  filterChipTextActive: { color: Colors.purple },
  archivedChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  archivedChipText: { fontSize: 10, fontWeight: "700", color: Colors.amber },
  roomRowWrap: {
    marginHorizontal: Spacing.lg,
    marginVertical: 6,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...shadowMd,
  },
  roomRowUnread: {
    backgroundColor: Colors.purpleTint,
    borderColor: Colors.borderGlow,
  },
  roomAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  roomAvatarText: { fontSize: FontSize.xl, fontWeight: "800", color: "#fff" },
  lockDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  roomBody: { flex: 1, minWidth: 0 },
  roomTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  roomName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, flex: 1 },
  roomNameUnread: { fontWeight: "800" },
  roomTime: { fontSize: FontSize.xs, color: Colors.textMuted, flexShrink: 0 },
  roomPreview: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },
  roomMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  publicChip: { backgroundColor: Colors.greenDim, borderColor: "rgba(16,185,129,0.2)" },
  metaChipText: { fontSize: 10, fontWeight: "600", color: Colors.textMuted },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.purple,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.purpleDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple,
  },
  emptyCtaText: { color: "#fff", fontWeight: "700", fontSize: FontSize.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.06,
    marginTop: 4,
  },
  field: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  fieldMultiline: { minHeight: 72, textAlignVertical: "top" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.md },
});

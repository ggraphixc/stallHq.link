import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../lib/auth";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../../lib/theme";
import { BrandLoader } from "../../../../components/BrandLoader";
import {
  Send, ArrowLeft, Users, Globe, Lock, LogIn, LogOut, Info, Settings, X, Check,
} from "lucide-react-native";
import {
  fetchRoomDetail, fetchRoomMessages, sendRoomMessage, joinRoom, leaveRoom,
  updateRoomSettings,
  type RoomMessage,
} from "../../../../lib/globalChat";

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

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startMsg) / 86400000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shortName(id: string): string {
  if (!id) return "Member";
  return `User_${id.slice(0, 4)}`;
}

type ListItem =
  | { kind: "day"; id: string; label: string }
  | { kind: "msg"; id: string; msg: RoomMessage; showName: boolean };

export default function GlobalChatThreadScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomName, setRoomName] = useState("Community");
  const [roomType, setRoomType] = useState("public");
  const [roomPurpose, setRoomPurpose] = useState("general");
  const [roomDesc, setRoomDesc] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState("member");
  const [canManage, setCanManage] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<ListItem>>(null);

  const load = useCallback(async () => {
    if (!roomId) return;
    const detail = await fetchRoomDetail(roomId);
    if (!detail) {
      setError("Room unavailable");
      setLoading(false);
      return;
    }
    setRoomName(detail.room.name);
    setRoomType(detail.room.type);
    setRoomPurpose((detail.room as any).purpose || "general");
    setRoomDesc(detail.room.description);
    setMemberCount(detail.member_count);
    setIsMember(detail.member);
    setMemberRole(detail.role || "member");
    setCanManage(!!detail.can_manage || detail.role === "admin" || detail.role === "moderator");
    setMessages(detail.messages || []);
    setError(null);
    setLoading(false);
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  // Real-time inserts + light poll as fallback
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`global-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const msg = payload.new as RoomMessage;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();
    const poll = setInterval(() => { fetchRoomMessages(roomId).then(setMessages).catch(() => {}); }, 6000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [roomId]);

  useEffect(() => {
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  const items = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastDay = "";
    let lastSender = "";
    let lastAt = 0;
    for (const msg of messages) {
      const day = dayLabel(msg.created_at);
      if (day !== lastDay) {
        out.push({ kind: "day", id: `day-${msg.id}`, label: day });
        lastDay = day;
        lastSender = "";
      }
      const at = new Date(msg.created_at).getTime();
      const consecutive = msg.sender_id === lastSender && at - lastAt < 3 * 60000;
      out.push({ kind: "msg", id: msg.id, msg, showName: !consecutive && msg.sender_id !== userId });
      lastSender = msg.sender_id;
      lastAt = at;
    }
    return out;
  }, [messages, userId]);

  const ensureJoined = async () => {
    if (!userId || isMember || roomType !== "public") return;
    const ok = await joinRoom(roomId!);
    if (ok) setIsMember(true);
  };

  useEffect(() => { ensureJoined(); }, [userId, roomId, roomType]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !roomId || sending) return;
    if (!session) {
      router.push("/(auth)/select-role");
      return;
    }
    setSending(true);
    setInput("");
    const optimistic: RoomMessage = {
      id: `tmp-${Date.now()}`,
      room_id: roomId,
      sender_id: userId || "me",
      content,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await sendRoomMessage(roomId, content);
    if (saved) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      setIsMember(true);
      setMemberCount((c) => (isMember ? c : c + 1));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    }
    setSending(false);
  };

  const leaveRoomHandler = async () => {
    await leaveRoom(roomId!);
    setIsMember(false);
    setMemberCount((c) => Math.max(0, c - 1));
  };

  if (loading) return <BrandLoader label="Opening room" />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={Colors.purple} />
          </TouchableOpacity>
          <Text style={styles.headerName}>Community</Text>
        </View>
        <View style={styles.errorBox}>
          <Info size={28} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [av1, av2] = avatarColors(roomId || roomName);
  const canSend = !!session;
  const canEditSettings = canManage || memberRole === "admin" || memberRole === "moderator";
  const canPostInRoom =
    roomPurpose !== "announcements" || canEditSettings;
  const purposeHint =
    roomPurpose === "announcements"
      ? "Only moderators can post announcements here"
      : roomPurpose === "support"
        ? "Keep this room for support & reports"
        : null;

  const openSettings = () => {
    setEditName(roomName);
    setEditDesc(roomDesc || "");
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!roomId || !editName.trim()) return;
    setSavingSettings(true);
    const updated = await updateRoomSettings(roomId, {
      name: editName.trim(),
      description: editDesc,
      purpose: roomPurpose,
    });
    setSavingSettings(false);
    if (updated) {
      setRoomName(updated.name);
      setRoomDesc(updated.description);
      setSettingsOpen(false);
      load();
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === "day") {
      return (
        <View style={styles.dayRow}>
          <View style={styles.dayLine} />
          <Text style={styles.dayText}>{item.label}</Text>
          <View style={styles.dayLine} />
        </View>
      );
    }

    const { msg, showName } = item;
    const mine = msg.sender_id === userId;
    const [c1, c2] = avatarColors(msg.sender_id || "?");

    return (
      <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
        {!mine && (
          <LinearGradient colors={[c1, c2]} style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {(shortName(msg.sender_id) || "?").replace("User_", "").toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        <View style={[styles.bubbleCol, mine && styles.bubbleColMine]}>
          {showName && !mine && (
            <Text style={styles.senderName} numberOfLines={1}>
              {shortName(msg.sender_id)}
            </Text>
          )}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
              {msg.content}
            </Text>
          </View>
          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
            {clockTime(msg.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.purple} />
        </TouchableOpacity>
        <LinearGradient colors={[av1, av2]} style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{roomName[0]?.toUpperCase()}</Text>
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{roomName}</Text>
          <View style={styles.headerMeta}>
            {roomType === "public" ? (
              <Globe size={10} color={Colors.green} />
            ) : (
              <Lock size={10} color={Colors.amber} />
            )}
            <Text style={styles.headerMetaText}>
              {memberCount} member{memberCount === 1 ? "" : "s"}
              {roomType === "public" ? " · Public" : " · Private"}
            </Text>
          </View>
        </View>
        {userId && isMember && roomType === "public" && (
          <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoomHandler}>
            <LogOut size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {userId && canEditSettings && (
          <TouchableOpacity style={styles.leaveBtn} onPress={openSettings} hitSlop={8}>
            <Settings size={14} color={Colors.purple} />
          </TouchableOpacity>
        )}
      </View>

      {roomDesc ? (
        <View style={styles.descBar}>
          <Info size={12} color={Colors.purple} />
          <Text style={styles.descText} numberOfLines={2}>{roomDesc}</Text>
        </View>
      ) : null}

      {messages.length === 0 ? (
        <View style={styles.emptyThread}>
          <Users size={32} color={Colors.purple} />
          <Text style={styles.emptyTitle}>Welcome to {roomName}</Text>
          <Text style={styles.emptySub}>
            {canSend
              ? "No messages yet — break the ice!"
              : "Sign in to start chatting. Anyone can read this public room."}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.messages}
          renderItem={renderItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {canSend && canPostInRoom ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${roomName}...`}
              placeholderTextColor={Colors.textMuted}
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
              onPress={sendMessage}
              disabled={sending || !input.trim()}
            >
              <Send size={18} color={input.trim() ? "#fff" : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : canSend && !canPostInRoom ? (
          <View style={styles.signInBar}>
            <Text style={styles.signInText}>{purposeHint || "Read-only room"}</Text>
          </View>
        ) : (
          <View style={styles.signInBar}>
            <Text style={styles.signInText}>Sign in to join the conversation</Text>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.push("/(auth)/select-role")}
            >
              <LogIn size={14} color="#fff" />
              <Text style={styles.signInBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Room settings modal — admin/moderator only */}
      <Modal visible={settingsOpen} animationType="slide" transparent onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room settings</Text>
              <TouchableOpacity onPress={() => setSettingsOpen(false)} hitSlop={8}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                maxLength={80}
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 64 }]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                maxLength={500}
                placeholder="What is this room for?"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Purpose</Text>
              <View style={styles.purposeRow}>
                {(["general", "support", "announcements"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.purposeChip, roomPurpose === p && styles.purposeChipOn]}
                    onPress={() => setRoomPurpose(p)}
                    activeOpacity={0.7}
                  >
                    {roomPurpose === p && <Check size={12} color={Colors.purple} />}
                    <Text style={[styles.purposeChipText, roomPurpose === p && { color: Colors.purple }]}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.purposeHelp}>
                General = free chat · Support = help/reports · Announcements = moderator posts only
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, savingSettings && { opacity: 0.5 }]}
              onPress={saveSettings}
              disabled={savingSettings || !editName.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>{savingSettings ? "Saving…" : "Save settings"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { color: "#fff", fontWeight: "800", fontSize: FontSize.md },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: FontSize.md, fontWeight: "800", color: Colors.text },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  headerMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  leaveBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  descBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.purpleTint,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  descText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  messages: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: Colors.borderSubtle },
  dayText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
    gap: 8,
  },
  bubbleRowMine: { justifyContent: "flex-end" },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  msgAvatarText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  bubbleCol: { maxWidth: "78%", alignItems: "flex-start" },
  bubbleColMine: { alignItems: "flex-end" },
  senderName: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 3,
    marginLeft: 4,
    fontWeight: "600",
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  bubbleOther: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderTopLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.purple,
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 19 },
  bubbleTextMine: { color: "#fff" },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    marginLeft: 4,
  },
  bubbleTimeMine: { marginRight: 4, marginLeft: 0 },
  emptyThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: Colors.bgElevated },
  signInBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  signInText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple,
  },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.sm },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xxl,
  },
  errorText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.lg, paddingBottom: Spacing.xxl,
    borderTopWidth: 1, borderColor: Colors.borderSubtle,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted,
    marginBottom: 6, marginTop: Spacing.sm, textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.sm, color: Colors.text,
  },
  purposeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  purposeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.borderSubtle, backgroundColor: Colors.bgSecondary,
  },
  purposeChipOn: {
    borderColor: Colors.borderGlow, backgroundColor: Colors.purpleDim,
  },
  purposeChipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  purposeHelp: {
    fontSize: 11, color: Colors.textMuted, marginTop: 8, lineHeight: 15,
  },
  saveBtn: {
    marginTop: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.purple,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.sm },
});

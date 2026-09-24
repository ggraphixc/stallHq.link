import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Modal, ScrollView, Clipboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../../../lib/auth";
import {
  useThemeStyles, Colors, FontSize, Spacing, BorderRadius,
} from "../../../../lib/theme";
import { BrandLoader } from "../../../../components/BrandLoader";
import { alert } from "../../../../components/ui/CustomAlert";
import {
  Users, Globe, Lock, LogIn, LogOut, Info, Settings, X, Check,
} from "lucide-react-native";
import {
  fetchRoomDetail, fetchRoomMessages, sendRoomMessage, joinRoom, leaveRoom,
  updateRoomSettings, markRoomRead, markRoomMessagesSeen, softDeleteRoomMessage,
  fetchReactions, toggleMessageReaction, reactionsFromMetadata, mergeReactionSummaries,
  subscribeResilient, startChatPoll, createTypingChannel, activeTypers,
  upsertMessage, mergeMessageList, extractReply, displayContent, uploadChatImage,
  isDeletedForEveryone,
  type RoomMessage, type ReactionSummary, type ReplyPayload,
} from "../../../../lib/globalChat";
import { hideMessage, loadHidden, subscribeHidden } from "../../../../lib/chatMessagePrefs";
import {
  ChatBubble, ChatComposer, ChatHeader, MessageActionsSheet, TypingDots,
  type SheetAction, type ReceiptKind,
} from "../../../../components/chat";

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
  const insets = useSafeAreaInsets();
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
  const [reactions, setReactions] = useState<ReactionSummary>({});
  const [reply, setReply] = useState<ReplyPayload | null>(null);
  const [sheetMsg, setSheetMsg] = useState<RoomMessage | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const flatListRef = useRef<FlatList<ListItem>>(null);
  const connectedRef = useRef(false);
  const typingApiRef = useRef<ReturnType<typeof createTypingChannel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingOnRef = useRef(false);
  const messagesRef = useRef<RoomMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let alive = true;
    loadHidden().then((ids) => {
      if (alive) setHiddenIds(new Set(ids));
    });
    const unsubscribe = subscribeHidden((ids) => setHiddenIds(new Set(ids)));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    const rows = await fetchRoomMessages(roomId);
    if (!rows.length && messagesRef.current.length) return;
    setMessages((prev) => mergeMessageList(prev, rows));
    if (userId) {
      markRoomMessagesSeen(rows, userId).catch(() => {});
      markRoomRead(roomId).catch(() => {});
    }
    const ids = rows.map((r) => r.id);
    const fromMeta = rows.reduce<ReactionSummary>(
      (acc, m) => mergeReactionSummaries(acc, reactionsFromMetadata(m)),
      {}
    );
    const fromTable = await fetchReactions(ids);
    setReactions((prev) =>
      mergeReactionSummaries(mergeReactionSummaries(prev, fromMeta), fromTable)
    );
  }, [roomId, userId]);

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
    setRoomPurpose((detail.room as { purpose?: string }).purpose || "general");
    setRoomDesc(detail.room.description);
    setMemberCount(detail.member_count);
    setIsMember(detail.member);
    setMemberRole(detail.role || "member");
    setCanManage(!!detail.can_manage || detail.role === "admin" || detail.role === "moderator");
    setMessages((prev) => mergeMessageList(prev, detail.messages || []));
    setError(null);
    setLoading(false);
    if (userId) {
      markRoomMessagesSeen(detail.messages || [], userId).catch(() => {});
      markRoomRead(roomId).catch(() => {});
    }
    const rows = detail.messages || [];
    const fromMeta = rows.reduce<ReactionSummary>(
      (acc, m) => mergeReactionSummaries(acc, reactionsFromMetadata(m)),
      {}
    );
    const fromTable = await fetchReactions(rows.map((r) => r.id));
    setReactions((prev) =>
      mergeReactionSummaries(mergeReactionSummaries(prev, fromMeta), fromTable)
    );
  }, [roomId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!roomId) return;
    const sub = subscribeResilient({
      name: `global-room-${roomId}`,
      table: "room_messages",
      filter: `room_id=eq.${roomId}`,
      events: ["INSERT", "UPDATE"],
      onRow: (event, row) => {
        const msg = row as unknown as RoomMessage;
        if (msg.is_deleted) {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          return;
        }
        setMessages((prev) => upsertMessage(prev, msg));
        if (event === "UPDATE" || event === "INSERT") {
          fetchReactions([msg.id]).then((r) => {
            setReactions((prev) => mergeReactionSummaries(prev, r));
          });
        }
        if (userId && msg.sender_id && msg.sender_id !== userId) {
          markRoomMessagesSeen([msg], userId).catch(() => {});
        }
        markRoomRead(roomId).catch(() => {});
      },
      onConnected: () => {
        connectedRef.current = true;
        loadMessages();
      },
      onDisconnected: () => {
        connectedRef.current = false;
      },
    });
    const stopPoll = startChatPoll(
      () => {
        loadMessages();
      },
      () => connectedRef.current
    );
    return () => {
      sub.destroy();
      stopPoll();
    };
  }, [roomId, userId, loadMessages]);

  useEffect(() => {
    if (!roomId || !userId) return;
    const ch = createTypingChannel(`typing-${roomId}`, (peers) => {
      setTypingIds(activeTypers(peers, userId));
    });
    typingApiRef.current = ch;
    return () => {
      ch.destroy();
      typingApiRef.current = null;
    };
  }, [roomId, userId]);

  const pulseTyping = useCallback(() => {
    if (!userId || !typingApiRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2500) return;
    lastTypingSentRef.current = now;
    typingOnRef.current = true;
    typingApiRef.current.setTyping(userId, true);
  }, [userId]);

  useEffect(() => {
    if (!input.trim() && typingOnRef.current && userId && typingApiRef.current) {
      typingOnRef.current = false;
      typingApiRef.current.setTyping(userId, false);
    }
  }, [input, userId]);

  useEffect(() => {
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length, typingIds.length]);

  const items = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastDay = "";
    let lastSender = "";
    let lastAt = 0;
    for (const msg of messages) {
      if (msg.is_deleted) continue;
      if (hiddenIds.has(msg.id)) continue;
      const day = dayLabel(msg.created_at);
      if (day !== lastDay) {
        out.push({ kind: "day", id: `day-${msg.id}`, label: day });
        lastDay = day;
        lastSender = "";
      }
      const at = new Date(msg.created_at).getTime();
      const consecutive = msg.sender_id === lastSender && at - lastAt < 3 * 60000;
      out.push({
        kind: "msg",
        id: msg.id,
        msg,
        showName: !consecutive && msg.sender_id !== userId,
      });
      lastSender = msg.sender_id;
      lastAt = at;
    }
    return out;
  }, [messages, userId, hiddenIds]);

  const ensureJoined = async () => {
    if (!userId || isMember || roomType !== "public") return;
    const ok = await joinRoom(roomId!);
    if (ok) setIsMember(true);
  };

  useEffect(() => {
    ensureJoined();
  }, [userId, roomId, roomType]);

  const replyTarget = useCallback(
    (id: string): { name?: string; preview: string } => {
      const target = messages.find((m) => m.id === id);
      if (target) {
        return {
          name: shortName(target.sender_id),
          preview: displayContent(target.content) || "Attachment",
        };
      }
      return { name: "Message", preview: "Original message unavailable" };
    },
    [messages]
  );

  const sendMessage = async (overrideText?: string, imageUri?: string) => {
    const raw = imageUri || (overrideText != null ? overrideText : input.trim());
    if (!raw || !roomId || sending) return;
    if (!session) {
      router.push("/(auth)/select-role");
      return;
    }
    setSending(true);
    const content = imageUri || raw;
    const wasInput = overrideText == null && !imageUri;
    if (wasInput) setInput("");
    const replyPayload = reply;
    const optimistic: RoomMessage = {
      id: `tmp-${Date.now()}`,
      room_id: roomId,
      sender_id: userId || "me",
      content,
      message_type: imageUri ? "image" : "text",
      created_at: new Date().toISOString(),
      metadata: replyPayload ? { reply_to: replyPayload } : undefined,
      reply_to: replyPayload?.id,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    if (replyPayload) setReply(null);

    const saved = await sendRoomMessage(roomId, content, {
      message_type: imageUri ? "image" : "text",
      replyTo: replyPayload || undefined,
    });

    if (saved) {
      setMessages((prev) => {
        const withoutTmp = prev.filter((m) => m.id !== optimistic.id);
        return upsertMessage(withoutTmp, { ...saved, pending: false });
      });
      setIsMember(true);
      setMemberCount((c) => (isMember ? c : c + 1));
      markRoomMessagesSeen([saved], userId || "").catch(() => {});
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false, failed: true } : m
        )
      );
      if (wasInput) setInput(content);
    }
    setSending(false);
  };

  const retrySend = async (msg: RoomMessage) => {
    if (!roomId || sending) return;
    setSending(true);
    const content = displayContent(msg.content);
    const decoded = extractReply(msg);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    const saved = await sendRoomMessage(roomId, content, {
      message_type: msg.message_type === "image" ? "image" : "text",
      replyTo: decoded || undefined,
    });
    if (saved) {
      setMessages((prev) => upsertMessage(prev, saved));
    } else {
      setMessages((prev) => [...prev, { ...msg, pending: false, failed: true }]);
    }
    setSending(false);
  };

  const pickAndSendImage = async () => {
    if (!session) {
      router.push("/(auth)/select-role");
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alert("Permission needed", "Allow photo access to send images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.length) return;
      setUploadingImage(true);
      const url = await uploadChatImage(result.assets[0].uri);
      setUploadingImage(false);
      if (!url) {
        alert(
          "Upload failed",
          "Could not upload the image — check that the chat-images storage bucket exists."
        );
        return;
      }
      await sendMessage(url, url);
    } catch {
      setUploadingImage(false);
      alert(
        "Upload failed",
        "Could not upload the image — check that the chat-images storage bucket exists."
      );
    }
  };

  const openSheet = (msg: RoomMessage) => {
    setSheetMsg(msg);
    setSheetOpen(true);
  };

  const startReply = (msg: RoomMessage) => {
    const payload = extractReply(msg) || {
      id: msg.id,
      sender_id: msg.sender_id,
      preview: displayContent(msg.content) || "Attachment",
    };
    setReply({
      ...payload,
      preview: payload.preview || displayContent(msg.content) || "Attachment",
    });
  };

  const onSheetAction = async (action: SheetAction) => {
    const msg = sheetMsg;
    if (!msg) return;
    if (action === "reply") {
      startReply(msg);
      return;
    }
    if (action === "copy") {
      try {
        Clipboard.setString(displayContent(msg.content));
      } catch {}
      return;
    }
    if (action === "delete-for-me") {
      hideMessage(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      return;
    }
    if (action === "delete-for-everyone") {
      if (!userId || msg.sender_id !== userId) {
        alert("Could not delete", "You can only delete your own messages.");
        return;
      }
      alert("Delete for everyone?", "This removes the message for everyone in the room.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const ok = await softDeleteRoomMessage(msg.id, userId);
            if (ok) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            } else {
              alert("Could not delete", "You can only delete your own messages.");
            }
          },
        },
      ]);
    }
  };

  const reactToMessage = async (msgId: string, emoji: string) => {
    if (!userId) return;
    setReactions((prev) => {
      const next: ReactionSummary = { ...prev };
      const list = (next[msgId] || []).map((e) => ({ ...e, userIds: [...e.userIds] }));
      const hit = list.find((e) => e.emoji === emoji);
      if (hit) {
        if (hit.userIds.includes(userId)) {
          hit.userIds = hit.userIds.filter((u) => u !== userId);
        } else {
          hit.userIds.push(userId);
        }
      } else {
        list.push({ emoji, userIds: [userId] });
      }
      next[msgId] = list.filter((e) => e.userIds.length > 0);
      return next;
    });
    const result = await toggleMessageReaction(msgId, emoji, userId, {
      table: "room_messages",
    });
    if (result === "failed") {
      fetchReactions([msgId]).then((r) => {
        setReactions((prev) => mergeReactionSummaries(prev, r));
      });
    }
  };

  const onReact = async (emoji: string) => {
    const msg = sheetMsg;
    if (!msg) return;
    await reactToMessage(msg.id, emoji);
  };

  const leaveRoomHandler = async () => {
    await leaveRoom(roomId!);
    setIsMember(false);
    setMemberCount((c) => Math.max(0, c - 1));
  };

  const receiptFor = (msg: RoomMessage): ReceiptKind => {
    if (msg.sender_id !== userId) return null;
    if (msg.pending || msg.failed) return null;
    const readers = (msg.read_by || []).filter((id) => id && id !== userId);
    return readers.length > 0 ? "read" : "sent";
  };

  if (loading) return <BrandLoader label="Opening room" />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader onBack={() => router.back()} title="Community" safeTop={insets.top} />
        <View style={styles.errorBox}>
          <Info size={28} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              load();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [av1, av2] = avatarColors(roomId || roomName);
  const canSend = !!session;
  const canEditSettings = canManage || memberRole === "admin" || memberRole === "moderator";
  const canPostInRoom = roomPurpose !== "announcements" || canEditSettings;
  const purposeHint =
    roomPurpose === "announcements"
      ? "Only moderators can post announcements here"
      : roomPurpose === "support"
        ? "Keep this room for support & reports"
        : null;
  const typingLabel =
    typingIds.length === 0
      ? null
      : typingIds.length === 1
        ? `${shortName(typingIds[0])} is typing…`
        : `${typingIds.length} people are typing…`;

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
    const deletedMsg = isDeletedForEveryone(msg);
    const [c1, c2] = avatarColors(msg.sender_id || "?");
    const extracted = extractReply(msg);
    const replyInfo = extracted
      ? replyTarget(extracted.id)
      : null;

    return (
      <ChatBubble
        content={msg.content}
        mine={mine}
        createdAt={msg.created_at}
        message_type={msg.message_type}
        pending={msg.pending}
        failed={msg.failed}
        showName={showName}
        senderName={shortName(msg.sender_id)}
        avatar={
          !mine ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (msg.sender_id) {
                  router.push({
                    pathname: "/(customer)/profile/[id]",
                    params: { id: msg.sender_id },
                  });
                }
              }}
            >
              <LinearGradient colors={[c1, c2]} style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>
                  {(shortName(msg.sender_id) || "?").replace("User_", "").toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null
        }
        reply={replyInfo}
        reactions={reactions[msg.id]}
        reactionMineId={userId}
        onToggleReaction={(emoji) => reactToMessage(msg.id, emoji)}
        onLongPress={() => openSheet(msg)}
        onRetry={msg.failed ? () => retrySend(msg) : undefined}
        receipt={receiptFor(msg)}
        deleted={deletedMsg}
        onSwipeReply={deletedMsg ? undefined : () => startReply(msg)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ChatHeader
        onBack={() => router.back()}
        title={roomName}
        safeTop={insets.top}
        typing={!!typingLabel}
        typingLabel={typingLabel || undefined}
        avatar={
          <LinearGradient colors={[av1, av2]} style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{roomName[0]?.toUpperCase()}</Text>
          </LinearGradient>
        }
        subtitle={
          <>
            {roomType === "public" ? (
              <Globe size={10} color={Colors.green} />
            ) : (
              <Lock size={10} color={Colors.amber} />
            )}
            <Text style={styles.headerMetaText}>
              {memberCount} member{memberCount === 1 ? "" : "s"}
              {roomType === "public" ? " · Public" : " · Private"}
            </Text>
          </>
        }
        right={
          <View style={styles.headerActions}>
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
        }
      />

      {roomDesc ? (
        <View style={styles.descBar}>
          <Info size={12} color={Colors.purple} />
          <Text style={styles.descText} numberOfLines={2}>
            {roomDesc}
          </Text>
        </View>
      ) : null}

      {uploadingImage ? (
        <View style={styles.uploadBar}>
          <Text style={styles.uploadText}>Uploading image…</Text>
        </View>
      ) : null}

      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {items.length === 0 ? (
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
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                typingIds.length > 0 ? (
                  <View style={styles.typingWrap}>
                    <TypingDots />
                  </View>
                ) : null
              }
            />
          )}

          {canSend && canPostInRoom ? (
            <ChatComposer
              value={input}
              onChangeText={setInput}
              onSend={() => sendMessage()}
              onPickImage={pickAndSendImage}
              sending={sending || uploadingImage}
              placeholder={`Message ${roomName}...`}
              reply={
                reply
                  ? {
                      name: reply.sender_id === userId ? "You" : shortName(reply.sender_id),
                      preview: reply.preview,
                    }
                  : null
              }
              onCancelReply={() => setReply(null)}
              onTypingActive={pulseTyping}
              safeBottom={Math.max(insets.bottom, 0)}
            />
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
      </GestureHandlerRootView>

      <MessageActionsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={onSheetAction}
        onReact={onReact}
        isMine={!!userId && sheetMsg?.sender_id === userId}
        canDeleteForEveryone={
          !!userId && (sheetMsg?.sender_id === userId || canEditSettings)
        }
        messageLabel={sheetMsg ? displayContent(sheetMsg.content) : undefined}
      />

      <Modal
        visible={settingsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsOpen(false)}
      >
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
                    <Text
                      style={[
                        styles.purposeChipText,
                        roomPurpose === p && { color: Colors.purple },
                      ]}
                    >
                      {p[0].toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.purposeHelp}>
                General = free chat · Support = help/reports · Announcements = moderator posts
                only
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, savingSettings && { opacity: 0.5 }]}
              onPress={saveSettings}
              disabled={savingSettings || !editName.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>
                {savingSettings ? "Saving…" : "Save settings"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    headerAvatarText: { color: "#fff", fontWeight: "800", fontSize: FontSize.md },
    headerMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
    headerActions: { flexDirection: "row", gap: 6 },
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
    uploadBar: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: 6,
      backgroundColor: Colors.purpleTint,
    },
    uploadText: { fontSize: FontSize.xs, color: Colors.purple, fontWeight: "600" },
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
    msgAvatar: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    msgAvatarText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    typingWrap: { paddingHorizontal: Spacing.lg },
    emptyThread: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xxl,
    },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
    emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
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
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: Spacing.lg,
      paddingBottom: Spacing.xxl,
      borderTopWidth: 1,
      borderColor: Colors.borderSubtle,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text },
    fieldLabel: {
      fontSize: FontSize.xs,
      fontWeight: "700",
      color: Colors.textMuted,
      marginBottom: 6,
      marginTop: Spacing.sm,
      textTransform: "uppercase",
    },
    fieldInput: {
      backgroundColor: Colors.bgSecondary,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      fontSize: FontSize.sm,
      color: Colors.text,
    },
    purposeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    purposeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      backgroundColor: Colors.bgSecondary,
    },
    purposeChipOn: {
      borderColor: Colors.borderGlow,
      backgroundColor: Colors.purpleDim,
    },
    purposeChipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
    purposeHelp: {
      fontSize: 11,
      color: Colors.textMuted,
      marginTop: 8,
      lineHeight: 15,
    },
    saveBtn: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.purple,
      alignItems: "center",
    },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.sm },
  });

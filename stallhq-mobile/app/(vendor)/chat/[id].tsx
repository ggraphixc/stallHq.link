import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, KeyboardAvoidingView, Platform, Clipboard, StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { useAuth, WEB_API_URL } from "../../../lib/auth";
import { BrandLoader } from "../../../components/BrandLoader";
import { alert } from "../../../components/ui/CustomAlert";
import {
  DmMessage, ReplyPayload, ReactionSummary,
  upsertMessage, mergeMessageList, extractReply, displayContent, isImageUrl,
  uploadChatImage, attachDmReply, encodeDmSendContent,
  isDeletedForEveryone, softDeleteDmMessage,
  fetchReactions, toggleMessageReaction, mergeReactionSummaries,
  subscribeResilient, startChatPoll, createTypingChannel, activeTypers,
} from "../../../lib/globalChat";
import { hideMessage, loadHidden, subscribeHidden } from "../../../lib/chatMessagePrefs";
import {
  ChatBubble, ChatComposer, ChatHeader, MessageActionsSheet, TypingDots,
  type SheetAction, type ReceiptKind,
} from "../../../components/chat";

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

export default function VendorChatThreadScreen() {
  const styles = useThemeStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { store: authStore, session } = useAuth();
  const accessToken = session?.access_token;
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("Customer");
  const [reply, setReply] = useState<ReplyPayload | null>(null);
  const [sheetMsg, setSheetMsg] = useState<DmMessage | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reactions, setReactions] = useState<ReactionSummary>({});
  const [typingPeers, setTypingPeers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const flatListRef = useRef<FlatList>(null);
  const connectedRef = useRef(false);
  const typingApiRef = useRef<ReturnType<typeof createTypingChannel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingOnRef = useRef(false);
  const userId = authStore?.user_id;
  const authHeaders: Record<string, string> = accessToken ? { "x-access-token": accessToken } : {};

  const load = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `${WEB_API_URL}/api/chat?id=${conversationId}`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const data = await res.json();
        const rows: DmMessage[] = data.messages || [];
        setMessages((prev) => mergeMessageList(prev, rows));
        if (data.customer_email) setCustomerEmail(data.customer_email);
        const table = await fetchReactions(rows.map((r) => r.id));
        setReactions((prev) => mergeReactionSummaries(prev, table));
      }
    } catch {}
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    const sub = subscribeResilient({
      name: `chat-${conversationId}`,
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
      events: ["INSERT", "UPDATE"],
      onRow: (_event, row) => {
        const msg = row as unknown as DmMessage;
        setMessages((prev) => upsertMessage(prev, msg));
        fetchReactions([msg.id]).then((r) => {
          setReactions((prev) => mergeReactionSummaries(prev, r));
        });
      },
      onConnected: () => {
        connectedRef.current = true;
        load();
      },
      onDisconnected: () => {
        connectedRef.current = false;
      },
    });
    const stopPoll = startChatPoll(() => load(), () => connectedRef.current);
    return () => {
      sub.destroy();
      stopPoll();
    };
  }, [conversationId, load]);

  useEffect(() => {
    if (!conversationId || !userId) return;
    const ch = createTypingChannel(`typing-dm-${conversationId}`, (peers) => {
      setTypingPeers(activeTypers(peers, userId));
    });
    typingApiRef.current = ch;
    return () => {
      ch.destroy();
      typingApiRef.current = null;
    };
  }, [conversationId, userId]);

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
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, typingPeers.length]);

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

  const visibleMessages = useMemo(
    () => messages.filter((m) => !hiddenIds.has(m.id)),
    [messages, hiddenIds]
  );

  const replyFor = (id: string): { name?: string; preview: string } => {
    const target = messages.find((m) => m.id === id);
    if (target) {
      return {
        name: target.sender_id === userId ? "You" : "Customer",
        preview: displayContent(target.content) || "Attachment",
      };
    }
    return { name: "Message", preview: "Original message unavailable" };
  };

  const sendMessage = async (imageUri?: string) => {
    const content = imageUri || input.trim();
    if (!content || !conversationId || sending) return;
    setSending(true);
    if (!imageUri) setInput("");
    const replyPayload = reply;
    const optimistic: DmMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId || "",
      sender_role: "vendor",
      content: imageUri || content,
      read_at: null,
      created_at: new Date().toISOString(),
      metadata: replyPayload ? { reply_to: replyPayload } : undefined,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    if (replyPayload) setReply(null);

    try {
      const sendContent = imageUri
        ? imageUri
        : replyPayload
          ? encodeDmSendContent(content, replyPayload)
          : content;
      const res = await fetch(
        `${WEB_API_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ conversationId, content: sendContent }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      const { message } = await res.json();
      let saved: DmMessage = message;
      if (replyPayload) {
        const withMeta = await attachDmReply(message.id, replyPayload);
        if (withMeta) saved = withMeta;
        else saved = { ...message, metadata: { reply_to: replyPayload } };
      }
      if (imageUri) saved = { ...saved, content: imageUri };
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== optimistic.id);
        return upsertMessage(withoutTemp, { ...saved, pending: false });
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false, failed: true } : m
        )
      );
      if (!imageUri) setInput(content);
    }
    setSending(false);
  };

  const pickImage = async () => {
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
      setUploading(true);
      const url = await uploadChatImage(result.assets[0].uri);
      setUploading(false);
      if (!url) {
        alert(
          "Upload failed",
          "Could not upload the image — check that the chat-images storage bucket exists."
        );
        return;
      }
      await sendMessage(url);
    } catch {
      setUploading(false);
      alert(
        "Upload failed",
        "Could not upload the image — check that the chat-images storage bucket exists."
      );
    }
  };

  const reactTo = async (msgId: string, emoji: string) => {
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
    const result = await toggleMessageReaction(msgId, emoji, userId, { table: "messages" });
    if (result === "failed") {
      fetchReactions([msgId]).then((r) => {
        setReactions((prev) => mergeReactionSummaries(prev, r));
      });
    }
  };

  const startReply = (msg: DmMessage) => {
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

  const onSheetAction = (action: SheetAction) => {
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
      return;
    }
    if (action === "delete-for-everyone") {
      const isMine = !!userId && msg.sender_id === userId;
      if (!isMine) {
        alert("Could not delete", "You can only delete your own messages.");
        return;
      }
      alert("Delete for everyone?", "This removes the message for everyone in this chat.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const ok = await softDeleteDmMessage(msg);
            if (!ok) {
              alert("Could not delete", "You can only delete your own messages.");
              return;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msg.id
                  ? { ...m, content: "", metadata: { ...(m.metadata || {}), deleted_for_everyone: true } }
                  : m
              )
            );
          },
        },
      ]);
    }
  };

  const receiptFor = (msg: DmMessage): ReceiptKind => {
    if (msg.sender_id !== userId) return null;
    if (msg.pending || msg.failed) return null;
    return msg.read_at ? "read" : "sent";
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const typingLabel = typingPeers.length > 0 ? "typing…" : undefined;

  const avatar = useMemo(() => {
    const [c1, c2] = avatarColors(conversationId || customerEmail);
    return (
      <LinearGradient colors={[c1, c2]} style={styles.headerAvatar}>
        <Text style={styles.headerAvatarText}>{customerEmail[0]?.toUpperCase()}</Text>
      </LinearGradient>
    );
  }, [conversationId, customerEmail]);

  if (loading) return <BrandLoader label="Loading messages" />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ChatHeader
        onBack={() => router.back()}
        title={customerEmail}
        subtitle={<Text style={styles.headerSub}>Customer</Text>}
        avatar={avatar}
        safeTop={insets.top}
        typing={!!typingLabel}
        typingLabel={typingLabel}
        replyName={reply ? (reply.sender_id === userId ? "You" : "Customer") : null}
        replyPreview={reply?.preview || null}
        onCancelReply={() => setReply(null)}
      />

      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={visibleMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              typingPeers.length > 0 ? (
                <View style={{ marginBottom: 8 }}>
                  <TypingDots />
                </View>
              ) : null
            }
            renderItem={({ item: msg }) => {
              const isMine = msg.sender_id === userId;
              const deletedMsg = isDeletedForEveryone(msg);
              const extracted = extractReply(msg);
              const replyInfo = extracted ? replyFor(extracted.id) : null;
              const img = isImageUrl(msg.content);
              return (
                <ChatBubble
                  content={msg.content}
                  mine={isMine}
                  createdAt={msg.created_at}
                  message_type={img ? "image" : "text"}
                  pending={msg.pending}
                  failed={msg.failed}
                  reply={replyInfo}
                  reactions={reactions[msg.id]}
                  reactionMineId={userId}
                  onToggleReaction={(emoji) => reactTo(msg.id, emoji)}
                  onLongPress={() => {
                    setSheetMsg(msg);
                    setSheetOpen(true);
                  }}
                  receipt={receiptFor(msg)}
                  timeText={formatTime(msg.created_at)}
                  deleted={deletedMsg}
                  onSwipeReply={deletedMsg ? undefined : () => startReply(msg)}
                />
              );
            }}
          />

          <ChatComposer
            value={input}
            onChangeText={setInput}
            onSend={() => sendMessage()}
            onPickImage={pickImage}
            sending={sending || uploading}
            placeholder="Type a message..."
            onTypingActive={pulseTyping}
            safeBottom={Math.max(insets.bottom, 0)}
          />
        </KeyboardAvoidingView>
      </GestureHandlerRootView>

      <MessageActionsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={onSheetAction}
        onReact={(emoji) => {
          if (sheetMsg) reactTo(sheetMsg.id, emoji);
        }}
        isMine={!!userId && sheetMsg?.sender_id === userId}
        canDeleteForEveryone={!!userId && sheetMsg?.sender_id === userId}
        messageLabel={sheetMsg ? displayContent(sheetMsg.content) : undefined}
      />
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
    headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
    messagesList: { padding: Spacing.lg, paddingBottom: Spacing.sm, flexGrow: 1 },
  });

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../lib/auth";
import { WEB_API_URL } from "../../../../lib/config";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../../lib/theme";
import { BrandLoader } from "../../../../components/BrandLoader";
import { Send, ArrowLeft } from "lucide-react-native";

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  sender_role: string;
  created_at: string;
}

interface RoomData {
  id: string;
  name: string;
  type: string;
}

export default function GlobalChatThreadScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomData | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${WEB_API_URL}/api/chat/global/messages?room_id=${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    setLoading(false);
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  // Load room info
  useEffect(() => {
    if (!roomId) return;
    fetch(`${WEB_API_URL}/api/chat/global/rooms?room_id=${roomId}`)
      .then((r) => r.json())
      .then((data) => setRoomInfo(data[0]))
      .catch(() => {});
  }, [roomId]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;
    const channel = `global-chat-${roomId}`;
    // Poll for new messages every 3 seconds
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [roomId, load]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !roomId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      await fetch(`${WEB_API_URL}/api/chat/global/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, content }),
      });
      await load();
    } catch {}
    setSending(false);
  };

  if (loading) return <BrandLoader label="Loading chat" />;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.purple} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{roomInfo?.name || "Chat"}</Text>
          <Text style={styles.headerSub}>
            {roomInfo?.type === "public" ? "Public room" : "Private room"}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item: msg }) => (
          <View style={[styles.messageBubble, msg.sender_id === userId && styles.messageBubbleMine]}>
            <Text style={styles.messageSender}>
              {msg.sender_id === userId ? "You" : msg.sender_id}
            </Text>
            <Text style={styles.messageText}>{msg.content}</Text>
            <Text style={styles.messageTime}>{formatTime(msg.created_at)}</Text>
          </View>
        )}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sending || !input.trim()}>
            <Send size={18} color={input.trim() ? Colors.purple : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  messages: { padding: Spacing.lg },
  messageBubble: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm, maxWidth: "80%",
  },
  messageBubbleMine: {
    backgroundColor: Colors.purpleDim, alignSelf: "flex-end",
  },
  messageSender: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted, marginBottom: 2 },
  messageText: { fontSize: FontSize.sm, color: Colors.text },
  messageTime: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "right", marginTop: 2 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.purple,
    alignItems: "center", justifyContent: "center",
  },
});

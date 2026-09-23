import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { useAuth } from "../../../lib/auth";
import { BrandLoader } from "../../../components/BrandLoader";
import { Send, ArrowLeft, CheckCheck, Check } from "lucide-react-native";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function VendorChatThreadScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { store: authStore, session } = useAuth();
  const accessToken = session?.access_token;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("Customer");
  const flatListRef = useRef<FlatList>(null);
  const userId = authStore?.user_id;
  const authHeaders: Record<string, string> = accessToken
    ? { "x-access-token": accessToken }
    : {};

  // Load messages
  const load = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/chat?id=${conversationId}`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.customer_email) setCustomerEmail(data.customer_email);
      }
    } catch {}
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !conversationId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId || "",
      sender_role: "vendor",
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ conversationId, content }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      const { message } = await res.json();
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? message : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    }
    setSending(false);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <BrandLoader label="Loading messages" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.purple} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{customerEmail}</Text>
          <Text style={styles.headerSub}>Customer</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item: msg }) => {
            const isMine = msg.sender_id === userId;
            return (
              <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {msg.content}
                  </Text>
                  <View style={[styles.bubbleMeta, isMine && { justifyContent: "flex-end" }]}>
                    <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                      {formatTime(msg.created_at)}
                    </Text>
                    {isMine && (
                      msg.read_at
                        ? <CheckCheck size={12} color="rgba(255,255,255,0.5)" />
                        : <Check size={12} color="rgba(255,255,255,0.5)" />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  messagesList: { padding: Spacing.lg, paddingBottom: Spacing.sm, flexGrow: 1 },
  bubbleRow: { marginBottom: Spacing.sm, alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "78%" as any, padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  bubbleMine: {
    backgroundColor: Colors.purple,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleMeta: {
    flexDirection: "row", alignItems: "center",
    gap: 4, marginTop: 4,
  },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  bubbleTimeMine: { color: "rgba(255,255,255,0.5)" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    padding: Spacing.md, paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSize.sm,
    color: Colors.text, maxHeight: 100, minHeight: 42,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.purple,
    alignItems: "center", justifyContent: "center",
  },
});

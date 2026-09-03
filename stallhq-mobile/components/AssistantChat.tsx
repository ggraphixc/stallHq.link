import React, { useState, useEffect, useRef } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Bot, X, Send } from "lucide-react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { WEB_API_URL } from "../lib/config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  visible: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName: string;
}

const SUGGESTIONS = [
  "What do you sell?",
  "Do you have anything under ₦5,000?",
  "What's your best product?",
];

export function AssistantChat({ visible, onClose, storeSlug, storeName }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setMessages([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WEB_API_URL}/api/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug, message: content, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e?.message || "Could not reach the assistant. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Bot size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{storeName} Assistant</Text>
              <Text style={styles.headerSub}>AI — knows the catalog</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesInner}
          >
            {messages.length === 0 && (
              <View style={styles.suggestWrap}>
                <Text style={styles.suggestIntro}>
                  👋 Hi! Ask me anything about {storeName} — what we sell, prices, or what's in stock.
                </Text>
                {SUGGESTIONS.map((q) => (
                  <TouchableOpacity key={q} style={styles.suggestChip} onPress={() => send(q)}>
                    <Text style={styles.suggestChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>
                  {m.content}
                </Text>
              </View>
            ))}

            {loading && (
              <View style={[styles.bubble, styles.bubbleBot]}>
                <ActivityIndicator size="small" color={Colors.purple} />
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Ask about ${storeName}…`}
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: "85%",
    borderWidth: 1, borderColor: Colors.borderSubtle,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: "rgba(19,19,29,0.8)",
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.md,
    backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.green, marginTop: 1 },
  closeBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  messages: { flex: 1 },
  messagesInner: { padding: Spacing.lg, gap: Spacing.sm },
  suggestWrap: { gap: Spacing.sm, marginBottom: Spacing.md },
  suggestIntro: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xs },
  suggestChip: {
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(168,85,247,0.08)",
    borderWidth: 1, borderColor: "rgba(168,85,247,0.25)",
  },
  suggestChipText: { fontSize: FontSize.sm, color: Colors.purple },
  bubble: { maxWidth: "85%", padding: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleUser: {
    alignSelf: "flex-end", backgroundColor: Colors.purple,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 21 },
  errorText: { fontSize: FontSize.sm, color: Colors.red, paddingHorizontal: Spacing.xs },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    color: Colors.text, fontSize: FontSize.md,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});

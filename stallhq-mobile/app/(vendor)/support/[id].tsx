import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BrandLoader } from "../../../components/BrandLoader";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../../lib/theme";
import { Send, ArrowLeft, CheckCircle, AlertCircle, Clock, MessageSquare } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  store?: { name?: string; slug?: string } | null;
  messages: Message[];
}

const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", replied: "Replied", resolved: "Resolved", closed: "Closed" };
const STATUS_COLOR: Record<string, string> = { open: Colors.amber, in_progress: Colors.blue, replied: Colors.cyan, resolved: Colors.green, closed: Colors.textMuted };

export default function TicketDetailScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, store:stores(name, slug), messages:support_messages(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (data) {
        const sorted = { ...data, messages: (data.messages || []).sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) };
        setTicket(sorted as Ticket);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [ticket?.messages?.length]);

  const sendReply = async () => {
    if (!replyText.trim() || !ticket || sending) return;
    setSending(true);
    try {
      const userId = session?.user?.id;
      const senderRole = userId ? "vendor" : "vendor";
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId || "",
        sender_role: senderRole,
        message: replyText.trim(),
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", ticket.id);
      setReplyText("");
      await load();
    } catch {} finally {
      setSending(false);
    }
  };

  if (loading) return <BrandLoader label="Loading ticket" />;
  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.purple} />
          </TouchableOpacity>
          <Text style={styles.title}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLOR[ticket.status] || Colors.textMuted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.purple} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{ticket.subject}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "18", borderColor: statusColor + "44" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABEL[ticket.status] || ticket.status}</Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
        >
          {ticket.messages.map((msg) => {
            const isMe = msg.sender_role === "vendor";
            return (
              <View key={msg.id} style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
                <View style={[styles.messageContent, isMe ? styles.messageContentMe : styles.messageContentThem]}>
                  <Text style={[styles.messageText, isMe && { color: "#fff" }]}>{msg.message}</Text>
                </View>
                <Text style={[styles.messageTime, isMe && { textAlign: "right" }]}>
                  {isMe ? "You" : msg.sender_role === "admin" ? "Support" : msg.sender_role} · {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          })}
          {ticket.messages.length === 0 && (
            <View style={styles.emptyMessages}>
              <MessageSquare size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No messages yet. Send a reply to start the conversation.</Text>
            </View>
          )}
        </ScrollView>

        {ticket.status !== "closed" && ticket.status !== "resolved" && (
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your reply..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.4 }]}
              onPress={sendReply}
              disabled={!replyText.trim() || sending}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row" as const, alignItems: "center" as const, padding: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: "700" as const, color: Colors.text, flex: 1 },
  headerMeta: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.xs, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: "600" as const, textTransform: "capitalize" as const },
  metaDot: { fontSize: FontSize.xs, color: Colors.textMuted },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  messageList: { flex: 1 },
  messageListContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  messageBubble: { marginBottom: Spacing.md },
  messageMe: { alignItems: "flex-end" as const },
  messageThem: { alignItems: "flex-start" as const },
  messageContent: {
    maxWidth: "80%" as any, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  messageContentMe: {
    backgroundColor: Colors.purple, borderBottomRightRadius: Spacing.xs,
  },
  messageContentThem: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  messageTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginHorizontal: Spacing.xs },
  emptyMessages: { alignItems: "center" as const, padding: Spacing.xxxl * 2, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" as const },
  replyBar: {
    flexDirection: "row" as const, alignItems: "flex-end" as const, gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  replyInput: {
    flex: 1, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSize.sm, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple,
    alignItems: "center" as const, justifyContent: "center" as const,
  },
});

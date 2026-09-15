import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { useAuth } from "../../../lib/auth";
import { BrandLoader } from "../../../components/BrandLoader";
import { MessageCircle, Search, User } from "lucide-react-native";

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  store_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_customer: number;
  unread_vendor: number;
  customer_email?: string;
  store?: { id: string; name: string; slug: string; logo_url: string | null };
}

export default function VendorChatListScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { store: authStore } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/chat`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription for conversation list updates
  useEffect(() => {
    const channel = supabase
      .channel("vendor-chat-list")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "conversations",
      }, () => { load(); })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.customer_email?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  });

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) return <BrandLoader label="Loading messages" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
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

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Customers will message you from your store page</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
          renderItem={({ item: conv }) => {
            const unread = conv.unread_vendor;
            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => router.push(`/(vendor)/chat/${conv.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <User size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convName, unread > 0 && { fontWeight: "700" }]} numberOfLines={1}>
                      {conv.customer_email || "Customer"}
                    </Text>
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
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: "row" as const, alignItems: "center" as const,
      padding: Spacing.lg, paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    backBtn: { padding: Spacing.xs },
    backText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.purple },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text, marginHorizontal: Spacing.md },
    searchWrap: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    searchInput: {
      backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.md, padding: Spacing.md, paddingLeft: 36,
      fontSize: FontSize.sm, color: Colors.text,
    },
    empty: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: "600" as const, color: Colors.textSecondary },
    emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
    convItem: {
      flexDirection: "row" as const, alignItems: "center" as const,
      padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    avatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.bgSecondary, alignItems: "center" as const, justifyContent: "center" as const,
      marginRight: Spacing.md,
    },
    convInfo: { flex: 1 },
    convTopRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
    convName: { fontSize: FontSize.md, fontWeight: "500" as const, color: Colors.text, flex: 1 },
    convTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
    convBottomRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.xs, marginTop: 4 },
    unreadBadge: {
      minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.purple,
      alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 6,
    },
    unreadText: { fontSize: 10, fontWeight: "700" as const, color: "#fff" },
    convPreview: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  }));
  return s;
};

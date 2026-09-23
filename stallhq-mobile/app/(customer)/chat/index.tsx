import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, Image, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { useAuth } from "../../../lib/auth";
import { BrandLoader } from "../../../components/BrandLoader";
import { MessageCircle, Search, Store, Globe } from "lucide-react-native";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/chat?customer_id=${session?.user?.id}`
      );
      if (res.ok) setConversations(await res.json());
    } catch {}
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("customer-chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
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
    return c.store?.name?.toLowerCase().includes(q) || c.last_message?.toLowerCase().includes(q);
  });

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

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Message a vendor from their store page</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
          renderItem={({ item: conv }) => {
            const unread = conv.unread_customer;
            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => router.push(`/(customer)/chat/${conv.id}`)}
                activeOpacity={0.7}
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

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
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
  convItem: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
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

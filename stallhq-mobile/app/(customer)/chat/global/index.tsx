import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../../lib/auth";
import { WEB_API_URL } from "../../../../lib/config";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../../lib/theme";
import { BrandLoader } from "../../../../components/BrandLoader";
import { MessageCircle, Search, Plus, Settings } from "lucide-react-native";

interface Room {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_member: boolean;
  role: string;
  unread_count: number;
  members?: { count: number };
}

export default function GlobalChatScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { session } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`);
      if (res.ok) setRooms(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    return r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <BrandLoader label="Loading chat" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Rooms</Text>
        <TouchableOpacity onPress={() => router.push("/(customer)/settings")}>
          <Settings size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search size={14} color={Colors.textMuted} style={{ position: "absolute", left: 12, top: "50%", marginTop: -7 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search rooms..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No rooms found</Text>
          <Text style={styles.emptySub}>Join a room to start chatting</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
          renderItem={({ item: room }) => (
            <TouchableOpacity
              style={[styles.roomCard, room.unread_count > 0 && styles.roomCardUnread]}
              onPress={() => router.push(`/(customer)/chat/global/${room.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.roomAvatar}>
                <Text style={styles.roomAvatarText}>
                  {room.name[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.roomInfo}>
                <View style={styles.roomTopRow}>
                  <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                  {room.unread_count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{room.unread_count}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.roomDesc} numberOfLines={1}>{room.description || `${room.type} room`}</Text>
                <View style={styles.roomMeta}>
                  <Text style={styles.roomType}>{room.type}</Text>
                  <Text style={styles.roomSep}>·</Text>
                  <Text style={styles.roomMembers}>{(room.members?.count || 0)} members</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  searchWrap: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md, padding: Spacing.md, paddingLeft: 36,
    fontSize: FontSize.sm, color: Colors.text,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
  roomCard: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  roomCardUnread: { backgroundColor: Colors.purpleDim },
  roomAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.purple, alignItems: "center", justifyContent: "center",
    marginRight: Spacing.md,
  },
  roomAvatarText: { fontSize: FontSize.lg, fontWeight: "800", color: "#fff" },
  roomInfo: { flex: 1 },
  roomTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, flex: 1 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.purple,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6, marginLeft: Spacing.sm,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: "700", color: "#fff" },
  roomDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  roomMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  roomType: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: "capitalize" },
  roomSep: { fontSize: FontSize.xs, color: Colors.textMuted },
  roomMembers: { fontSize: FontSize.xs, color: Colors.textMuted },
});

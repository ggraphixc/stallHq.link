import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BrandLoader } from "../../../components/BrandLoader";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { WEB_API_URL } from "../../../lib/config";
import {
  ArrowLeft, Store as StoreIcon, Calendar, MessageSquare, ChevronRight, ExternalLink, Info,
} from "lucide-react-native";

interface ProfileStore {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  verified: boolean;
  category: string | null;
  created_at: string;
}

interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_vendor: boolean;
  joined_at: string | null;
  review_count: number;
  stores: ProfileStore[];
}

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

function initialsOf(name: string): string {
  return (name || "?")
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PublicProfileScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${WEB_API_URL}/api/profiles/${id}`);
      if (res.ok) {
        const data: PublicProfile = await res.json();
        setProfile(data);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <BrandLoader label="Opening profile" />;

  if (notFound || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorBox}>
          <Info size={32} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Profile not found</Text>
          <Text style={styles.errorSub}>This member may have removed their account.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [c1, c2] = avatarColors(profile.user_id || profile.display_name);
  const joined = profile.joined_at
    ? new Date(profile.joined_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={[c1, c2]} style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsOf(profile.display_name)}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={2}>{profile.display_name}</Text>
                {profile.is_vendor && (
                  <View style={styles.vendorBadge}>
                    <StoreIcon size={10} color={Colors.green} />
                    <Text style={styles.vendorBadgeText}>Vendor</Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                {joined ? (
                  <View style={styles.metaItem}>
                    <Calendar size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>Joined {joined}</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <MessageSquare size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>
                    {profile.review_count} review{profile.review_count === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>
            {profile.is_vendor ? (profile.stores.length === 1 ? "Store" : "Stores") : "Stores"}
          </Text>
          {profile.stores.length === 0 ? (
            <Text style={styles.emptyText}>No public stores yet.</Text>
          ) : (
            profile.stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeRow}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/(customer)/store/[slug]", params: { slug: store.slug } })}
              >
                {store.logo_url ? (
                  <Image source={{ uri: store.logo_url }} style={styles.storeLogo} />
                ) : (
                  <View style={styles.storeLogoPlaceholder}>
                    <StoreIcon size={16} color={Colors.purple} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                  <Text style={styles.storeSlug} numberOfLines={1}>
                    /{store.slug}
                    {store.category ? ` · ${store.category}` : ""}
                  </Text>
                </View>
                <ExternalLink size={14} color={Colors.textMuted} />
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topRow: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 48 },
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: Spacing.lg },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.borderSubtle,
  },
  avatarImg: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: Colors.borderSubtle,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: FontSize.xl },
  nameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  displayName: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text, flexShrink: 1 },
  vendorBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.greenDim,
  },
  vendorBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.green, textTransform: "uppercase", letterSpacing: 0.4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: 6, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  bio: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.md,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  storeRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.purpleTint,
    borderWidth: 1, borderColor: Colors.borderGlow,
  },
  storeLogo: { width: 40, height: 40, borderRadius: BorderRadius.sm },
  storeLogoPlaceholder: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.purpleDim, alignItems: "center", justifyContent: "center",
  },
  storeName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm, padding: Spacing.xxl },
  errorTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  errorSub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
});

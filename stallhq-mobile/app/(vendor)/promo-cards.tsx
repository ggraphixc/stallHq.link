import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BrandLoader } from "../../components/BrandLoader";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react-native";
import { WEB_API_URL } from "../../lib/auth";

interface PromoPost {
  id: string;
  store_id: string;
  store_name?: string;
  product_id: string;
  product_name?: string;
  product_image?: string | null;
  platform: string;
  status: string;
  caption?: string | null;
  posted_at?: string | null;
  scheduled_at?: string | null;
  created_at: string;
  source?: string;
}

export default function PromoCardsScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const [posts, setPosts] = useState<PromoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${WEB_API_URL}/api/admin/promo/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts((data.posts || []).filter((p: any) =>
          p.source === "promo_posts" ||
          p.store_name === "Unknown" || p.store_name
        ));
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${WEB_API_URL}/api/admin/promo/posts`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setPosts((data.posts || []).filter((p: any) =>
            p.source === "promo_posts" ||
            p.source === "scheduled_promo_posts"
          ));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${WEB_API_URL}/api/admin/promo/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts((data.posts || []).filter((p: any) =>
          p.source === "promo_posts" || p.source === "scheduled_promo_posts"
        ));
      }
    } catch {}
    setRefreshing(false);
  };

  if (loading) return <BrandLoader label="Loading promos" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Promo Cards</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
      }>
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No promo cards yet</Text>
            <Text style={styles.emptySub}>Post or schedule promo cards for your products from the web dashboard.</Text>
          </View>
        ) : (
          posts.map((p) => {
            const posted = p.source === "promo_posts" || p.posted_at;
            const statusColor = p.status === "posted"
              ? Colors.green
              : p.status === "failed"
              ? Colors.red
              : Colors.amber;
            const statusLabel = posted ? (p.status === "posted" ? "Posted" : "Failed") : "Scheduled";

            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={1}>{p.product_name || "Unknown product"}</Text>
                    <Text style={styles.storeName}>{p.store_name || "Unknown store"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "18", borderColor: statusColor + "44" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                {p.product_image ? (
                  <Image source={{ uri: p.product_image }} style={styles.productThumb} />
                ) : (
                  <View style={[styles.productThumb, { backgroundColor: Colors.bgSecondary }]}>
                    <Text style={{ color: Colors.textMuted }}>{p.product_name?.[0]?.toUpperCase() || "?"}</Text>
                  </View>
                )}

                <View style={styles.cardMeta}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Platform</Text>
                      <Text style={styles.metaValue}>{p.platform}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Source</Text>
                      <Text style={[styles.metaValue, { color: Colors.textMuted }]}>
                        {p.source === "scheduled_promo_posts" ? "scheduled" : "posted"}
                      </Text>
                    </View>
                  </View>

                  {posted ? (
                    (p.posted_at || p.created_at) && (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaValue}>
                          {new Date(p.posted_at || p.created_at).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaValue, { color: Colors.textMuted }]}>
                        {p.scheduled_at
                          ? new Date(p.scheduled_at).toLocaleString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })
                          : "pending"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: "row" as const, alignItems: "center" as const, padding: Spacing.lg, paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    backBtn: { padding: Spacing.xs },
    backText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.purple },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text, marginHorizontal: Spacing.md },
    scroll: { padding: Spacing.lg, paddingTop: 0 },
    empty: { alignItems: "center" as const, padding: Spacing.xxxl * 2, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: "600" as const, color: Colors.textSecondary },
    emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
    card: {
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    cardHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: Spacing.sm },
    productName: { fontSize: FontSize.md, fontWeight: "600" as const, color: Colors.text, flex: 1, marginRight: Spacing.sm },
    storeName: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    statusBadge: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
      alignSelf: "flex-start" as const, flexShrink: 1,
    },
    statusText: { fontSize: FontSize.xs, fontWeight: "600" as const, textTransform: "capitalize" as const },
    productThumb: {
      width: "100%" as any, height: 100, borderRadius: BorderRadius.md,
      backgroundColor: Colors.bgSecondary, alignItems: "center" as const, justifyContent: "center" as const,
      marginBottom: Spacing.md,
    },
    cardMeta: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
    metaRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.md, marginBottom: Spacing.xs },
    metaItem: { flex: 1 },
    metaLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: "uppercase" as const, letterSpacing: 0.05, marginBottom: 2 },
    metaValue: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.text },
  }));
  return s;
};
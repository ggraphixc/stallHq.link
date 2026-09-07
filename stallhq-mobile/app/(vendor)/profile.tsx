import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, RefreshControl, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BrandLoader } from "../../components/BrandLoader";
import { StoreIdentityCard } from "../../components/StoreIdentityCard";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { Clock, Settings, Share2, LogOut } from "lucide-react-native";
import { supabase, Store } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS: Record<string, string> = {
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday",
};

export default function VendorProfileScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { store: authStore, session, refreshStore, signOut } = useAuth();
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!authStore?.user_id) return;
    const { data: s } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", authStore.user_id)
      .maybeSingle();
    if (s) setViewingStore(s);
  }, [authStore?.user_id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!viewingStore) return;
    try {
      await Share.share({
        message: `Check out ${viewingStore.name} on StallHQ!\nhttps://stallhq.link/${viewingStore.slug}`,
      });
    } catch { /* user cancelled */ }
  };

  if (!viewingStore) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandLoader label="Loading profile" />
      </SafeAreaView>
    );
  }

  const hours = viewingStore.store_hours;
  const hoursEnabled = !!hours?.enabled;
  const hasDays = hoursEnabled && hours?.days && Object.values(hours.days).some(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your Store</Text>
            <Text style={styles.subtitle}>{viewingStore.name}</Text>
          </View>
        </View>

        {/* Identity card — read-only */}
        <StoreIdentityCard store={viewingStore} />

        {/* Store hours section */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Clock size={16} color={Colors.purple} />
            <Text style={styles.cardTitle}>Store Hours</Text>
          </View>
          {hasDays ? (
            <View style={styles.hoursList}>
              {DAYS.map((day) => {
                const val = String(hours!.days[day] || "");
                return (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                    <Text style={[styles.hoursValue, !val && styles.muted]}>
                      {val || "Closed"}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>Not set</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(vendor)/settings")}>
            <Settings size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Edit Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
            <Share2 size={16} color={Colors.purple} />
            <Text style={styles.secondaryBtnText}>Share Store</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <LogOut size={16} color={Colors.red} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingBottom: 40 },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderSubtle,
    },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
    subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    card: {
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
    },
    cardRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    cardTitle: { fontSize: FontSize.md, fontWeight: "700" as const, color: Colors.text },
    hoursList: { gap: Spacing.xs },
    hoursRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingVertical: Spacing.xs,
    },
    dayLabel: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.textSecondary },
    hoursValue: { fontSize: FontSize.sm, color: Colors.text },
    muted: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: "italic" as const },
    actions: {
      flexDirection: "row" as const,
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.purple,
    },
    primaryBtnText: { fontSize: FontSize.sm, fontWeight: "700" as const, color: "#fff" },
    secondaryBtn: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.purpleDim,
      borderWidth: 1,
      borderColor: Colors.borderGlow,
    },
    secondaryBtnText: { fontSize: FontSize.sm, fontWeight: "700" as const, color: Colors.purple },
    signOutBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.red,
    },
    signOutText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.red },
  }));
  return s;
};

import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { ThemeToggle } from "../../components/ThemeToggle";
import { NotificationBell } from "../../components/NotificationBell";
import { BrandLoader } from "../../components/BrandLoader";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import {
  User, Mail, Shield, Globe, FileText, LogOut, ChevronRight,
  Package, Clock, Sparkles, LogIn, Store,
} from "lucide-react-native";

export default function CustomerProfileScreen() {
  const styles = useThemeStyles(makeStyles);
  const router = useRouter();
  const { session, signOut } = useAuth();

  // Header persists across the whole profile; NotificationBell now opens
  // the same bottom-sheet overlay used by the tab shells.
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <NotificationBell />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account card */}
        {session?.user ? (
          <View style={styles.accountCard}>
            <View style={styles.avatar}><User size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.email} numberOfLines={1}>{session.user.email}</Text>
              <Text style={styles.accountLabel}>Customer Account</Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={[styles.avatar, { backgroundColor: Colors.cyan }]}><User size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.email}>Browsing as guest</Text>
              <Text style={styles.accountLabel}>Create an account to save favorites & sell later</Text>
            </View>
          </View>
        )}

        {/* Account actions */}
        {!session && (
          <View style={styles.accountActions}>
            <TouchableOpacity
              style={styles.accountBtnPrimary}
              onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "customer" } })}
            >
              <LogIn size={16} color="#fff" />
              <Text style={styles.accountBtnTextLight}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.accountBtnSecondary} onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.accountBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer menu */}
        <View style={styles.menu}>
          {session?.user && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(customer)/(tabs)/orders")}>
                <View style={styles.menuIcon}><Package size={18} color={Colors.green} /></View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>My Orders</Text>
                  <Text style={styles.menuSubtitle}>View order history & tracking</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(customer)/email-preferences")}>
                <View style={styles.menuIcon}><Mail size={18} color={Colors.amber} /></View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Email Preferences</Text>
                  <Text style={styles.menuSubtitle}>Manage notification emails</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin/support")}>
            <View style={styles.menuIcon}><Shield size={18} color={Colors.textMuted} /></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Support</Text>
              <Text style={styles.menuSubtitle}>Open a support ticket</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(vendor)/profile")}>
            <View style={styles.menuIcon}><Store size={18} color={Colors.cyan} /></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>My Store</Text>
              <Text style={styles.menuSubtitle}>Manage your store profile</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(vendor)/support")}>
            <View style={styles.menuIcon}><Globe size={18} color={Colors.textMuted} /></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>stallhq.com</Text>
              <Text style={styles.menuSubtitle}>Visit our website</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("https://hqlink.vercel.app/terms")}>
            <View style={styles.menuIcon}><FileText size={18} color={Colors.textMuted} /></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Terms of Service</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("https://hqlink.vercel.app/privacy")}>
            <View style={styles.menuIcon}><Shield size={18} color={Colors.textMuted} /></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <ThemeToggle />

        {/* Sign out / version */}
        {session && (
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <LogOut size={18} color={Colors.red} /><Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>stallHq v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      padding: Spacing.lg, paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    headerRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
    scroll: { paddingBottom: 40 },
    accountCard: {
      flexDirection: "row" as const, alignItems: "center" as const,
      backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    },
    guestCard: {
      flexDirection: "row" as const, alignItems: "center" as const,
      backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.purple, justifyContent: "center" as const, alignItems: "center" as const, marginRight: Spacing.lg },
    email: { fontSize: FontSize.md, fontWeight: "600" as const, color: Colors.text },
    accountLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
    accountActions: { flexDirection: "row" as const, gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    accountBtnPrimary: {
      flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6,
      backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    },
    accountBtnTextLight: { color: "#fff", fontSize: FontSize.sm, fontWeight: "700" as const },
    accountBtnSecondary: {
      flex: 1, alignItems: "center" as const, justifyContent: "center" as const,
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    },
    accountBtnText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "600" as const },
    menu: { paddingHorizontal: Spacing.lg },
    menuItem: {
      flexDirection: "row" as const, alignItems: "center" as const,
      backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary, justifyContent: "center" as const, alignItems: "center" as const, marginRight: Spacing.lg },
    menuInfo: { flex: 1 },
    menuTitle: { fontSize: FontSize.md, fontWeight: "600" as const, color: Colors.text },
    menuSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    signOutBtn: {
      flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
      marginHorizontal: Spacing.lg, marginTop: Spacing.lg, padding: Spacing.lg,
      borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.red,
    },
    signOutText: { color: Colors.red, fontSize: FontSize.md, fontWeight: "600" as const },
    version: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center" as const, marginTop: Spacing.lg },
  }));
  return s;
};
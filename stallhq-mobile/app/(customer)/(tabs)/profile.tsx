import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { Store, Globe, Mail, FileText, Shield, LogOut, ChevronRight, User, Sparkles, LogIn, Package, Clock } from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const menuItems = [
    { icon: <Package size={18} color={Colors.green} />, title: "My Orders", subtitle: "View order history & tracking", onPress: () => router.push("/(customer)/(tabs)/orders") },
    { icon: <Mail size={18} color={Colors.amber} />, title: "Email Preferences", subtitle: "Manage notification emails", onPress: () => router.push("/(customer)/email-preferences") },
    { icon: <Globe size={18} color={Colors.cyan} />, title: "stallhq.com", subtitle: "Visit our website", onPress: () => Linking.openURL("https://hqlink.vercel.app") },
    { icon: <FileText size={18} color={Colors.textMuted} />, title: "Terms of Service", subtitle: "", onPress: () => Linking.openURL("https://hqlink.vercel.app/terms") },
    { icon: <Shield size={18} color={Colors.textMuted} />, title: "Privacy Policy", subtitle: "", onPress: () => Linking.openURL("https://hqlink.vercel.app/privacy") },
  ];

  const isSignedIn = !!session?.user;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Profile</Text></View>

      {session?.user ? (
        <View style={styles.userCard}>
          <View style={styles.avatar}><User size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail} numberOfLines={1}>{session.user.email}</Text>
            <Text style={styles.userLabel}>Customer Account</Text>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <View style={[styles.avatar, { backgroundColor: Colors.cyan }]}><User size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail}>Browsing as guest</Text>
            <Text style={styles.userLabel}>Create an account to save favorites & sell later</Text>
          </View>
        </View>
      )}

      {!isSignedIn && (
        <View style={styles.accountActions}>
          <TouchableOpacity
            style={styles.accountBtnPrimary}
            onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "customer" } })}
          >
            <LogIn size={16} color="#fff" />
            <Text style={styles.accountBtnTextLight}>Create Free Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountBtnSecondary}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.accountBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSignedIn && (
        <View style={styles.vendorCta}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorCtaTitle}><Sparkles size={13} color={Colors.purple} /> Sell on stallHq</Text>
            <Text style={styles.vendorCtaSub}>Open your store, list products & get discovered.</Text>
          </View>
          <TouchableOpacity style={styles.vendorCtaBtn} onPress={() => router.push("/(customer)/become-vendor")}>
            <Store size={16} color="#fff" />
            <Text style={{ color: "#fff", fontSize: FontSize.sm, fontWeight: "700" }}>Become a Vendor</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={styles.menuIcon}>{item.icon}</View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {session && (
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <LogOut size={18} color={Colors.red} /><Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.version}>stallHq v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  userCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  guestCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  accountActions: { flexDirection: "row", gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  accountBtnPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  accountBtnTextLight: { color: "#fff", fontSize: FontSize.sm, fontWeight: "700" },
  accountBtnSecondary: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  accountBtnText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "600" },
  vendorCta: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: "rgba(168,85,247,0.05)", borderWidth: 1, borderColor: "rgba(168,85,247,0.2)",
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  vendorCtaTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  vendorCtaSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  vendorCtaBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.purple, borderRadius: BorderRadius.md, paddingVertical: 8, paddingHorizontal: 10,
  },
  userEmail: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  userLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  menu: { paddingHorizontal: Spacing.lg },
  menuItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  menuSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: Spacing.lg, marginTop: Spacing.xxl, padding: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.red,
  },
  signOutText: { color: Colors.red, fontSize: FontSize.md, fontWeight: "600" },
  version: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xxl },
});

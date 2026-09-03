import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { Colors, FontSize, Spacing, BorderRadius } from "../../../lib/theme";
import { Store, Globe, Mail, FileText, Shield, LogOut, ChevronRight, User } from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const menuItems = [
    { icon: <Store size={18} color={Colors.purple} />, title: "Switch to Vendor", subtitle: "Manage your store dashboard", onPress: () => router.replace("/(auth)/select-role") },
    { icon: <Globe size={18} color={Colors.cyan} />, title: "stallhq.com", subtitle: "Visit our website", onPress: () => Linking.openURL("https://hqlink.vercel.app") },
    { icon: <Mail size={18} color={Colors.amber} />, title: "Email Preferences", subtitle: "Manage notification emails", onPress: () => Linking.openURL("https://hqlink.vercel.app/email-preferences") },
    { icon: <FileText size={18} color={Colors.textMuted} />, title: "Terms of Service", subtitle: "", onPress: () => Linking.openURL("https://hqlink.vercel.app/terms") },
    { icon: <Shield size={18} color={Colors.textMuted} />, title: "Privacy Policy", subtitle: "", onPress: () => Linking.openURL("https://hqlink.vercel.app/privacy") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Profile</Text></View>

      {session?.user && (
        <View style={styles.userCard}>
          <View style={styles.avatar}><User size={22} color="#fff" /></View>
          <View>
            <Text style={styles.userEmail}>{session.user.email}</Text>
            <Text style={styles.userLabel}>Customer Account</Text>
          </View>
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
    borderRadius: BorderRadius.lg, padding: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.xxl,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
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

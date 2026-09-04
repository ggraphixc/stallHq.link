import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { Store, ShoppingBag, ChevronRight } from "lucide-react-native";
import { BrandLogo } from "../../components/BrandLogo";

export default function SelectRoleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <BrandLogo />
          <Text style={styles.tagline}>Digital Storefronts</Text>
        </View>

        <Text style={styles.heading}>How will you use stallHq?</Text>
        <Text style={styles.subheading}>Choose your role to get started</Text>

        <TouchableOpacity style={styles.roleCard} onPress={() => router.push("/(auth)/signup?role=vendor")} activeOpacity={0.7}>
          <View style={[styles.roleIcon, { backgroundColor: Colors.purpleDim }]}><Store size={22} color={Colors.purple} /></View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Vendor</Text>
            <Text style={styles.roleDesc}>Sell products on WhatsApp & Instagram with a digital storefront</Text>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleCard} onPress={() => router.push("/(customer)/(tabs)")} activeOpacity={0.7}>
          <View style={[styles.roleIcon, { backgroundColor: Colors.cyanDim }]}><ShoppingBag size={22} color={Colors.cyan} /></View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Customer</Text>
            <Text style={styles.roleDesc}>Browse stores, view products, and shop via WhatsApp</Text>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: Spacing.xxxl },
  tagline: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  heading: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: Spacing.xs },
  subheading: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xxxl },
  roleCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)",
    borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.lg,
  },
  roleIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginBottom: 2 },
  roleDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xxl },
  loginText: { fontSize: FontSize.md, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600" },
});

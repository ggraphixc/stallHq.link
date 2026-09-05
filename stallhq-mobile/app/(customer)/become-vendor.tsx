import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";
import { ArrowLeft, Store, Sparkles } from "lucide-react-native";

export default function BecomeVendorScreen() {
  const router = useRouter();
  const { becomeVendor } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!storeName.trim()) {
      alert("Store name required", "Give your store a name to get started.");
      return;
    }
    setLoading(true);
    const { error } = await becomeVendor(storeName.trim());
    setLoading(false);
    if (error) {
      alert("Couldn't create store", error);
      return;
    }
    alert("Store created! 🎉", "Welcome to the vendor side of stallHq.", [
      { text: "Open Dashboard", onPress: () => router.replace("/(vendor)/(tabs)") },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Store size={26} color={Colors.purple} />
          </View>

          <Text style={styles.heading}>Become a Vendor</Text>
          <Text style={styles.subheading}>
            Turn your account into a storefront — list products, take WhatsApp orders, and track analytics.
          </Text>

          <View style={styles.perks}>
            {["14-day free trial", "Digital storefront link", "No credit card needed"].map((p) => (
              <View key={p} style={styles.perkRow}>
                <Sparkles size={13} color={Colors.green} />
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              style={styles.input}
              placeholder="My Awesome Store"
              placeholderTextColor={Colors.textMuted}
              value={storeName}
              onChangeText={setStoreName}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>You can add products, WhatsApp & branding next.</Text>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={start}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create My Store</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: "center" },
  backBtn: { position: "absolute", top: Spacing.xl, left: Spacing.xxl, flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: Colors.purple, fontSize: FontSize.md },
  iconWrap: {
    width: 56, height: 56, borderRadius: BorderRadius.lg, backgroundColor: Colors.purpleDim,
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: Spacing.lg,
  },
  heading: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, textAlign: "center", marginBottom: Spacing.xs },
  subheading: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xxl },
  perks: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  perkRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  perkText: { fontSize: FontSize.md, color: Colors.textSecondary },
  form: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  input: { ...ambientInput, padding: Spacing.lg, fontSize: FontSize.md },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
});

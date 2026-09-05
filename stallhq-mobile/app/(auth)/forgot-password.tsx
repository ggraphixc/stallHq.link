import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { BrandLogo } from "../../components/BrandLogo";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      alert("Error", "Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://hqlink.vercel.app/auth/reset-password",
      });
      setLoading(false);
      if (error) {
        alert("Error", error.message);
      } else {
        setSent(true);
      }
    } catch {
      setLoading(false);
      alert("Error", "Network error. Please try again.");
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.green} />
          </View>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.subheading}>
            We sent a password reset link to{"\n"}
            <Text style={{ fontWeight: "700", color: Colors.text }}>{email}</Text>
          </Text>
          <Text style={styles.hint}>
            Didn't receive it? Check your spam folder or try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={Colors.purple} /><Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <BrandLogo size={56} />
          </View>

          <Text style={styles.heading}>Reset password</Text>
          <Text style={styles.subheading}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
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
  backBtn: { position: "absolute", top: Spacing.xl, left: Spacing.xxl, flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: Colors.purple, fontSize: FontSize.md },
  logoContainer: { alignItems: "center", marginBottom: Spacing.xxl },
  heading: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xs, textAlign: "center" },
  subheading: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxxl, textAlign: "center", lineHeight: 22 },
  form: { gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.xs },
  inputRow: { flexDirection: "row", alignItems: "center", ...ambientInput, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  input: { flex: 1, padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greenDim, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: Spacing.xl },
  hint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.md, lineHeight: 20 },
});

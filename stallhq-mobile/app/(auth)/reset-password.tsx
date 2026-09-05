import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { BrandLogo } from "../../components/BrandLogo";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { access_token, refresh_token } = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(() => setSessionReady(true));
    } else {
      setSessionReady(true);
    }
  }, [access_token, refresh_token]);

  const handleReset = async () => {
    if (!password) { alert("Error", "Please enter a new password"); return; }
    if (password.length < 6) { alert("Error", "Password must be at least 6 characters"); return; }
    if (password !== confirm) { alert("Error", "Passwords don't match"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        alert("Error", error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setLoading(false);
      alert("Error", "Network error. Please try again.");
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.green} />
          </View>
          <Text style={styles.heading}>Password updated</Text>
          <Text style={styles.subheading}>Your password has been successfully changed.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.purple} />
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
          <View style={styles.logoContainer}>
            <BrandLogo size={56} />
          </View>

          <Text style={styles.heading}>Set new password</Text>
          <Text style={styles.subheading}>Enter your new password below.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <Ionicons name="eye-off-outline" size={18} color={Colors.textMuted} /> : <Ionicons name="eye-outline" size={18} color={Colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
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
  logoContainer: { alignItems: "center", marginBottom: Spacing.xxl },
  heading: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xs, textAlign: "center" },
  subheading: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxxl, textAlign: "center" },
  form: { gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.lg, fontSize: FontSize.md },
  passwordRow: { flexDirection: "row", alignItems: "center", ...ambientInput },
  passwordInput: { flex: 1, padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text },
  eyeBtn: { padding: Spacing.lg },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greenDim, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: Spacing.xl },
});

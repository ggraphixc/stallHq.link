import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { BrandLogo } from "../../components/BrandLogo";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert("Login Failed", error);
    else router.replace("/(vendor)/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Logo — dynamic from admin branding settings */}
          <View style={styles.logoContainer}>
            <BrandLogo size={56} />
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to manage your store</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
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

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/select-role")}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
  backBtn: { position: "absolute", top: Spacing.xl, left: Spacing.xxl },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  logoContainer: { alignItems: "center", marginBottom: Spacing.xxl },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: { gap: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    ...ambientInput,
    padding: Spacing.lg,
    fontSize: FontSize.md,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    ...ambientInput,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  eyeBtn: { padding: Spacing.lg },
  eyeText: { fontSize: 18 },
  button: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xxxl },
  signupText: { fontSize: FontSize.md, color: Colors.textSecondary },
  signupLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600" },
});

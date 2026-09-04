import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth";
import { BrandLogo } from "../../components/BrandLogo";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { MailCheck } from "lucide-react-native";

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; role?: string }>();
  const { completeSignup, resendCode } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = clean;
    setCode(next);
    setError("");
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
    if (clean && index === 5) doVerify(next.join(""));
  };

  const handleKey = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const doVerify = async (fullCode: string) => {
    setLoading(true);
    setError("");
    const { error: err, needsSignIn } = await completeSignup(fullCode);
    setLoading(false);
    if (err) {
      setError(err);
      if (needsSignIn) {
        Alert.alert("Account verified", err, [
          { text: "Sign In", onPress: () => router.replace("/(auth)/login") },
        ]);
        return;
      }
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    Alert.alert("Welcome to stallHq! 🎉", "Your account is ready.", [
      { text: "Let's Go", onPress: () => router.replace(params.role === "vendor" ? "/(vendor)/(tabs)" : "/(customer)/(tabs)") },
    ]);
  };

  const resend = async () => {
    setError("");
    setCooldown(60);
    const { error: err } = await resendCode();
    if (err) Alert.alert("Resend failed", err);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <BrandLogo size={56} />
          </View>

          <View style={styles.iconWrap}>
            <MailCheck size={26} color={Colors.green} />
          </View>

          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.subheading}>
            Enter the 6-digit code we sent to{"\n"}
            <Text style={{ color: Colors.text, fontWeight: "600" }}>{params.email || "your email"}</Text>
          </Text>

          <View style={styles.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
              />
            ))}
          </View>

          {loading && <ActivityIndicator color={Colors.purple} style={{ marginTop: Spacing.lg }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={() => doVerify(code.join(""))}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Verify Email</Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't get it? </Text>
            <TouchableOpacity onPress={resend} disabled={cooldown > 0}>
              <Text style={[styles.resendLink, cooldown > 0 && { color: Colors.textMuted }]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Text>
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
  iconWrap: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.greenDim,
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: Spacing.lg,
  },
  heading: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: Spacing.xs },
  subheading: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xxxl, lineHeight: 22 },
  codeRow: { flexDirection: "row", justifyContent: "center", gap: Spacing.sm },
  codeInput: {
    width: 44, height: 54, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    textAlign: "center", fontSize: FontSize.xl, fontWeight: "700", color: Colors.text,
  },
  codeInputFilled: { borderColor: Colors.borderGlow },
  error: { color: Colors.red, fontSize: FontSize.sm, textAlign: "center", marginTop: Spacing.lg },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.xxl },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.lg },
  resendText: { fontSize: FontSize.md, color: Colors.textSecondary },
  resendLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600" },
});

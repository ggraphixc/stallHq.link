import React, { useEffect, useState } from "react";
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth, SignupRole } from "../../lib/auth";
import { BrandLogo } from "../../components/BrandLogo";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput } from "../../lib/theme";
import { Store, ShoppingBag } from "lucide-react-native";

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: SignupRole = params.role === "customer" ? "customer" : "vendor";
  const { startSignup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTouched(false);
  }, [role]);

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed) return role === "vendor" ? "Enter your store name" : "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleSignup = async () => {
    const problem = validate();
    if (problem) { Alert.alert("Almost there", problem); return; }
    setLoading(true);
    const { error } = await startSignup({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      storeName: role === "vendor" ? name.trim() : undefined,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Signup Failed", error);
      return;
    }
    setTouched(true);
    router.push({
      pathname: "/(auth)/verify",
      params: { email: email.trim(), role },
    });
  };

  const isVendor = role === "vendor";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <BrandLogo size={40} />
            <View>
              <Text style={styles.heading}>{isVendor ? "Create your store" : "Create free account"}</Text>
              <Text style={styles.subheading}>
                {isVendor ? "Start your 14-day free trial" : "Save favorites & become a vendor later"}
              </Text>
            </View>
          </View>

          <View style={styles.roleCard}>
            <View style={[styles.roleIcon, { backgroundColor: isVendor ? Colors.purpleDim : Colors.greenDim }]}>
              {isVendor ? <Store size={16} color={Colors.purple} /> : <ShoppingBag size={16} color={Colors.green} />}
            </View>
            <Text style={styles.roleText}>
              {isVendor ? "Vendor account — you'll get a digital storefront" : "Customer account — browse & order, upgrade to a store anytime"}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{isVendor ? "Store Name" : "Your Name"}</Text>
            <TextInput
              style={styles.input}
              placeholder={isVendor ? "My Awesome Store" : "Jane Doe"}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

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
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isVendor ? "Create Store & Get Code" : "Create Account & Get Code"}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.trialText}>
              {isVendor ? "14-day free trial · No credit card required" : "We'll email you a 6-digit code to verify your address"}
            </Text>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxxl, justifyContent: "center" },
  backBtn: { position: "absolute", top: Spacing.xl, left: Spacing.xxl, zIndex: 2 },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  logoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl },
  heading: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text, marginBottom: 2 },
  subheading: { fontSize: FontSize.sm, color: Colors.textSecondary },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xl,
  },
  roleIcon: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: "center", alignItems: "center" },
  roleText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  form: { gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.lg, fontSize: FontSize.md },
  passwordRow: { flexDirection: "row", alignItems: "center", ...ambientInput },
  passwordInput: { flex: 1, padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text },
  eyeBtn: { padding: Spacing.lg },
  eyeText: { fontSize: 18 },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.md },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
  trialText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.md },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xxl },
  loginText: { fontSize: FontSize.md, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: "600" },
});

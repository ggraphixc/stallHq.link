import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { alert } from "../../lib/alert";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { BrandLoader } from "../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput, labelStyle } from "../../lib/theme";
import { ArrowLeft, Save, Lock, Trash2, Eye, EyeOff, Store as StoreIcon } from "lucide-react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { store, session, refreshStore, signOut } = useAuth();

  // Store fields
  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState(store?.slug ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number ?? "");
  const [instagram, setInstagram] = useState(store?.instagram_handle ?? "");
  const [email, setEmail] = useState(store?.email ?? "");
  const [description, setDescription] = useState(store?.description ?? "");
  const [stockAlerts, setStockAlerts] = useState(store?.stock_alerts_enabled ?? true);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(store?.low_stock_threshold ?? 5));
  const [saving, setSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!store) return;
    if (!name.trim() || !slug.trim()) { alert("Error", "Store name and URL are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      whatsapp_number: whatsapp.trim(),
      instagram_handle: instagram.trim() || null,
      email: email.trim() || null,
      description: description.trim() || null,
      stock_alerts_enabled: stockAlerts,
      low_stock_threshold: parseInt(lowStockThreshold) || 5,
    }).eq("id", store.id);
    setSaving(false);
    if (error) alert("Error", error.message);
    else {
      await refreshStore();
      alert("Saved", "Store settings updated", [{ text: "OK" }]);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { alert("Error", "New passwords do not match"); return; }
    if (newPassword.length < 6) { alert("Error", "New password must be at least 6 characters"); return; }
    setChangingPassword(true);
    try {
      const res = await fetch("https://hqlink.vercel.app/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { alert("Error", data.error || "Failed to change password"); return; }
      alert("Success", "Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      // Fallback: try Supabase update directly
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) alert("Error", error.message);
      else { alert("Success", "Password changed successfully"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = () => {
    alert(
      "Delete Store?",
      `This will permanently delete "${store?.name}", all products, orders, and your account. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Everything", style: "destructive", onPress: async () => {
          setDeleting(true);
          try {
            await supabase.from("stores").delete().eq("id", store?.id);
            await signOut();
            router.replace("/(auth)/select-role");
          } finally {
            setDeleting(false);
          }
        }},
      ]
    );
  };

  const normalizedWhatsapp = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return digits.startsWith("234") ? `+${digits}` : digits.startsWith("0") ? `+234${digits.slice(1)}` : `+234${digits}`;
  };

  if (!store) {
    return <BrandLoader label="Loading settings" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={18} color={Colors.purple} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Store identity preview */}
          <View style={styles.identityCard}>
            <View style={styles.avatar}><StoreIcon size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{name || store.name}</Text>
              <Text style={styles.storeSlug}>stallhq.link/{slug || store.slug}</Text>
            </View>
          </View>

          {/* Store basics */}
          <Text style={styles.sectionLabel}>STORE BASICS</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="My Store" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Store URL</Text>
            <View style={styles.prefixRow}>
              <View style={styles.prefix}><Text style={styles.prefixText}>stallhq.link/</Text></View>
              <TextInput style={[styles.input, styles.prefixInput]} value={slug} onChangeText={setSlug} autoCapitalize="none" autoCorrect={false} placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={styles.label}>WhatsApp Number</Text>
            <View style={styles.prefixRow}>
              <View style={styles.prefix}><Text style={styles.prefixText}>+234</Text></View>
              <TextInput
                style={[styles.input, styles.prefixInput]}
                value={whatsapp.replace(/^\+234/, "").replace(/^234/, "")}
                onChangeText={(t) => setWhatsapp(normalizedWhatsapp(t))}
                keyboardType="phone-pad"
                placeholder="800 000 0000"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <Text style={styles.label}>Instagram Handle (optional)</Text>
            <View style={styles.prefixRow}>
              <View style={styles.prefix}><Text style={styles.prefixText}>@</Text></View>
              <TextInput style={[styles.input, styles.prefixInput]} value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="your_store" placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={styles.label}>Contact Email (optional)</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" placeholder="What do you sell?" placeholderTextColor={Colors.textMuted} />
          </View>

          {/* Inventory alerts */}
          <Text style={styles.sectionLabel}>INVENTORY</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Low Stock Alerts</Text>
                <Text style={styles.toggleSub}>Get notified when products run low</Text>
              </View>
              <Switch
                value={stockAlerts}
                onValueChange={setStockAlerts}
                trackColor={{ false: Colors.bgElevated, true: Colors.purple }}
                thumbColor="#fff"
              />
            </View>
            {stockAlerts && (
              <View style={{ marginTop: Spacing.md }}>
                <Text style={styles.label}>Alert when stock reaches</Text>
                <TextInput style={styles.input} value={lowStockThreshold} onChangeText={setLowStockThreshold} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Save size={16} color="#fff" /><Text style={styles.saveText}>Save Changes</Text></>}
          </TouchableOpacity>

          {/* Change password */}
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}><Lock size={16} color={Colors.amber} /><Text style={styles.cardTitle}>Change Password</Text></View>

            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passRow}>
              <TextInput style={[styles.input, styles.passInput]} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrent} placeholder="••••••••" placeholderTextColor={Colors.textMuted} />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                {showCurrent ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passRow}>
              <TextInput style={[styles.input, styles.passInput]} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNew} placeholder="Min 6 characters" placeholderTextColor={Colors.textMuted} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                {showNew ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.textMuted} />

            <TouchableOpacity
              style={[styles.passBtn, changingPassword && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? <ActivityIndicator color={Colors.amber} /> : <><Lock size={14} color={Colors.amber} /><Text style={styles.passBtnText}>Update Password</Text></>}
            </TouchableOpacity>
          </View>

          {/* Danger zone */}
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={[styles.card, { borderColor: Colors.red, borderWidth: 1 }]}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator color={Colors.red} /> : <><Trash2 size={16} color={Colors.red} /><Text style={styles.deleteText}>Delete Store & Account</Text></>}
            </TouchableOpacity>
            <Text style={styles.deleteHint}>Permanently deletes your store, products, orders, and account.</Text>
          </View>

          {session?.user && <Text style={styles.emailNote}>Signed in as {session.user.email}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.lg, paddingBottom: 120 },
  topBar: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  identityCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(19,19,29,0.6)",
    borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purple, justifyContent: "center", alignItems: "center", marginRight: Spacing.lg,
  },
  storeName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  storeSlug: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  sectionLabel: { ...labelStyle, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  form: { gap: Spacing.md },
  label: { ...labelStyle, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.md, fontSize: FontSize.md },
  prefixRow: { flexDirection: "row", alignItems: "center" },
  prefix: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md - 1,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRightWidth: 0, borderTopLeftRadius: BorderRadius.lg, borderBottomLeftRadius: BorderRadius.lg,
    justifyContent: "center",
  },
  prefixText: { fontSize: FontSize.sm, color: Colors.textMuted },
  prefixInput: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  textArea: { minHeight: 90, paddingTop: Spacing.md },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  toggleSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: Spacing.md,
  },
  saveText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  passRow: { position: "relative" },
  passInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: Spacing.md, top: 14 },
  passBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.amberDim, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
    borderRadius: BorderRadius.lg, paddingVertical: 12, marginTop: Spacing.md,
  },
  passBtnText: { color: Colors.amber, fontSize: FontSize.sm, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.redDim, borderRadius: BorderRadius.lg, paddingVertical: 12,
  },
  deleteText: { color: Colors.red, fontSize: FontSize.sm, fontWeight: "600" },
  deleteHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm },
  emailNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xxl },
});

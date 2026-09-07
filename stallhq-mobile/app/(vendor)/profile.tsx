import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRouter as expoUseRouter } from "expo-router";
import { BrandLoader } from "../../components/BrandLoader";
import { StoreIdentityCard } from "../../components/StoreIdentityCard";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius, labelStyle } from "../../lib/theme";
import { Store as StoreIcon, Check, X, Save } from "lucide-react-native";
import { supabase, Store } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

/** Public vendor profile page for other vendors browsing stores.
 *  Tapping "Edit" (only visible to the store owner) opens the editable
 *  store-profile form — mirrors the Store Settings experience but lives
 *  under /vendor/profile so vendors can manage their store identity here too.
 */
export default function VendorProfileScreen() {
  const styles = useThemeStyles(makeStyles);
  const expoRouter = expoUseRouter();
  const { store, session, refreshStore, signOut } = useAuth();
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editing state (mirrors settings form)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Store hours editing (simple open/close windows per day)
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [hoursSun, setHoursSun] = useState("");
  const [hoursMon, setHoursMon] = useState("");
  const [hoursTue, setHoursTue] = useState("");
  const [hoursWed, setHoursWed] = useState("");
  const [hoursThu, setHoursThu] = useState("");
  const [hoursFri, setHoursFri] = useState("");
  const [hoursSat, setHoursSat] = useState("");

  // Load the vendor's store (public identity for the card)
  const load = useCallback(async () => {
    const { data: s } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", store?.user_id ?? "")
      .maybeSingle();
    if (s) setViewingStore(s);
  }, [store?.user_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (store?.user_id) {
        const { data: s } = await supabase
          .from("stores")
          .select("*")
          .eq("user_id", store.user_id)
          .maybeSingle();
        if (!cancelled) {
          setViewingStore(s ?? null);
          if (s) {
            setName(s.name ?? "");
            setSlug(s.slug ?? "");
            setDescription(s.description ?? "");
            setWhatsapp(s.whatsapp_number ?? "");
            setInstagram(s.instagram_handle ?? "");
            setEmail(s.email ?? "");
            setHoursEnabled(!!s.store_hours?.enabled);
            if (s.store_hours?.days) {
              setHoursSun(s.store_hours.days.sun ?? "");
              setHoursMon(s.store_hours.days.mon ?? "");
              setHoursTue(s.store_hours.days.tue ?? "");
              setHoursWed(s.store_hours.days.wed ?? "");
              setHoursThu(s.store_hours.days.thu ?? "");
              setHoursFri(s.store_hours.days.fri ?? "");
              setHoursSat(s.store_hours.days.sat ?? "");
            }
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [store?.user_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSave = async () => {
    const s = viewingStore;
    if (!s) return;
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const { data: hours, error: hoursErr } = s.store_hours
        ? await supabase
            .from("store_hours")
            .update({
              enabled: hoursEnabled,
              days: {
                sun: hoursSun.trim() || null,
                mon: hoursMon.trim() || null,
                tue: hoursTue.trim() || null,
                wed: hoursWed.trim() || null,
                thu: hoursThu.trim() || null,
                fri: hoursFri.trim() || null,
                sat: hoursSat.trim() || null,
              },
            })
            .eq("id", (s.store_hours as any).id)
        : await supabase.from("store_hours").insert({
            store_id: s.id,
            enabled: hoursEnabled,
            days: {
              sun: hoursSun.trim() || null,
              mon: hoursMon.trim() || null,
              tue: hoursTue.trim() || null,
              wed: hoursWed.trim() || null,
              thu: hoursThu.trim() || null,
              fri: hoursFri.trim() || null,
              sat: hoursSat.trim() || null,
            },
          });
      if (hoursErr && !hours) throw hoursErr;

      const { error } = await supabase
        .from("stores")
        .update({
          name: name.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          description: description.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
          instagram_handle: instagram.trim() || null,
          email: email.trim() || null,
        })
        .eq("id", s.id);
      if (error) throw error;
      await refreshStore();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isOwner = store?.user_id === session?.user?.id;

  if (!viewingStore) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandLoader label="Loading profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
      }>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => expoRouter.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your Store</Text>
            <Text style={styles.subtitle}>{viewingStore.name}</Text>
          </View>
          {saved ? (
            <View style={styles.savedBadge}><Text style={styles.savedText}>Saved</Text></View>
          ) : null}
        </View>

        {/* Public identity card */}
        <StoreIdentityCard store={viewingStore} editable={isOwner} onEdit={() => setEditing(true)} />

        {/* Edit panel */}
        {editing ? (
          <View style={styles.editPanel}>
            <Text style={styles.editTitle}>Edit store profile</Text>
            <Text style={styles.editSub}>Update your store name, contact channels, open hours, and email.</Text>

            <Text style={styles.label}>Store name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Store name" placeholderTextColor={Colors.textMuted} maxLength={80} />

            <Text style={styles.label}>Store URL</Text>
            <TextInput style={[styles.input, { color: Colors.cyan }]} value={slug} onChangeText={setSlug} placeholder="stallhq.link/" placeholderTextColor={Colors.textMuted} autoCapitalize="none" maxLength={60} />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} placeholder="About your store..." placeholderTextColor={Colors.textMuted} multiline maxLength={500} />

            <Text style={styles.label}>WhatsApp number (optional)</Text>
            <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="234000000000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" maxLength={15} />

            <Text style={styles.label}>Instagram handle (optional)</Text>
            <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="@handle" placeholderTextColor={Colors.textMuted} autoCapitalize="none" maxLength={60} />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" maxLength={120} />

            <TouchableOpacity
              style={[styles.toggleRow, hoursEnabled && styles.toggleRowActive]}
              onPress={() => setHoursEnabled(!hoursEnabled)}
            >
              <Text style={[styles.toggleLabel, hoursEnabled && { color: Colors.purple }]}>Show open hours</Text>
              <View style={styles.toggle}>
                {!hoursEnabled ? (
                  <View style={[styles.toggleThumb, { backgroundColor: Colors.textMuted }]} />
                ) : (
                  <View style={[styles.toggleThumb, { backgroundColor: Colors.purple }]} />
                )}
              </View>
            </TouchableOpacity>

            {hoursEnabled && (
              <>
                <Text style={styles.label}>Open hours (e.g. 9:00 AM-5:00 PM)</Text>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
                  const setters = [setHoursSun, setHoursMon, setHoursTue, setHoursWed, setHoursThu, setHoursFri, setHoursSat];
                  const values = [hoursSun, hoursMon, hoursTue, hoursWed, hoursThu, hoursFri, hoursSat];
                  return (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.dayLabel}>{day}</Text>
                      <TextInput
                        style={[styles.input, { flex: 1, fontSize: FontSize.sm }]}
                        value={values[i] ?? ""}
                        onChangeText={setters[i]!}
                        placeholder="9:00 AM-5:00 PM or Closed"
                        placeholderTextColor={Colors.textMuted}
                        maxLength={40}
                        autoCapitalize="words"
                      />
                    </View>
                  );
                })}
              </>
            )}

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <Text style={{ color: "#fff" }}>Saving…</Text> : <Text style={{ color: "#fff" }}>Save changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Owner quick actions */}
        {isOwner && !editing && (
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.ownerActionBtn} onPress={() => setEditing(true)}>
              <Text style={styles.ownerActionText}>Edit store profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingBottom: 40 },
    header: {
      flexDirection: "row" as const, alignItems: "center" as const, padding: Spacing.lg, paddingBottom: Spacing.sm,
      backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    },
    backBtn: { padding: Spacing.xs },
    backText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.purple },
    title: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
    subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    savedBadge: {
      marginLeft: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md, backgroundColor: Colors.greenDim,
      alignItems: "center" as const,
    },
    savedText: { fontSize: FontSize.xs, fontWeight: "600" as const, color: Colors.green },
    editPanel: {
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.md,
    },
    editTitle: { fontSize: FontSize.lg, fontWeight: "700" as const, color: Colors.text, marginBottom: 4 },
    editSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
    label: { ...labelStyle, marginTop: Spacing.md, marginBottom: Spacing.xs, color: Colors.textSecondary },
    input: {
      backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text,
    },
    toggleRow: {
      flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const,
      padding: Spacing.md, marginTop: Spacing.md,
      borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.md,
      backgroundColor: Colors.bgSecondary,
    },
    toggleRowActive: { borderColor: Colors.borderGlow, backgroundColor: Colors.purpleDim },
    toggleLabel: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.textMuted },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.borderMedium, justifyContent: "center" as const, padding: 2 },
    toggleThumb: { width: 18, height: 18, borderRadius: 9, alignSelf: "center" as const },
    hoursRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: Spacing.sm, marginTop: Spacing.xs },
    dayLabel: { width: 36, fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.textSecondary },
    editActions: { flexDirection: "row" as const, gap: Spacing.sm, marginTop: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
    cancelBtn: {
      flex: 1, alignItems: "center" as const, justifyContent: "center" as const,
      padding: Spacing.md, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: Colors.borderSubtle, backgroundColor: "transparent",
    },
    cancelText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.textSecondary },
    saveBtn: {
      flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 4,
      padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.purple,
    },
    ownerActions: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
    ownerActionBtn: {
      flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6,
      marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
      padding: Spacing.md, borderRadius: BorderRadius.md,
      backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.borderGlow,
    },
    ownerActionText: { fontSize: FontSize.sm, fontWeight: "700" as const, color: Colors.purple },
    signOutBtn: {
      flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
      marginHorizontal: Spacing.lg, padding: Spacing.md,
      borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.red,
    },
    signOutText: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.red },
  }));
  return s;
};
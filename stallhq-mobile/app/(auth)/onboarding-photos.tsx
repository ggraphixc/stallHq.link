import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";
import * as ImagePicker from "expo-image-picker";
import { WEB_API_URL } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Camera, Upload, Check, ArrowRight } from "lucide-react-native";

interface Props {
  storeId: string;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Onboarding step for uploading store logo and banner.
 * Allows picking images from gallery or camera.
 */
export function OnboardingPhotoStep({ storeId, onComplete, onSkip }: Props) {
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [bannerUploaded, setBannerUploaded] = useState(false);

  async function pickImage(type: "logo" | "banner") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: type === "logo" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (type === "logo") {
        setLogo(uri);
        await uploadImage(uri, "logo");
      } else {
        setBanner(uri);
        await uploadImage(uri, "banner");
      }
    }
  }

  async function uploadImage(uri: string, type: "logo" | "banner") {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Read the file as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `${type}_${Date.now()}.jpg`;
      const filePath = `store-assets/${storeId}/${fileName}`;

      const { error } = await supabase.storage
        .from("store-assets")
        .upload(filePath, blob, { contentType: "image/jpeg" });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("store-assets")
        .getPublicUrl(filePath);

      // Update store with the URL
      const field = type === "logo" ? "logo_url" : "banner_url";
      await fetch(`${WEB_API_URL}/api/stores`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.access_token,
        },
        body: JSON.stringify({ [field]: urlData.publicUrl }),
      });

      if (type === "logo") setLogoUploaded(true);
      else setBannerUploaded(true);
    } catch (err) {
      console.warn("[photo] upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Photos</Text>
      <Text style={styles.subtitle}>A logo and banner make your store look professional</Text>

      {/* Logo Upload */}
      <Pressable style={styles.uploadCard} onPress={() => pickImage("logo")}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logoPreview} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Camera size={32} color={Colors.textMuted} />
            <Text style={styles.uploadText}>Add Logo</Text>
          </View>
        )}
        {logoUploaded && (
          <View style={styles.checkBadge}>
            <Check size={12} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Banner Upload */}
      <Pressable style={styles.uploadCardWide} onPress={() => pickImage("banner")}>
        {banner ? (
          <Image source={{ uri: banner }} style={styles.bannerPreview} />
        ) : (
          <View style={styles.uploadPlaceholderWide}>
            <Upload size={32} color={Colors.textMuted} />
            <Text style={styles.uploadText}>Add Banner (16:9)</Text>
          </View>
        )}
        {bannerUploaded && (
          <View style={styles.checkBadge}>
            <Check size={12} color="#fff" />
          </View>
        )}
      </Pressable>

      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color={Colors.purple} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.continueBtn} onPress={onComplete}>
          <Text style={styles.continueBtnText}>Continue</Text>
          <ArrowRight size={16} color="#fff" />
        </Pressable>
        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip for Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  uploadCard: {
    ...ambientCard,
    width: 120,
    height: 120,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  uploadCardWide: {
    ...ambientCard,
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  uploadPlaceholder: { alignItems: "center", gap: Spacing.sm },
  uploadPlaceholderWide: { alignItems: "center", gap: Spacing.sm },
  uploadText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" },
  logoPreview: { width: "100%", height: "100%" },
  bannerPreview: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  uploadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  actions: { gap: Spacing.sm, marginTop: Spacing.xl },
  continueBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  continueBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  skipBtn: { paddingVertical: Spacing.sm, alignItems: "center" },
  skipBtnText: { fontSize: FontSize.sm, color: Colors.textMuted },
});

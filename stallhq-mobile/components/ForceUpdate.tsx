import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Linking, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Download, RefreshCw, Store } from "lucide-react-native";
import { Colors, FontSize, BorderRadius } from "../lib/theme";
import { useBranding } from "../lib/branding";
import { WEB_API_URL } from "../lib/config";
import type { AppUpdateInfo } from "../lib/appVersion";

interface ForceUpdateProps {
  info: AppUpdateInfo;
}

/**
 * Full-screen update gate — shown instead of the app when the installed
 * version is below the admin-configured minimum. Styled to match the
 * BrandLoader / ambient design system.
 */
export function ForceUpdate({ info }: ForceUpdateProps) {
  const { logo_url, platform_name } = useBranding();
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    pulseLoop.start();
    glowLoop.start();
    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [pulse, glow]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const markGlow = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(168,85,247,0.35)", "rgba(168,85,247,0.7)"],
  });

  const openDownload = () => {
    const url = info.downloadUrl || WEB_API_URL;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.markWrap}>
        <Animated.View style={[styles.markShadow, { backgroundColor: markGlow }]} />
        {logo_url ? (
          <Image source={{ uri: logo_url }} style={styles.markImage} resizeMode="contain" />
        ) : (
          <LinearGradient
            colors={["#a855f7", "#7c3aed", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mark, { transform: [{ scale }] }]}
          >
            <Store size={24} color="#fff" strokeWidth={2.2} />
          </LinearGradient>
        )}
      </View>

      <Text style={styles.wordmark}>{platform_name}</Text>

      <View style={styles.card}>
        <View style={styles.badge}>
          <Download size={12} color={Colors.purple} />
          <Text style={styles.badgeText}>New version available</Text>
        </View>

        <Text style={styles.title}>Update to continue</Text>
        <Text style={styles.body}>
          You're running v{info.currentVersion}. Update to v{info.latestVersion} for the
          latest features, fixes and security improvements.
        </Text>

        {info.releaseNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>What's new</Text>
            <Text style={styles.notesText}>{info.releaseNotes}</Text>
          </View>
        ) : null}

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={openDownload}>
          <Download size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Download Update</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]} onPress={openDownload}>
          <RefreshCw size={13} color={Colors.textSecondary} />
          <Text style={styles.secondaryBtnText}>Open download page</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>stallHq v{info.currentVersion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
  },
  glow: { position: "absolute", borderRadius: 999, opacity: 0.5 },
  glowTop: { width: 380, height: 380, top: -160, left: -120, backgroundColor: "rgba(168,85,247,0.06)" },
  glowBottom: { width: 340, height: 340, bottom: -150, right: -110, backgroundColor: "rgba(6,182,212,0.05)" },
  markWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  markShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
    opacity: 0.9,
    transform: [{ scale: 1.6 }],
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  markImage: { width: "70%", height: "70%" },
  wordmark: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(168,85,247,0.12)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.25)",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: Colors.purple, letterSpacing: 0.3 },
  title: { fontSize: 19, fontWeight: "800", color: Colors.text, letterSpacing: -0.3 },
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  notesBox: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 4,
  },
  notesLabel: { fontSize: 10, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  notesText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  primaryBtn: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: "600" },
  footer: { position: "absolute", bottom: 24, fontSize: 11, color: Colors.textMuted },
});

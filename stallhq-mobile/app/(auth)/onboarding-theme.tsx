import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../../lib/theme";

const THEME_PRESETS = [
  { name: "Midnight", primary: "#a855f7", bg: "#06060b", card: "#13131d" },
  { name: "Ocean", primary: "#06b6d4", bg: "#0a1628", card: "#0f1f35" },
  { name: "Forest", primary: "#10b981", bg: "#0a1a14", card: "#0f2a1f" },
  { name: "Sunset", primary: "#f59e0b", bg: "#1a1005", card: "#2a1a0a" },
  { name: "Rose", primary: "#f43f5e", bg: "#1a0a0e", card: "#2a0f15" },
  { name: "Slate", primary: "#64748b", bg: "#0f1219", card: "#1a1f2e" },
  { name: "Coral", primary: "#fb7185", bg: "#1a0f12", card: "#2a151a" },
  { name: "Indigo", primary: "#818cf8", bg: "#0a0e1a", card: "#10152a" },
];

interface Props {
  onSelect: (theme: { primary: string; background: string; card: string }) => void;
  onSkip: () => void;
}

/**
 * Onboarding step for choosing store theme colors.
 * Shows preset themes with live preview.
 */
export function OnboardingThemeStep({ onSelect, onSkip }: Props) {
  const [selected, setSelected] = useState(THEME_PRESETS[0]);
  const [customPrimary, setCustomPrimary] = useState("");

  function handleSelect(theme: typeof THEME_PRESETS[0]) {
    setSelected(theme);
    onSelect({ primary: theme.primary, background: theme.bg, card: theme.card });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Theme</Text>
      <Text style={styles.subtitle}>Pick a color scheme that matches your brand</Text>

      {/* Theme Grid */}
      <View style={styles.grid}>
        {THEME_PRESETS.map((theme) => (
          <Pressable
            key={theme.name}
            style={[
              styles.themeCard,
              selected.name === theme.name && styles.themeCardActive,
            ]}
            onPress={() => handleSelect(theme)}
          >
            <View style={[styles.colorPreview, { backgroundColor: theme.primary }]} />
            <View style={[styles.bgPreview, { backgroundColor: theme.bg }]}>
              <View style={[styles.cardPreview, { backgroundColor: theme.card }]} />
            </View>
            <Text style={styles.themeName}>{theme.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Preview */}
      <View style={[styles.preview, { backgroundColor: selected.bg }]}>
        <View style={[styles.previewHeader, { backgroundColor: selected.card }]}>
          <View style={[styles.previewLogo, { backgroundColor: selected.primary }]} />
          <View>
            <View style={[styles.previewLine, { backgroundColor: selected.primary, width: 80 }]} />
            <View style={[styles.previewLine, { backgroundColor: selected.card, width: 50, marginTop: 4 }]} />
          </View>
        </View>
        <View style={styles.previewProducts}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.previewProduct, { backgroundColor: selected.card }]}>
              <View style={[styles.previewImg, { backgroundColor: selected.primary + "30" }]} />
              <View style={[styles.previewLine, { backgroundColor: selected.primary, width: 40, marginTop: 6 }]} />
              <View style={[styles.previewLine, { backgroundColor: selected.card, width: 30, marginTop: 4 }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.useBtn} onPress={() => handleSelect(selected)}>
          <Text style={styles.useBtnText}>Use This Theme</Text>
        </Pressable>
        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip for Now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl },
  themeCard: {
    width: "23%",
    ...ambientCard,
    padding: Spacing.sm,
    alignItems: "center",
  },
  themeCardActive: {
    borderColor: Colors.purple,
    borderWidth: 2,
  },
  colorPreview: { width: 24, height: 24, borderRadius: 12, marginBottom: 4 },
  bgPreview: { width: "100%", height: 24, borderRadius: 4, padding: 3, marginBottom: 4 },
  cardPreview: { flex: 1, borderRadius: 3 },
  themeName: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "600" },
  preview: { borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.xl },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  previewLogo: { width: 32, height: 32, borderRadius: BorderRadius.sm },
  previewLine: { height: 8, borderRadius: 4 },
  previewProducts: { flexDirection: "row", gap: Spacing.sm },
  previewProduct: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.sm },
  previewImg: { width: "100%", aspectRatio: 1, borderRadius: BorderRadius.sm },
  actions: { gap: Spacing.sm },
  useBtn: { backgroundColor: Colors.purple, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: "center" },
  useBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  skipBtn: { paddingVertical: Spacing.sm, alignItems: "center" },
  skipBtnText: { fontSize: FontSize.sm, color: Colors.textMuted },
});

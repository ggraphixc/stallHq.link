import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { ArrowLeft, X, CornerUpLeft } from "lucide-react-native";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
} from "../../lib/theme";
import { TypingDots } from "./TypingDots";

type Props = {
  onBack: () => void;
  title: string;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  right?: React.ReactNode;
  typing?: boolean;
  typingLabel?: string;
  replyName?: string | null;
  replyPreview?: string | null;
  onCancelReply?: () => void;
  safeTop?: number;
};

export function ChatHeader({
  onBack,
  title,
  subtitle,
  avatar,
  right,
  typing,
  typingLabel,
  replyName,
  replyPreview,
  onCancelReply,
  safeTop = 0,
}: Props) {
  const styles = useThemeStyles(makeStyles);

  return (
    <View style={[styles.wrap, { paddingTop: safeTop }]}>
      <BlurView
        intensity={Platform.OS === "android" ? 40 : 55}
        tint={Platform.OS === "android" ? "light" : "dark"}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.veil} />
      <View style={styles.row}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.purple} />
        </TouchableOpacity>
        {avatar}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {typing ? (
            <View style={styles.typingRow}>
              <TypingDots label={typingLabel || "typing"} />
              <Text style={styles.typingText} numberOfLines={1}>
                {typingLabel || "typing…"}
              </Text>
            </View>
          ) : subtitle ? (
            <View style={styles.subRow}>{subtitle}</View>
          ) : null}
        </View>
        {right}
      </View>
      {replyPreview != null && onCancelReply ? (
        <View style={styles.replyBar}>
          <CornerUpLeft size={13} color={Colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyTitle} numberOfLines={1}>
              {replyName || "Replying"}
            </Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyPreview}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={8}>
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: {
      backgroundColor: "transparent",
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderSubtle,
      overflow: "hidden",
    },
    veil: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: Colors.glass,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 56,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BorderRadius.md,
    },
    info: { flex: 1, minWidth: 0 },
    title: { fontSize: FontSize.md, fontWeight: "800", color: Colors.text },
    subRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
    typingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    typingText: { fontSize: FontSize.xs, color: Colors.purple, fontWeight: "600" },
    replyBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.purpleTint,
      borderTopWidth: 1,
      borderTopColor: Colors.borderSubtle,
    },
    replyTitle: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.purple },
    replyText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  });

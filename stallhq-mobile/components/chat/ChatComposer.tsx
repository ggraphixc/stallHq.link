import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Send, Image as ImageIcon, X, CornerUpLeft } from "lucide-react-native";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
} from "../../lib/theme";

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  onPickImage?: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  reply?: { name?: string; preview: string } | null;
  onCancelReply?: () => void;
  onTypingActive?: () => void;
  disabledHint?: string | null;
  safeBottom?: number;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onPickImage,
  sending,
  disabled,
  placeholder = "Type a message…",
  reply,
  onCancelReply,
  onTypingActive,
  disabledHint,
  safeBottom = 0,
}: Props) {
  const styles = useThemeStyles(makeStyles);
  const canSend = !disabled && !sending && value.trim().length > 0;

  if (disabled && disabledHint) {
    return (
      <View style={[styles.wrap, { paddingBottom: safeBottom }]}>
        <BlurView
          intensity={Platform.OS === "android" ? 40 : 55}
          tint={Platform.OS === "android" ? "light" : "dark"}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.veil} />
        <Text style={styles.hint}>{disabledHint}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: safeBottom }]}>
      <BlurView
        intensity={Platform.OS === "android" ? 40 : 55}
        tint={Platform.OS === "android" ? "light" : "dark"}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.veil} />

      {reply ? (
        <View style={styles.replyBar}>
          <CornerUpLeft size={13} color={Colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyTitle} numberOfLines={1}>
              {reply.name || "Replying"}
            </Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {reply.preview}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={8}>
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.emojiRow}>
        {QUICK_EMOJI.map((e) => (
          <TouchableOpacity
            key={e}
            style={styles.emojiBtn}
            onPress={() => {
              onChangeText(value + e);
              onTypingActive?.();
            }}
            accessibilityLabel={`Insert ${e}`}
          >
            <Text style={styles.emoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        {onPickImage ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPickImage}
            disabled={disabled || sending}
            hitSlop={6}
            accessibilityLabel="Send image"
          >
            <ImageIcon size={20} color={disabled ? Colors.textMuted : Colors.purple} />
          </TouchableOpacity>
        ) : null}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            onTypingActive?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          editable={!disabled}
          maxLength={2000}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!canSend || sending) && styles.sendBtnOff]}
          onPress={onSend}
          disabled={!canSend}
          accessibilityLabel="Send message"
        >
          <Send size={18} color={canSend ? "#fff" : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: {
      borderTopWidth: 1,
      borderTopColor: Colors.borderSubtle,
      overflow: "hidden",
      paddingTop: Spacing.sm,
    },
    veil: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: Colors.glass,
    },
    hint: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: FontSize.sm,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    replyBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.purpleTint,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.borderGlow,
    },
    replyTitle: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.purple },
    replyText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    emojiRow: {
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xs,
    },
    emojiBtn: {
      width: 36,
      height: 30,
      borderRadius: BorderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.bgSecondary,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
    },
    emoji: { fontSize: 15 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.purpleDim,
      borderWidth: 1,
      borderColor: Colors.borderGlow,
      marginBottom: 1,
    },
    input: {
      flex: 1,
      backgroundColor: Colors.bgSecondary,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 4,
      fontSize: FontSize.sm,
      color: Colors.text,
      maxHeight: 110,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.purple,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 1,
    },
    sendBtnOff: { backgroundColor: Colors.bgElevated },
  });

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Check, CheckCheck, Clock, CornerUpLeft } from "lucide-react-native";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  shadowSm,
} from "../../lib/theme";
import { displayContent, isImageUrl } from "../../lib/globalChat";
import { ReactionBar } from "./ReactionBar";
import type { ReactionSummary } from "../../lib/globalChat";

export type ReceiptKind = "sent" | "read" | null;

export type SwipeReplyInfo = {
  content: string;
  createdAt: string;
  mine: boolean;
};

type Props = {
  content: string;
  mine: boolean;
  createdAt: string;
  message_type?: string;
  pending?: boolean;
  failed?: boolean;
  senderName?: string | null;
  showName?: boolean;
  avatar?: React.ReactNode;
  reply?: { name?: string; preview: string } | null;
  reactions?: ReactionSummary[string] | null;
  reactionMineId?: string;
  onToggleReaction?: (emoji: string) => void;
  onLongPress?: () => void;
  onRetry?: () => void;
  receipt?: ReceiptKind;
  style?: StyleProp<ViewStyle>;
  timeText?: string;
  /** Muted italic placeholder instead of the real content. */
  deleted?: boolean;
  /** Swipe-to-reply is only wired up when this is provided. */
  onSwipeReply?: (message: SwipeReplyInfo) => void;
};

function clockTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ─── Image dimensions (module-level cache, no refetch loops) ────────────

type ImgDims = { w: number; h: number };

const imageSizeCache = new Map<string, ImgDims | null>();
const sizeListeners = new Map<string, Set<(dims: ImgDims | null) => void>>();

function requestImageSize(uri: string, cb: (dims: ImgDims | null) => void): void {
  const cached = imageSizeCache.get(uri);
  if (cached !== undefined) {
    cb(cached);
    return;
  }
  let waiting = sizeListeners.get(uri);
  if (waiting) {
    waiting.add(cb);
    return;
  }
  waiting = new Set([cb]);
  sizeListeners.set(uri, waiting);
  const settle = (dims: ImgDims | null) => {
    imageSizeCache.set(uri, dims);
    const fns = sizeListeners.get(uri);
    sizeListeners.delete(uri);
    if (fns) fns.forEach((fn) => fn(dims));
  };
  Image.getSize(
    uri,
    (w, h) => settle(w > 0 && h > 0 ? { w, h } : null),
    () => settle(null)
  );
}

function useImageDims(uri: string | null): ImgDims | null {
  const [dims, setDims] = useState<ImgDims | null>(() =>
    uri ? imageSizeCache.get(uri) ?? null : null
  );
  useEffect(() => {
    if (!uri) {
      setDims(null);
      return;
    }
    const cached = imageSizeCache.get(uri);
    if (cached !== undefined) {
      setDims(cached);
      return;
    }
    let alive = true;
    requestImageSize(uri, (d) => {
      if (alive) setDims(d);
    });
    return () => {
      alive = false;
    };
  }, [uri]);
  return dims;
}

const IMG_WIDTH = 200;
const IMG_PLACEHOLDER_HEIGHT = 160;

function imageHeight(dims: ImgDims | null): number {
  if (!dims) return IMG_PLACEHOLDER_HEIGHT;
  const raw = (IMG_WIDTH * dims.h) / dims.w;
  return Math.min(Math.max(raw, 120), 280);
}

export function ChatBubble({
  content,
  mine,
  createdAt,
  message_type,
  pending,
  failed,
  senderName,
  showName,
  avatar,
  reply,
  reactions,
  reactionMineId,
  onToggleReaction,
  onLongPress,
  onRetry,
  receipt,
  style,
  timeText,
  deleted,
  onSwipeReply,
}: Props) {
  const styles = useThemeStyles(makeStyles);
  const text = displayContent(content);
  const image = !deleted && (message_type === "image" || isImageUrl(content));
  const uri = image ? text.trim() : "";
  const dims = useImageDims(uri || null);

  const row = (
    <View style={[styles.row, mine && styles.rowMine, style]}>
      {!mine && avatar ? <View style={styles.avatarSlot}>{avatar}</View> : null}
      <View style={[styles.col, mine && styles.colMine]}>
        {showName && !mine && senderName ? (
          <Text style={styles.sender} numberOfLines={1}>
            {senderName}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => onLongPress?.()}
          delayLongPress={280}
          disabled={!onLongPress}
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleOther,
            failed && styles.bubbleFailed,
          ]}
        >
          {reply && !deleted ? (
            <View style={[styles.replyStrip, mine && styles.replyStripMine]}>
              <CornerUpLeft size={11} color={mine ? "#fff" : Colors.purple} />
              <View style={{ flex: 1 }}>
                {reply.name ? (
                  <Text style={[styles.replyName, mine && styles.replyTextMine]} numberOfLines={1}>
                    {reply.name}
                  </Text>
                ) : null}
                <Text style={[styles.replyPreview, mine && styles.replyTextMine]} numberOfLines={1}>
                  {reply.preview}
                </Text>
              </View>
            </View>
          ) : null}

          {deleted ? (
            <Text style={[styles.text, styles.deletedText, mine && styles.deletedTextMine]}>
              This message was deleted
            </Text>
          ) : image ? (
            <Image
              source={{ uri }}
              style={[styles.image, { height: imageHeight(dims) }]}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.text, mine && styles.textMine]} selectable>
              {text}
            </Text>
          )}

          <View style={[styles.meta, mine && styles.metaMine]}>
            <Text style={[styles.time, mine && styles.timeMine]}>
              {timeText ?? clockTime(createdAt)}
            </Text>
            {mine ? (
              failed ? (
                <Text style={styles.failed} onPress={onRetry} suppressHighlighting>
                  Tap to retry
                </Text>
              ) : pending ? (
                <Clock size={11} color="rgba(255,255,255,0.65)" />
              ) : receipt === "read" ? (
                <CheckCheck size={12} color="rgba(255,255,255,0.85)" />
              ) : receipt === "sent" ? (
                <CheckCheck size={12} color="rgba(255,255,255,0.55)" />
              ) : (
                <Check size={12} color="rgba(255,255,255,0.55)" />
              )
            ) : null}
          </View>
        </TouchableOpacity>

        {deleted ? null : (
          <ReactionBar
            reactions={reactions}
            mineId={reactionMineId}
            onToggle={onToggleReaction}
          />
        )}
      </View>
    </View>
  );

  if (!onSwipeReply) return row;

  const info: SwipeReplyInfo = { content, createdAt, mine };
  const triggerReply = (close?: () => void) => {
    close?.();
    onSwipeReply(info);
  };
  const replyAction = (instance: Swipeable) => (
    <TouchableOpacity
      style={styles.swipeAction}
      activeOpacity={0.75}
      onPress={() => triggerReply(() => instance.close())}
      accessibilityLabel="Reply"
    >
      <CornerUpLeft size={18} color={Colors.purple} />
    </TouchableOpacity>
  );

  return (
    <Swipeable
      friction={1}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={24}
      rightThreshold={24}
      activeOffsetX={[-18, 18]}
      failOffsetY={[-14, 14]}
      renderLeftActions={(_p, _d, instance) => replyAction(instance)}
      renderRightActions={(_p, _d, instance) => replyAction(instance)}
      onSwipeableOpen={(_direction, instance) => triggerReply(() => instance.close())}
    >
      {row}
    </Swipeable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: Spacing.sm,
      gap: 8,
    },
    rowMine: { justifyContent: "flex-end" },
    avatarSlot: { marginBottom: 18 },
    col: { maxWidth: "78%", alignItems: "flex-start" },
    colMine: { alignItems: "flex-end" },
    sender: {
      fontSize: 10,
      color: Colors.textMuted,
      marginBottom: 3,
      marginLeft: 4,
      fontWeight: "600",
    },
    bubble: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.lg,
      ...shadowSm,
    },
    bubbleOther: {
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderTopLeftRadius: 4,
    },
    bubbleMine: {
      backgroundColor: Colors.purple,
      borderTopRightRadius: 4,
      overflow: "hidden",
    },
    bubbleFailed: {
      opacity: 0.75,
      borderWidth: 1,
      borderColor: Colors.red,
    },
    replyStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: Colors.purpleTint,
      borderLeftWidth: 2,
      borderLeftColor: Colors.purple,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginBottom: 6,
      alignSelf: "stretch",
    },
    replyStripMine: {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderLeftColor: "rgba(255,255,255,0.85)",
    },
    replyName: { fontSize: 10, fontWeight: "700", color: Colors.purple },
    replyPreview: { fontSize: 11, color: Colors.textSecondary },
    replyTextMine: { color: "rgba(255,255,255,0.9)" },
    text: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 19 },
    textMine: { color: "#fff" },
    deletedText: { fontStyle: "italic", color: Colors.textMuted },
    deletedTextMine: { color: "rgba(255,255,255,0.72)" },
    image: {
      width: IMG_WIDTH,
      height: IMG_PLACEHOLDER_HEIGHT,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.bgElevated,
      marginBottom: 4,
    },
    swipeAction: {
      width: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    metaMine: { justifyContent: "flex-end" },
    time: { fontSize: 10, color: Colors.textMuted },
    timeMine: { color: "rgba(255,255,255,0.65)" },
    failed: {
      fontSize: 10,
      color: "#fecaca",
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });

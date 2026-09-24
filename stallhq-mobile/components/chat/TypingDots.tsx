import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useThemeStyles, Colors, FontSize } from "../../lib/theme";

type Props = {
  label?: string;
};

export function TypingDots({ label = "typing" }: Props) {
  const styles = useThemeStyles(makeStyles);
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(700 - delay * 2),
        ])
      );
    const anims = [loop(a, 0), loop(b, 120), loop(c, 240)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a, b, c]);

  const dot = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
  });

  return (
    <View style={styles.wrap} accessibilityLabel={label}>
      <Animated.View style={[styles.dot, dot(a)]} />
      <Animated.View style={[styles.dot, dot(b)]} />
      <Animated.View style={[styles.dot, dot(c)]} />
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignSelf: "flex-start",
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: 14,
      marginLeft: 38,
      marginBottom: 8,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.purple,
    },
  });

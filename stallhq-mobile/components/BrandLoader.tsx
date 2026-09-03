import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Easing, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from "react-native-svg";
import { Store } from "lucide-react-native";
import { Colors, FontSize } from "../lib/theme";

interface BrandLoaderProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * stallHq branded loader — rotating gradient ring + pulsing mark + shimmer
 * wordmark. Fill the parent: give it style={{ flex: 1 }} when used inline.
 */
export function BrandLoader({ label = "Loading…", style }: BrandLoaderProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    // backgroundColor interpolation is not supported by the native driver
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    const dotLoops = dotAnims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay(900 - i * 120),
        ])
      )
    );
    spinLoop.start();
    pulseLoop.start();
    glowLoop.start();
    dotLoops.forEach((l) => l.start());
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
      glowLoop.stop();
      dotLoops.forEach((l) => l.stop());
    };
  }, [spin, pulse, glow, dotAnims]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const markGlow = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "rgba(168,85,247,0.35)",
      "rgba(168,85,247,0.7)",
    ],
  });
  const dotY = dotAnims.map((v) => v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }));
  const dotOpacity = dotAnims.map((v) => v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }));

  return (
    <View style={[styles.container, style]}>
      {/* ambient glows */}
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.ringWrap}>
        {/* rotating gradient ring */}
        <Animated.View style={{ width: 116, height: 116, transform: [{ rotate }] }}>
          <Svg width={116} height={116}>
            <Defs>
              <SvgLinearGradient id="shqRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#a855f7" />
                <Stop offset="55%" stopColor="#7c3aed" />
                <Stop offset="100%" stopColor="#22d3ee" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={58}
              cy={58}
              r={52}
              stroke="url(#shqRing)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="235 92"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* pulsing gradient mark */}
        <Animated.View style={[styles.markWrap, { transform: [{ scale }] }]}>
          <Animated.View
            style={[
              styles.markShadow,
              { backgroundColor: markGlow },
            ]}
          />
          <LinearGradient
            colors={["#a855f7", "#7c3aed", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mark}
          >
            <Store size={26} color="#fff" strokeWidth={2.2} />
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.wordmark}>stallHq</Text>
        <View style={styles.dots}>
          {[Colors.purple, Colors.cyan, Colors.green].map((c, i) => (
            <Animated.View
              key={c}
              style={[
                styles.dot,
                { backgroundColor: c, opacity: dotOpacity[i], transform: [{ translateY: dotY[i] }] },
              ]}
            />
          ))}
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    backgroundColor: Colors.bg,
    overflow: "hidden",
  },
  glow: { position: "absolute", borderRadius: 999, opacity: 0.5 },
  glowTop: {
    width: 380,
    height: 380,
    top: -160,
    left: -120,
    backgroundColor: "rgba(168,85,247,0.06)",
  },
  glowBottom: {
    width: 340,
    height: 340,
    bottom: -150,
    right: -110,
    backgroundColor: "rgba(6,182,212,0.05)",
  },
  ringWrap: { width: 116, height: 116, alignItems: "center", justifyContent: "center" },
  markWrap: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 17,
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
    shadowColor: "#a855f7",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  copy: { alignItems: "center", gap: 14, marginTop: 4 },
  wordmark: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.text,
  },
  dots: { flexDirection: "row", gap: 8, height: 10, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(148,163,184,0.8)",
  },
});

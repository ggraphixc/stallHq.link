import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Store } from "lucide-react-native";
import { useBranding } from "../lib/branding";
import { Colors, FontSize, Spacing } from "../lib/theme";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
}

/**
 * Platform logo — uses the admin-configured logo (platform_settings.logo_url)
 * when set, otherwise a purple→cyan gradient mark. Wordmark uses the
 * admin-configured platform name.
 */
export function BrandLogo({
  size = 64,
  showWordmark = true,
  wordmarkSize = FontSize.hero,
}: BrandLogoProps) {
  const { logo_url, platform_name } = useBranding();
  const radius = Math.round(size * 0.28);

  return (
    <View style={styles.container}>
      {logo_url ? (
        <View
          style={[
            styles.imageWrap,
            { width: size, height: size, borderRadius: radius },
          ]}
        >
          <Image
            source={{ uri: logo_url }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ) : (
        <LinearGradient
          colors={["#a855f7", "#7c3aed", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.icon,
            { width: size, height: size, borderRadius: radius },
          ]}
        >
          <Store size={Math.round(size * 0.42)} color="#fff" strokeWidth={2.2} />
        </LinearGradient>
      )}
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>
          {platform_name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  imageWrap: {
    backgroundColor: "rgba(10,10,15,0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "72%", height: "72%" },
  icon: { alignItems: "center", justifyContent: "center" },
  wordmark: {
    fontSize: FontSize.hero,
    fontWeight: "800",
    color: Colors.text,
    marginTop: Spacing.md,
  },
});
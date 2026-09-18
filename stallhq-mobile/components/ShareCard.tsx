import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { Share2, MessageCircle, Camera } from "lucide-react-native";
import { WEB_API_URL } from "../lib/auth";

interface Props {
  title: string;
  description?: string;
  slug: string;
  productId: string;
  price?: number;
  imageUrl?: string | null;
  storeName?: string;
}

/**
 * Share card button for products.
 * Opens native share sheet or WhatsApp/Instagram sharing.
 */
export function ShareCard({ title, description, slug, productId, price, imageUrl, storeName }: Props) {
  const productUrl = `${WEB_API_URL}/${slug}/product/${productId}`;
  const displayName = storeName || slug;

  async function shareNative() {
    try {
      await Share.share({
        message: `Check out "${title}"${price ? ` for ₦${price.toLocaleString()}` : ""} on ${displayName}!\n\n${productUrl}`,
        url: productUrl,
        title,
      });
    } catch {}
  }

  async function shareWhatsApp() {
    const text = encodeURIComponent(
      `🛍️ *${title}*${price ? `\n💰 ₦${price.toLocaleString()}` : ""}\n🏪 ${displayName}\n\n${productUrl}`
    );
    const url = `https://wa.me/?text=${text}`;
    try {
      const Linking = require("expo-linking");
      await Linking.openURL(url);
    } catch {}
  }

  async function shareInstagram() {
    try {
      const Clipboard = require("expo-clipboard");
      await Clipboard.setStringAsync(
        `🛍️ ${title}${price ? `\n💰 ₦${price.toLocaleString()}` : ""}\n🏪 ${displayName}\n${productUrl}`
      );
    } catch {}
  }

  return (
    <Pressable style={styles.btn} onPress={shareNative}>
      <Share2 size={16} color={Colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
});

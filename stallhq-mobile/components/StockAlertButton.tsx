import React, { useEffect, useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { WEB_API_URL } from "../lib/auth";
import { getDeviceId } from "../lib/deviceId";
import { Bell, BellOff } from "lucide-react-native";

interface Props {
  productId: string;
  productName?: string;
}

/**
 * Back-in-stock alert toggle button.
 * Auto-detects device ID internally.
 */
export function StockAlertButton({ productId }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    getDeviceId().then((id) => {
      setDeviceId(id);
      checkAlert(id);
    });
  }, [productId]);

  async function checkAlert(id: string) {
    try {
      const res = await fetch(
        `${WEB_API_URL}/api/alerts/stock?product_id=${productId}&device_id=${id}`
      );
      if (res.ok) {
        const data = await res.json();
        setSubscribed(!!data.alert);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (loading || !deviceId) return;
    setLoading(true);

    try {
      if (subscribed) {
        await fetch(
          `${WEB_API_URL}/api/alerts/stock?product_id=${productId}&device_id=${deviceId}`,
          { method: "DELETE" }
        );
        setSubscribed(false);
      } else {
        await fetch(`${WEB_API_URL}/api/alerts/stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, device_id: deviceId }),
        });
        setSubscribed(true);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading && !subscribed) return null;

  return (
    <Pressable
      style={[styles.btn, subscribed && styles.btnActive]}
      onPress={toggle}
    >
      {subscribed ? (
        <BellOff size={16} color={Colors.green} />
      ) : (
        <Bell size={16} color={Colors.textSecondary} />
      )}
      <Text style={[styles.text, subscribed && styles.textActive]}>
        {subscribed ? "Alert Set" : "Notify When Available"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  btnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: Colors.green,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  textActive: {
    color: Colors.green,
  },
});

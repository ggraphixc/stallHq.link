import React, { useEffect, useState, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { WifiOff, Wifi } from "lucide-react-native";
import { isOnline, onOnlineChange } from "../lib/offlineCache";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const reconnectedAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    setOnline(isOnline());
    const unsub = onOnlineChange((isNowOnline) => {
      setOnline(isNowOnline);
      if (!isNowOnline) {
        // Show offline banner
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      } else {
        // Hide offline, show reconnected briefly
        Animated.timing(slideAnim, { toValue: -60, duration: 300, useNativeDriver: true }).start();
        setShowReconnected(true);
        Animated.sequence([
          Animated.timing(reconnectedAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(reconnectedAnim, { toValue: -60, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowReconnected(false));
      }
    });
    return unsub;
  }, []);

  return (
    <>
      {/* Offline banner */}
      <Animated.View
        style={[
          styles.banner,
          styles.offline,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={online ? "none" : "auto"}
      >
        <WifiOff size={14} color="#fff" />
        <Text style={styles.bannerText}>You're offline — orders will be queued</Text>
      </Animated.View>

      {/* Reconnected banner */}
      {showReconnected && (
        <Animated.View
          style={[
            styles.banner,
            styles.online,
            { transform: [{ translateY: reconnectedAnim }] },
          ]}
        >
          <Wifi size={14} color="#fff" />
          <Text style={styles.bannerText}>Back online — syncing...</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  offline: {
    backgroundColor: "#ef4444",
  },
  online: {
    backgroundColor: "#22c55e",
  },
  bannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

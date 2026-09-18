import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../lib/theme";
import { getTrendingProducts, type RecentlyViewedProduct } from "../lib/recentlyViewed";

interface Props {
  limit?: number;
  days?: number;
}

export function TrendingProducts({ limit = 8, days = 7 }: Props) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTrendingProducts(limit, days).then((p) => {
      if (alive) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [limit, days]);

  if (loading || products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.fire}>🔥</Text>
        <Text style={styles.title}>Trending Now</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((p, i) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() => router.push(`/product/${p.id}`)}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{i + 1}</Text>
            </View>
            <Image
              source={{ uri: p.images?.[0] || "https://via.placeholder.com/150" }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.price}>₦{p.price.toLocaleString()}</Text>
            {p.store && (
              <Text style={styles.store} numberOfLines={1}>{p.store.name}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  fire: {
    fontSize: 20,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    ...ambientCard,
    width: 150,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  rankBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  rankText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: "#fff",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.green,
    marginBottom: 2,
  },
  store: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});

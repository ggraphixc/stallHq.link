import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../lib/theme";
import { getRelatedProducts, type RecentlyViewedProduct } from "../lib/recentlyViewed";

interface Props {
  productId: string;
  storeId?: string;
  category?: string | null;
  limit?: number;
}

export function RelatedProducts({ productId, storeId, category, limit = 6 }: Props) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getRelatedProducts(productId, limit).then((p) => {
      if (alive) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [productId, limit]);

  if (loading || products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Related Products</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((p) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() => router.push({ pathname: "/(customer)/product/[id]", params: { id: p.id } })}
          >
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
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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

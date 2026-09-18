import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius, ambientCard } from "../lib/theme";
import { WEB_API_URL } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Eye, MousePointerClick, ShoppingCart } from "lucide-react-native";

interface ProductPerformance {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  category: string | null;
  views: number;
  clicks: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
}

interface Props {
  storeId: string;
  limit?: number;
}

/**
 * Product performance table for vendor dashboard.
 * Shows per-product views, clicks, orders, revenue, and conversion rate.
 */
export function ProductPerformance({ storeId, limit = 10 }: Props) {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, [storeId]);

  async function fetchPerformance() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${WEB_API_URL}/api/products/performance?store_id=${storeId}`,
        { headers: { "x-access-token": session.access_token } }
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products?.slice(0, limit) || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading performance...</Text>
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Product Performance (30d)</Text>

      {/* Header Row */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.colName, styles.colHeader]}>Product</Text>
        <Text style={[styles.colStat, styles.colHeader]}>Views</Text>
        <Text style={[styles.colStat, styles.colHeader]}>Orders</Text>
        <Text style={[styles.colStat, styles.colHeader]}>Revenue</Text>
      </View>

      {/* Product Rows */}
      {products.map((p, i) => (
        <View key={p.id} style={[styles.row, i % 2 === 0 && styles.rowEven]}>
          <View style={styles.colName}>
            {p.image_url ? (
              <Image source={{ uri: p.image_url }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbPlaceholder} />
            )}
            <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
          </View>
          <Text style={styles.colStat}>{p.views}</Text>
          <Text style={styles.colStat}>{p.orders}</Text>
          <Text style={[styles.colStat, styles.revenue]}>₦{p.revenue.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...ambientCard,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  rowEven: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: BorderRadius.sm,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  colHeader: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colName: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  colStat: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: "right",
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
  },
  thumbPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
  },
  productName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  revenue: {
    color: Colors.green,
    fontWeight: "700",
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    padding: Spacing.lg,
  },
});

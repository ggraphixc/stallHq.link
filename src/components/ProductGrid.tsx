"use client";

import { useState, useMemo, useEffect } from "react";
import { Product, ProductWithRating } from "@/types";
import { ProductCard } from "./ProductCard";
import { useCart } from "@/hooks/useCart";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterPills } from "@/components/ui/FilterPills";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProductGridProps {
  products: Product[];
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  isFavorite?: (productId: string) => boolean;
  onToggleFavorite?: (productId: string, storeId: string) => void;
}

export function ProductGrid({ products, storeId, storeSlug, storeName, isFavorite, onToggleFavorite }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({});
  const { addItem } = useCart();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[],
    [products]
  );

  useEffect(() => {
    if (products.length === 0) return;

    const controller = new AbortController();

    const fetchRatings = async () => {
      try {
        const ids = products.map((p) => p.id).join(",");
        const response = await fetch(`/api/reviews/batch?product_ids=${ids}`, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setRatings(data.ratings || {});
        }
      } catch {
        // Silent fail on abort or network error
      }
    };

    fetchRatings();
    return () => controller.abort();
  }, [products]);

  const productsWithRatings: ProductWithRating[] = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        review_count: ratings[p.id]?.count || 0,
        avg_rating: ratings[p.id]?.average || 0,
      })),
    [products, ratings]
  );

  const filteredProducts = useMemo(() => {
    let result = productsWithRatings;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return result;
  }, [productsWithRatings, selectedCategory, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products..."
      />

      {/* Category Filter */}
      {categories.length > 0 && (
        <FilterPills
          options={categories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: "0.75rem" }}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addItem}
            storeId={storeId}
            storeSlug={storeSlug}
            storeName={storeName}
            isFavorite={isFavorite?.(product.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <EmptyState
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          }
          title="No products found"
          description={
            searchQuery
              ? `No products matching "${searchQuery}"`
              : "No products in this category"
          }
        />
      )}
    </div>
  );
}

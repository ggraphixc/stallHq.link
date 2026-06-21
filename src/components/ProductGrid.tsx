"use client";

import { useState, useMemo, useEffect } from "react";
import { Product, ProductWithRating } from "@/types";
import { ProductCard } from "./ProductCard";
import { useCart } from "@/hooks/useCart";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterPills } from "@/components/ui/FilterPills";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProductGridProps {
  products: Product[];
  storeId?: string;
  isOwner?: boolean;
  onEdit?: (product: Product) => void;
  onToggleStock?: (productId: string, currentInStock: boolean) => void;
  togglingId?: string | null;
}

export function ProductGrid({
  products,
  storeId,
  isOwner,
  onEdit,
  onToggleStock,
  togglingId,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({});
  const { addItem } = useCart();

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[],
    [products]
  );

  useEffect(() => {
    const fetchRatings = async () => {
      const ratingPromises = products.map(async (product) => {
        try {
          const response = await fetch(`/api/reviews?product_id=${product.id}`);
          if (response.ok) {
            const data = await response.json();
            return { id: product.id, ...data.summary };
          }
        } catch {
          // Silent fail
        }
        return { id: product.id, count: 0, average: 0 };
      });

      const results = await Promise.all(ratingPromises);
      const ratingsMap: Record<string, { count: number; average: number }> = {};
      results.forEach((r) => {
        ratingsMap[r.id] = { count: r.count, average: r.average };
      });
      setRatings(ratingsMap);
    };

    if (products.length > 0) {
      fetchRatings();
    }
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addItem}
            storeId={storeId}
            isOwner={isOwner}
            onEdit={onEdit}
            onToggleStock={onToggleStock}
            togglingId={togglingId}
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

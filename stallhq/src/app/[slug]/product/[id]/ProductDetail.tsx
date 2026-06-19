"use client";

import { Product, ProductVariant } from "@/types";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, ArrowLeft, Check, Package } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";

interface ProductDetailProps {
  product: Product & {
    stores: { name: string; slug: string };
    product_variants?: ProductVariant[];
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const variants = product.product_variants || [];

  // Combine main image with additional images
  const allImages = useMemo(() => {
    const images = [];
    if (product.image_url) images.push(product.image_url);
    if (product.images) images.push(...product.images);
    return images;
  }, [product.image_url, product.images]);

  // Group variants by option_name
  const variantGroups = useMemo(() => {
    return variants.reduce(
      (acc, variant) => {
        if (!acc[variant.option_name]) {
          acc[variant.option_name] = [];
        }
        acc[variant.option_name].push(variant);
        return acc;
      },
      {} as Record<string, ProductVariant[]>
    );
  }, [variants]);

  // Get selected variant's price adjustment
  const selectedVariantPrice = useMemo(() => {
    if (Object.keys(selectedVariants).length === 0) return null;

    const selectedVariant = variants.find((v) =>
      Object.entries(selectedVariants).every(
        ([key, value]) => v.option_name === key && v.option_value === value
      )
    );

    return selectedVariant?.price || null;
  }, [selectedVariants, variants]);

  // Calculate display price
  const displayPrice = selectedVariantPrice ?? product.price;

  // Check if all required variants are selected
  const allVariantsSelected = Object.keys(variantGroups).every(
    (groupName) => selectedVariants[groupName]
  );

  const handleAddToCart = () => {
    // Find the specific variant if variants exist
    let selectedVariant: ProductVariant | undefined;

    if (variants.length > 0 && allVariantsSelected) {
      selectedVariant = variants.find((v) =>
        Object.entries(selectedVariants).every(
          ([key, value]) => v.option_name === key && v.option_value === value
        )
      );
    }

    addItem(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link
            href={`/${product.stores.slug}`}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{product.stores.name}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="ambient-card overflow-hidden">
              <div className="image-glow aspect-square bg-[var(--bg-secondary)]">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-24 h-24 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-[var(--glow-purple)]"
                        : "border-transparent hover:border-[var(--border-subtle)]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <span className="category-tag mb-3 inline-block">
                  {product.category}
                </span>
              )}
              <h1 className="text-3xl font-extrabold mt-2">{product.name}</h1>
              {product.description && (
                <p className="text-[var(--text-secondary)] mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="price-display text-4xl">
              ₦{displayPrice.toLocaleString()}
            </div>

            {/* Variant Selection */}
            {Object.entries(variantGroups).map(([groupName, options]) => (
              <div key={groupName} className="space-y-2">
                <label className="text-sm font-medium">
                  {groupName}
                  {selectedVariants[groupName] && (
                    <span className="ml-2 text-[var(--glow-green)]">
                      {selectedVariants[groupName]}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {options.map((variant) => {
                    const isSelected =
                      selectedVariants[groupName] === variant.option_value;
                    const isOutOfStock = variant.stock <= 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() =>
                          setSelectedVariants({
                            ...selectedVariants,
                            [groupName]: variant.option_value,
                          })
                        }
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[var(--glow-purple)] text-white"
                            : isOutOfStock
                            ? "bg-[var(--bg-card)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/80"
                        }`}
                      >
                        {variant.option_value}
                        {variant.price !== null && (
                          <span className="ml-1 text-xs opacity-75">
                            (+₦{variant.price.toLocaleString()})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Stock Info */}
            {variants.length > 0 && allVariantsSelected && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Package className="w-4 h-4" />
                <span>
                  {variants.find((v) =>
                    Object.entries(selectedVariants).every(
                      ([key, value]) =>
                        v.option_name === key && v.option_value === value
                    )
                  )?.stock || 0}{" "}
                  in stock
                </span>
              </div>
            )}

            {variants.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Package className="w-4 h-4" />
                <span>{product.in_stock ? "In stock" : "Out of stock"}</span>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={
                added ||
                !product.in_stock ||
                (variants.length > 0 && !allVariantsSelected)
              }
              className={`glow-button w-full !py-4 text-lg ${
                added ? "!bg-[var(--glow-green)]" : ""
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart
                </>
              ) : variants.length > 0 && !allVariantsSelected ? (
                "Select all options"
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>

            {!product.in_stock && (
              <p className="text-center text-[var(--glow-red)] text-sm">
                This product is currently out of stock
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-8">
          <div className="border-t border-[var(--border-subtle)] pt-8">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ReviewList
                productId={product.id}
                storeId={product.store_id}
              />
              <ReviewForm
                productId={product.id}
                storeId={product.store_id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

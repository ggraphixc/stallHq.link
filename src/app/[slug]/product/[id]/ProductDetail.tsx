"use client";

import { Product, ProductVariant } from "@/types";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, ArrowLeft, Check, Package, Heart, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductShareModal } from "@/components/ProductShareModal";

interface ProductDetailProps {
  product: Product & {
    stores: { name: string; slug: string };
    product_variants?: ProductVariant[];
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "4rem", display: "flex", alignItems: "center" }}>
          <Link
            href={`/${product.stores.slug}`}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{product.stores.name}</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "2rem" }}>
          {/* Image Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Main Image */}
            <div className="ambient-card" style={{ overflow: "hidden" }}>
              <div className="image-glow" style={{ aspectRatio: "1/1", background: "var(--bg-secondary)" }}>
                {allImages.length > 0 ? (
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingBag style={{ width: "6rem", height: "6rem", color: "var(--text-muted)" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    style={{
                      flexShrink: 0,
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      border: `2px solid ${selectedImageIndex === index ? "var(--glow-purple)" : "transparent"}`,
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              {product.category && (
                <span className="category-tag" style={{ marginBottom: "0.75rem", display: "inline-block" }}>
                  {product.category}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
                <h1 style={{ fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: 800, flex: 1 }}>{product.name}</h1>
                <button
                  onClick={() => toggleFavorite(product.id, product.store_id)}
                  style={{
                    width: "2.75rem", height: "2.75rem",
                    borderRadius: "50%", border: "1px solid var(--border-subtle)",
                    background: isFavorite(product.id) ? "rgba(239,68,68,0.15)" : "var(--bg-card)",
                    color: isFavorite(product.id) ? "#ef4444" : "var(--text-muted)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                  }}
                  aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart size={18} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                </button>
              </div>
              {product.description && (
                <p style={{ color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                  {product.description}
                </p>
              )}
            </div>

            <div className="price-display" style={{ fontSize: "clamp(1.875rem,4vw,2.25rem)" }}>
              ₦{displayPrice.toLocaleString()}
            </div>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                borderRadius: "0.5rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                width: "fit-content",
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--glow-purple)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <Share2 size={16} />
              Share Product
            </button>

            <ProductShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              storeSlug={product.stores.slug}
              storeName={product.stores.name}
              productId={product.id}
              productName={product.name}
              productImage={product.image_url || undefined}
              productPrice={product.price}
            />

            {/* Variant Selection */}
            {Object.entries(variantGroups).map(([groupName, options]) => (
              <div key={groupName} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  {groupName}
                  {selectedVariants[groupName] && (
                    <span style={{ marginLeft: "0.5rem", color: "var(--glow-green)" }}>
                      {selectedVariants[groupName]}
                    </span>
                  )}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
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
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          background: isSelected ? "var(--glow-purple)" : "var(--bg-card)",
                          color: isSelected ? "white" : isOutOfStock ? "var(--text-muted)" : "var(--text-secondary)",
                          opacity: isOutOfStock ? 0.5 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          border: "none",
                        }}
                      >
                        {variant.option_value}
                        {variant.price !== null && (
                          <span style={{ marginLeft: "0.25rem", fontSize: "0.75rem", opacity: 0.75 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <Package style={{ width: "1rem", height: "1rem" }} />
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <Package style={{ width: "1rem", height: "1rem" }} />
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
              className="glow-button"
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.125rem",
                ...(added ? { background: "var(--glow-green)" } : {}),
              }}
            >
              {added ? (
                <>
                  <Check style={{ width: "1.25rem", height: "1.25rem" }} />
                  Added to Cart
                </>
              ) : variants.length > 0 && !allVariantsSelected ? (
                "Select all options"
              ) : (
                <>
                  <ShoppingBag style={{ width: "1.25rem", height: "1.25rem" }} />
                  Add to Cart
                </>
              )}
            </button>

            {!product.in_stock && (
              <p style={{ textAlign: "center", color: "var(--glow-red)", fontSize: "0.875rem" }}>
                This product is currently out of stock
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: "3.5rem" }}>
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "2.5rem" }}>
            <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 700, marginBottom: "2rem" }}>Customer Reviews</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 24rem), 1fr))", gap: "2rem" }}>
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

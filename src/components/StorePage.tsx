"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Store, Product } from "@/types";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { StoreFooter } from "@/components/StoreFooter";
import { VisitorBadge } from "@/components/VisitorBadge";
import { StoreHoursBadge } from "@/components/StoreHoursBadge";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { createClient } from "@/lib/supabase/client";

interface StorePageProps {
  store: Store;
  products: Product[];
}

export function StorePage({ store, products }: StorePageProps) {
  const router = useRouter();
  const { trackVisit } = useAnalytics();
  const supabase = createClient();

  const [isOwner, setIsOwner] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    trackVisit(store.id);
  }, [store.id, trackVisit]);

  // Check if current user is the store owner
  useEffect(() => {
    const checkOwner = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === store.user_id) {
        setIsOwner(true);
      }
    };
    checkOwner();
  }, [store.user_id, supabase]);

  const handleToggleStock = async (productId: string, currentInStock: boolean) => {
    setTogglingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ in_stock: !currentInStock }),
      });
      if (res.ok) {
        setLocalProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, in_stock: !currentInStock } : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling stock:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (product: Product) => {
    router.push(`/dashboard/products/${product.id}`);
  };

  const themeStyles = useMemo(() => {
    if (!store.theme) return {};
    const styles: Record<string, string> = {};
    if (store.theme.primaryColor) {
      styles["--glow-purple"] = store.theme.primaryColor;
      styles["--border-glow"] = `${store.theme.primaryColor}4d`;
    }
    if (store.theme.accentColor) {
      styles["--glow-cyan"] = store.theme.accentColor;
    }
    if (store.theme.backgroundColor) {
      styles["--bg-primary"] = store.theme.backgroundColor;
    }
    if (store.theme.cardBackground) {
      styles["--bg-card"] = store.theme.cardBackground;
      styles["--bg-card-hover"] = `${store.theme.cardBackground}e6`;
    }
    if (store.theme.textColor) {
      styles["--text-primary"] = store.theme.textColor;
    }
    return styles;
  }, [store.theme]);

  return (
    <div style={{ minHeight: "100vh", ...themeStyles }}>
      <StoreHeader store={store} />

      {/* Banner */}
      {store.banner_url && (
        <div style={{ position: "relative", height: "14rem", overflow: "hidden" }}>
          <img
            src={store.banner_url}
            alt={`${store.name} banner`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, var(--bg-primary) 0%, transparent 60%)",
            }}
          />
        </div>
      )}

      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Store Info */}
        <div style={{ marginBottom: "2.5rem", ...(store.banner_url ? { marginTop: "-4rem", position: "relative", zIndex: 10 } : {}) }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <StoreAvatar
              name={store.name}
              logoUrl={store.logo_url}
              size="xl"
              rounded="2xl"
            />
            <div style={{ flex: 1, minWidth: 0, paddingTop: "0.25rem" }}>
              <h1 style={{ fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>{store.name}</h1>
              {store.description && (
                <p style={{ fontSize: "clamp(0.875rem,2vw,1rem)", color: "var(--text-secondary)", marginTop: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {store.description}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                <VisitorBadge storeId={store.id} />
                <StoreHoursBadge storeHours={store.store_hours} />
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Products</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{localProducts.length} items</span>
          </div>
          {localProducts.length > 0 ? (
            <ProductGrid
              products={localProducts}
              storeId={store.id}
              isOwner={isOwner}
              onEdit={handleEdit}
              onToggleStock={handleToggleStock}
              togglingId={togglingId}
            />
          ) : (
            <EmptyState
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
                </svg>
              }
              title="No products yet"
              description="This store hasn't added any products. Check back soon!"
            />
          )}
        </section>
      </main>

      <StoreFooter store={store} />
    </div>
  );
}

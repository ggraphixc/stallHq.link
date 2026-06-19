"use client";

import { useEffect, useMemo } from "react";
import { Store, Product } from "@/types";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { StoreFooter } from "@/components/StoreFooter";
import { VisitorBadge } from "@/components/VisitorBadge";
import { StoreHoursBadge } from "@/components/StoreHoursBadge";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnalytics } from "@/hooks/useAnalytics";

interface StorePageProps {
  store: Store;
  products: Product[];
}

export function StorePage({ store, products }: StorePageProps) {
  const { trackVisit } = useAnalytics();

  useEffect(() => {
    trackVisit(store.id);
  }, [store.id, trackVisit]);

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
    <div className="min-h-screen" style={themeStyles}>
      <StoreHeader store={store} />

      {/* Banner */}
      {store.banner_url && (
        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
          <img
            src={store.banner_url}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, var(--bg-primary) 0%, transparent 60%)",
            }}
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Store Info */}
        <div className={`mb-10 ${store.banner_url ? "-mt-16 relative z-10" : ""}`}>
          <div className="flex items-start gap-4">
            <StoreAvatar
              name={store.name}
              logoUrl={store.logo_url}
              size="xl"
              rounded="2xl"
            />
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{store.name}</h1>
              {store.description && (
                <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 line-clamp-2">
                  {store.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <VisitorBadge storeId={store.id} />
                <StoreHoursBadge storeHours={store.store_hours} />
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Products</h2>
            <span className="text-xs text-[var(--text-muted)]">{products.length} items</span>
          </div>
          {products.length > 0 ? (
            <ProductGrid products={products} storeId={store.id} />
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

"use client";

import { Store, Product } from "@/types";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { StoreFooter } from "@/components/StoreFooter";

interface StorePageProps {
  store: Store;
  products: Product[];
}

export function StorePage({ store, products }: StorePageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <StoreHeader store={store} />

      {/* Banner */}
      {store.banner_url && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={store.banner_url}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Info */}
        <div className={`space-y-4 mb-8 ${store.banner_url ? "-mt-20 relative z-10" : ""}`}>
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[var(--bg-primary)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-3xl border-4 border-[var(--bg-primary)]">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold">{store.name}</h1>
              {store.description && (
                <p className="text-[var(--text-secondary)] mt-1">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Products</h2>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="text-center py-16 ambient-card">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-[var(--text-muted)]">
                No products yet. Check back soon!
              </p>
            </div>
          )}
        </section>
      </main>

      <StoreFooter store={store} />
    </div>
  );
}

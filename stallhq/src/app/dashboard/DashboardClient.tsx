"use client";

import { useState } from "react";
import { Store, Product } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductForm } from "@/components/ProductForm";

interface DashboardClientProps {
  store: Store | null;
  products: Product[];
}

export function DashboardClient({ store, products }: DashboardClientProps) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (!store) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-extrabold">Create Your Store</h1>
          <p className="text-[var(--text-secondary)]">
            Set up your digital storefront in seconds
          </p>
          <form className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium mb-2">
                Store Name
              </label>
              <input
                type="text"
                className="ambient-input"
                placeholder="My Awesome Store"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Store URL
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-3 bg-[var(--bg-card)] border border-r-0 border-[var(--border-subtle)] rounded-l-lg text-[var(--text-muted)] text-sm">
                  stallhq.link/
                </span>
                <input
                  type="text"
                  className="ambient-input !rounded-l-none"
                  placeholder="my-store"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                className="ambient-input"
                placeholder="+234 800 000 0000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                className="ambient-input resize-none"
                rows={3}
                placeholder="What do you sell?"
              />
            </div>
            <button type="submit" className="glow-button w-full">
              Create Store
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold">
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold">{store.name}</h1>
              <p className="text-xs text-[var(--text-muted)]">
                stallhq.link/{store.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View Store
            </a>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="glow-button !px-4 !py-2 !text-sm"
            >
              + Add Product
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="ambient-card p-4">
            <p className="text-sm text-[var(--text-muted)]">Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="ambient-card p-4">
            <p className="text-sm text-[var(--text-muted)]">Store URL</p>
            <p className="text-sm font-medium text-[var(--glow-purple)] truncate">
              stallhq.link/{store.slug}
            </p>
          </div>
        </div>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Products</h2>
          </div>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="text-center py-16 ambient-card">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-[var(--text-muted)] mb-4">
                No products yet. Add your first product!
              </p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="glow-button"
              >
                + Add Product
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          store={store}
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

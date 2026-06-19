"use client";

import { useState, useEffect } from "react";
import { Store, Product } from "@/types";
import { DashboardProductGrid } from "@/components/DashboardProductGrid";
import { ProductForm } from "@/components/ProductForm";
import { StoreSettings } from "@/components/StoreSettings";
import { ShareCard } from "@/components/ShareCard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { BatchUpload } from "@/components/BatchUpload";
import { ThemeSettings } from "@/components/ThemeSettings";
import { OrderManager } from "@/components/OrderManager";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@supabase/supabase-js";
import {
  Settings,
  LogOut,
  ExternalLink,
  Package,
  Share2,
  BarChart3,
  Upload,
  Palette,
  ShoppingCart,
  Link as LinkIcon,
  MoreVertical,
} from "lucide-react";

interface DashboardClientProps {
  store: Store;
  products: Product[];
}

export function DashboardClient({
  store: initialStore,
  products: initialProducts,
}: DashboardClientProps) {
  const [store, setStore] = useState<Store>(initialStore);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?store_id=${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStore(updatedStore);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <StoreAvatar name={store.name} size="md" />
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base truncate">{store.name}</h1>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] truncate">
                stallhq.link/{store.slug}
              </p>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[
              { icon: Share2, label: "Share", onClick: () => setShowShareCard(true) },
              { icon: BarChart3, label: "Analytics", onClick: () => setShowAnalytics(true) },
              { icon: ShoppingCart, label: "Orders", onClick: () => setShowOrders(true) },
              { icon: Palette, label: "Theme", onClick: () => setShowTheme(true) },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="icon-button"
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}

            <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />

            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
              title="View Store"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="icon-button"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="icon-button"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="icon-button"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMobileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 py-1.5 scale-in overflow-hidden">
                  {[
                    { icon: Share2, label: "Share Store", onClick: () => { setShowShareCard(true); setShowMobileMenu(false); } },
                    { icon: BarChart3, label: "Analytics", onClick: () => { setShowAnalytics(true); setShowMobileMenu(false); } },
                    { icon: ShoppingCart, label: "Orders", onClick: () => { setShowOrders(true); setShowMobileMenu(false); } },
                    { icon: Palette, label: "Theme", onClick: () => { setShowTheme(true); setShowMobileMenu(false); } },
                    { icon: Upload, label: "Batch Upload", onClick: () => { setShowBatchUpload(true); setShowMobileMenu(false); } },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}

                  <div className="h-px bg-[var(--border-subtle)] my-1.5" />

                  <a
                    href={`/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Store
                  </a>
                  <button
                    onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--glow-red)] hover:bg-[var(--glow-red-dim)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-10">
          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Products"
            value={products.length}
            accent="purple"
          />
          <StatCard
            icon={<LinkIcon className="w-4 h-4" />}
            label="Store URL"
            value={
              <a
                href={`/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--glow-purple)] hover:underline truncate block"
              >
                stallhq.link/{store.slug}
              </a>
            }
            accent="cyan"
          />
        </div>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Products</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBatchUpload(true)}
                className="glow-button-secondary !px-3 !py-2.5 !text-xs !min-h-[44px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Batch Upload</span>
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="glow-button !px-3 !py-2.5 !text-xs !min-h-[44px]"
              >
                + Add Product
              </button>
            </div>
          </div>

          {products.length > 0 ? (
            <DashboardProductGrid
              products={products}
              onEdit={(product) => {
                setEditingProduct(product);
                setShowProductForm(true);
              }}
              onDelete={handleDeleteProduct}
            />
          ) : (
            <EmptyState
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
                </svg>
              }
              title="No products yet"
              description="Add your first product to start selling."
              action={
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductForm(true);
                  }}
                  className="glow-button"
                >
                  + Add Product
                </button>
              }
            />
          )}
        </section>
      </main>

      {/* Modals */}
      {showProductForm && (
        <ProductForm
          store={store}
          product={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSaved={handleProductSaved}
        />
      )}

      {showSettings && (
        <StoreSettings
          store={store}
          onClose={() => setShowSettings(false)}
          onSaved={handleStoreUpdated}
        />
      )}

      {showShareCard && (
        <ShareCard store={store} onClose={() => setShowShareCard(false)} />
      )}

      {showAnalytics && (
        <Modal open={showAnalytics} onClose={() => setShowAnalytics(false)} title="Analytics" maxWidth="max-w-2xl">
          <AnalyticsDashboard store={store} />
        </Modal>
      )}

      {showBatchUpload && (
        <BatchUpload
          store={store}
          onClose={() => setShowBatchUpload(false)}
          onComplete={() => { fetchProducts(); setShowBatchUpload(false); }}
        />
      )}

      {showTheme && (
        <ThemeSettings
          store={store}
          onClose={() => setShowTheme(false)}
          onSaved={handleStoreUpdated}
        />
      )}

      {showOrders && (
        <Modal open={showOrders} onClose={() => setShowOrders(false)} title="Orders" maxWidth="max-w-2xl">
          <OrderManager storeId={store.id} />
        </Modal>
      )}
    </div>
  );
}

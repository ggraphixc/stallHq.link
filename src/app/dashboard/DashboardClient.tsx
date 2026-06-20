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
import { createClient } from "@/lib/supabase/client";
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

  const supabase = createClient();

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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <StoreAvatar name={store.name} size="md" />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.name}</h1>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                stallhq.link/{store.slug}
              </p>
            </div>
          </div>

          {/* Desktop actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }} className="hidden sm:flex">
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
                <Icon style={{ width: "1rem", height: "1rem" }} />
              </button>
            ))}

            <div style={{ width: "1px", height: "1.25rem", background: "var(--border-subtle)", margin: "0 0.25rem" }} />

            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
              title="View Store"
            >
              <ExternalLink style={{ width: "1rem", height: "1rem" }} />
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="icon-button"
              title="Settings"
            >
              <Settings style={{ width: "1rem", height: "1rem" }} />
            </button>
            <button
              onClick={handleLogout}
              className="icon-button"
              title="Logout"
            >
              <LogOut style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>

          {/* Mobile menu */}
          <div style={{ position: "relative" }} className="sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="icon-button"
            >
              <MoreVertical style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>

            {showMobileMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="scale-in" style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.5rem", width: "12rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", zIndex: 50, padding: "0.375rem 0", overflow: "hidden" }}>
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
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                    >
                      <Icon style={{ width: "1rem", height: "1rem" }} />
                      {label}
                    </button>
                  ))}

                  <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0.375rem 0" }} />

                  <a
                    href={`/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", textDecoration: "none" }}
                  >
                    <ExternalLink style={{ width: "1rem", height: "1rem" }} />
                    View Store
                  </a>
                  <button
                    onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  >
                    <Settings style={{ width: "1rem", height: "1rem" }} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--glow-red)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  >
                    <LogOut style={{ width: "1rem", height: "1rem" }} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <StatCard
            icon={<Package style={{ width: "1rem", height: "1rem" }} />}
            label="Products"
            value={products.length}
            accent="purple"
          />
          <StatCard
            icon={<LinkIcon style={{ width: "1rem", height: "1rem" }} />}
            label="Store URL"
            value={
              <a
                href={`/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--glow-purple)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textDecoration: "none" }}
              >
                stallhq.link/{store.slug}
              </a>
            }
            accent="cyan"
          />
        </div>

        {/* Products */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Products</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setShowBatchUpload(true)}
                className="glow-button-secondary"
                style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem" }}
              >
                <Upload style={{ width: "0.875rem", height: "0.875rem" }} />
                <span className="hidden sm:inline">Batch Upload</span>
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="glow-button"
                style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem" }}
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

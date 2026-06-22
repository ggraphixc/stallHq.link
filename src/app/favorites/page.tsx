"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteItem {
  id: string;
  product_id: string;
  store_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    images: string[] | null;
    in_stock: boolean;
    stores: {
      id: string;
      slug: string;
      name: string;
    };
  };
}

export default function FavoritesPage() {
  const { favoritesCount, loaded } = useFavorites();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    fetchFavorites();
  }, [loaded]);

  const fetchFavorites = async () => {
    try {
      let deviceId = localStorage.getItem("stallhq_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
        localStorage.setItem("stallhq_device_id", deviceId);
      }
      const res = await fetch(`/api/favorites?device_id=${deviceId}`);
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    setRemovingId(productId);
    try {
      const deviceId = localStorage.getItem("stallhq_device_id");
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, product_id: productId }),
      });
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "2rem", height: "2rem", border: "2px solid var(--border-subtle)", borderTopColor: "var(--glow-purple)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.875rem" }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>StallHq</span>
          </Link>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/</span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Heart size={14} />
            My Favorites
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              My Favorites
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <Heart size={24} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>No favorites yet</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem", maxWidth: "24rem", margin: "0 auto 1.5rem" }}>
              Tap the heart icon on any product to save it here for later.
            </p>
            <Link
              href="/explore"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem", borderRadius: "0.75rem",
                background: "var(--glow-purple)", color: "white",
                fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
              }}
            >
              <ShoppingBag size={16} />
              Browse Stores
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {favorites.map((fav) => {
              const product = fav.products;
              const store = product?.stores;
              const thumbnail = product?.image_url || product?.images?.[0];

              return (
                <div
                  key={fav.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.75rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    transition: "border-color 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--glow-purple)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                >
                  {/* Thumbnail */}
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={product.name}
                      style={{ width: "4rem", height: "4rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: "4rem", height: "4rem", borderRadius: "0.5rem",
                      background: "var(--bg-secondary)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <ShoppingBag size={20} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/${store?.slug}/product/${product.id}`}
                      style={{ textDecoration: "none", color: "var(--text-primary)" }}
                    >
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </h3>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--glow-green)" }}>
                        ₦{product.price.toLocaleString()}
                      </span>
                      {!product.in_stock && (
                        <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.15)", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Out of stock
                        </span>
                      )}
                    </div>
                    {store && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {store.name}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <Link
                      href={`/${store?.slug}/product/${product.id}`}
                      style={{
                        width: "2.5rem", height: "2.5rem", borderRadius: "50%",
                        border: "1px solid var(--border-subtle)", background: "transparent",
                        color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                        textDecoration: "none",
                      }}
                      aria-label="View product"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      disabled={removingId === product.id}
                      style={{
                        width: "2.5rem", height: "2.5rem", borderRadius: "50%",
                        border: "1px solid var(--border-subtle)", background: "transparent",
                        color: removingId === product.id ? "var(--text-muted)" : "#ef4444",
                        cursor: removingId === product.id ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                      aria-label="Remove from favorites"
                    >
                      {removingId === product.id ? (
                        <div style={{ width: "0.875rem", height: "0.875rem", border: "2px solid var(--border-subtle)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

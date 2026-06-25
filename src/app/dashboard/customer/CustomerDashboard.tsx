"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Heart, User, Store, Package, Clock, CheckCircle, ArrowRight, Truck, LogOut, Trash2, ExternalLink, AlertTriangle } from "lucide-react";

interface Order {
  id: string;
  total: number;
  status: string;
  items: { name: string; price: number; quantity: number }[];
  created_at: string;
  stores?: { name: string; slug: string } | null;
}

interface FavoriteItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    in_stock: boolean;
    stores: { slug: string; name: string };
  };
}

interface CustomerDashboardProps {
  user: { id: string; email: string; name: string };
  orders: Order[];
  existingStore: { id: string; name: string; slug: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--glow-amber)",
  confirmed: "var(--glow-blue)",
  delivered: "var(--glow-green)",
  cancelled: "var(--glow-red)",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  confirmed: <Package size={12} />,
  delivered: <CheckCircle size={12} />,
  cancelled: <Truck size={12} />,
};

export function CustomerDashboard({ user, orders, existingStore }: CustomerDashboardProps) {
  const [tab, setTab] = useState<"orders" | "favorites" | "profile">("orders");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

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
      setFavCount(data.favorites?.length || 0);
    } catch {
      // silent
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
      setFavCount((prev) => prev - 1);
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account?\n\nThis will permanently delete:\n" +
      (existingStore ? "- Your store and all products\n" : "") +
      "- All your orders\n- All your favorites\n- Your account\n\nThis cannot be undone."
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm("This is your last chance. Type DELETE in your mind and click OK to permanently delete your account.");
    if (!doubleConfirm) return;

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete account");
        return;
      }

      window.location.href = "/";
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.75rem" }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>My Account</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/explore" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", padding: "0.5rem" }}>
              Browse Stores
            </Link>
            <Link href="/favorites" style={{ position: "relative", fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", padding: "0.5rem" }}>
              <Heart size={16} />
              {favCount > 0 && (
                <span style={{
                  position: "absolute", top: 0, right: 0,
                  minWidth: "1rem", height: "1rem",
                  borderRadius: "9999px", background: "#ef4444",
                  color: "white", fontSize: "0.5625rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 0.1875rem",
                }}>
                  {favCount > 99 ? "99+" : favCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "1.5rem 1rem" }}>
        {/* Welcome */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Welcome{user.name ? `, ${user.name}` : ""}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{user.email}</p>
        </div>

        {/* Create Store CTA */}
        {!existingStore && (
          <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(168,133,247,0.06)", border: "1px solid rgba(168,133,247,0.2)", textDecoration: "none", color: "var(--text-primary)", marginBottom: "1.5rem", transition: "border-color 0.2s" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(168,133,247,0.2), rgba(124,58,237,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Store size={18} style={{ color: "var(--glow-purple)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.125rem" }}>Start Selling on StallHq</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Create your own store and reach customers</p>
            </div>
            <ArrowRight size={16} style={{ color: "var(--glow-purple)", flexShrink: 0 }} />
          </Link>
        )}

        {existingStore && (
          <Link href={`/${existingStore.slug}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", textDecoration: "none", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Store size={18} style={{ color: "var(--glow-green)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.125rem" }}>{existingStore.name}</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>View your store</p>
            </div>
            <ArrowRight size={16} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
          </Link>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
          {([
            { key: "orders" as const, icon: <ShoppingBag size={14} />, label: "Orders" },
            { key: "favorites" as const, icon: <Heart size={14} />, label: "Favorites" },
            { key: "profile" as const, icon: <User size={14} />, label: "Profile" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                padding: "0.625rem",
                borderRadius: "0.375rem",
                border: "none",
                background: tab === t.key ? "var(--glow-purple)" : "transparent",
                color: tab === t.key ? "white" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                minHeight: "44px",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {tab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <ShoppingBag size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>No orders yet</p>
                <p style={{ fontSize: "0.75rem", marginBottom: "1rem" }}>When you order from a store, it will appear here.</p>
                <Link href="/explore" className="glow-button" style={{ display: "inline-flex", padding: "0.5rem 1rem", fontSize: "0.75rem", textDecoration: "none" }}>
                  Browse Stores
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        {order.stores?.name || "Store"}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                        {new Date(order.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "capitalize", background: `${STATUS_COLORS[order.status] || "var(--text-muted)"}15`, color: STATUS_COLORS[order.status] || "var(--text-muted)" }}>
                      {STATUS_ICONS[order.status]}
                      {order.status}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                    {(order.items || []).slice(0, 2).map((item, i) => (
                      <p key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                    {(order.items || []).length > 2 && (
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                        +{(order.items || []).length - 2} more items
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>₦{(order.total || 0).toLocaleString()}</span>
                    {order.stores?.slug && (
                      <Link href={`/${order.stores.slug}`} style={{ fontSize: "0.6875rem", color: "var(--glow-purple)", textDecoration: "none" }}>
                        View Store →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {tab === "favorites" && (
          <div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <Heart size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>No favorites yet</p>
                <p style={{ fontSize: "0.75rem", marginBottom: "1rem" }}>Tap the heart on any product to save it</p>
                <Link href="/explore" className="glow-button-secondary" style={{ display: "inline-flex", padding: "0.625rem 1.25rem", fontSize: "0.8125rem", textDecoration: "none" }}>
                  Browse Stores
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {favorites.map((fav) => {
                  const product = fav.products;
                  if (!product) return null;
                  const store = product.stores;
                  return (
                    <div
                      key={fav.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "0.75rem",
                      }}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: "3rem", height: "3rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "3rem", height: "3rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ShoppingBag size={16} style={{ color: "var(--text-muted)" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/${store?.slug}/product/${product.id}`} style={{ textDecoration: "none", color: "var(--text-primary)" }}>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--glow-green)" }}>₦{product.price.toLocaleString()}</span>
                          {!product.in_stock && (
                            <span style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.25rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>Out</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <Link href={`/${store?.slug}/product/${product.id}`} style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => removeFavorite(product.id)}
                          disabled={removingId === product.id}
                          style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "transparent", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.375rem" }}>Name</label>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{user.name || "Not set"}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.375rem" }}>Email</label>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{user.email}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.375rem" }}>Account Type</label>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{existingStore ? "Vendor & Customer" : "Customer"}</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "1rem", paddingTop: "1rem" }}>
              <form action="/api/auth/logout" method="post">
                <button type="submit" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "var(--glow-red)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center", minHeight: "44px" }}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </form>
            </div>
            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "0.75rem", paddingTop: "0.75rem" }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: deletingAccount ? "rgba(239,68,68,0.03)" : "rgba(239,68,68,0.08)",
                  color: "var(--glow-red)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  width: "100%",
                  justifyContent: "center",
                  minHeight: "44px",
                  opacity: deletingAccount ? 0.6 : 1,
                }}
              >
                <Trash2 size={14} />
                {deletingAccount ? "Deleting..." : "Delete Account"}
              </button>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
                This will permanently delete your account and all data.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

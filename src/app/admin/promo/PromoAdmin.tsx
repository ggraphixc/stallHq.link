"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Activity, Wand2, RefreshCw, Check, X, ExternalLink,
  MessageCircle, Image as ImageIcon, Clock, AlertTriangle, Filter
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Tab = "config" | "monitor" | "generate";

interface Store {
  id: string;
  name: string;
  slug: string;
  plan: string;
  whatsapp_number?: string;
  instagram_handle?: string;
  logo_url?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  in_stock: boolean;
}

interface PromoPost {
  id: string;
  store_id: string;
  store_name?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  platform: string;
  status: string;
  error?: string;
  caption?: string;
  message_id?: string;
  posted_at?: string;
  created_at: string;
}

interface PlatformStatus {
  whatsapp: { configured: boolean; phone_number_id?: string };
  instagram: { configured: boolean };
}

export default function PromoAdmin() {
  const [tab, setTab] = useState<Tab>("config");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "config", label: "Configuration", icon: Settings },
    { key: "monitor", label: "Monitoring", icon: Activity },
    { key: "generate", label: "Generate", icon: Wand2 },
  ];

  return (
    <div style={{ padding: "clamp(1rem, 3vw, 1.5rem)", maxWidth: "80rem", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: isMobile ? "1.25rem" : "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Promo Cards
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Configure, monitor, and generate promo cards across all stores
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", gap: "0.25rem", marginBottom: "1.5rem",
        background: "var(--bg-card)", borderRadius: "0.75rem", padding: "0.25rem",
        border: "1px solid var(--border-subtle)", overflowX: "auto",
      }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", padding: "0.625rem 1rem", borderRadius: "0.5rem",
              background: tab === key ? "rgba(168,133,247,0.15)" : "transparent",
              color: tab === key ? "var(--glow-purple)" : "var(--text-muted)",
              border: tab === key ? "1px solid rgba(168,133,247,0.2)" : "1px solid transparent",
              cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "config" && <ConfigurationTab />}
      {tab === "monitor" && <MonitoringTab />}
      {tab === "generate" && <GenerateTab />}
    </div>
  );
}

// ─── Configuration Tab ──────────────────────────────────────────────────────

function ConfigurationTab() {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo/config");
      if (res.ok) {
        const data = await res.json();
        setPlatformStatus(data.platformStatus);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    setTokenMessage(null);
    try {
      const res = await fetch("/api/admin/promo/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentToken: process.env.NEXT_PUBLIC_INSTAGRAM_TOKEN || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenMessage({ type: "success", text: data.message });
      } else {
        setTokenMessage({ type: "error", text: data.error });
      }
    } catch (e) {
      setTokenMessage({ type: "error", text: "Failed to refresh token" });
    }
    setRefreshingToken(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Platform Connection Status */}
      <Section title="Platform Connection Status" icon={<Activity size={14} />}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.8125rem" }}>Loading status...</p>
          </div>
        ) : platformStatus ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* WhatsApp */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.875rem 1rem", borderRadius: "0.625rem",
              background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <MessageCircle size={16} style={{ color: "#25d366" }} />
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>WhatsApp Business API</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    {platformStatus.whatsapp.configured
                      ? `Connected${platformStatus.whatsapp.phone_number_id ? ` — ${platformStatus.whatsapp.phone_number_id}` : ""}`
                      : "Platform-level — set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Vercel env"}
                  </p>
                </div>
              </div>
              <StatusBadge active={platformStatus.whatsapp.configured} />
            </div>

            {/* Instagram */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.875rem 1rem", borderRadius: "0.625rem",
              background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <ImageIcon size={16} style={{ color: "#e1306c" }} />
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Instagram Graph API</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    {platformStatus.instagram.configured
                      ? "Connected — token valid for ~60 days"
                      : "Platform-level — set INSTAGRAM_ACCESS_TOKEN in Vercel env"}
                  </p>
                </div>
              </div>
              <StatusBadge active={platformStatus.instagram.configured} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", padding: "1rem" }}>
            Could not load platform status.
          </p>
        )}
      </Section>

      {/* Instagram Token Management */}
      <Section title="Instagram Token Management" icon={<RefreshCw size={14} />}>
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Instagram access tokens expire after ~60 days. Use this to exchange your current token for a new long-lived token.
            You need <code style={{ background: "var(--bg-secondary)", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>FACEBOOK_APP_ID</code> and <code style={{ background: "var(--bg-secondary)", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>FACEBOOK_APP_SECRET</code> in your Vercel env vars.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleRefreshToken}
              disabled={refreshingToken}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 1rem", borderRadius: "0.5rem",
                background: refreshingToken ? "var(--bg-secondary)" : "rgba(168,133,247,0.15)",
                border: "1px solid rgba(168,133,247,0.2)",
                color: refreshingToken ? "var(--text-muted)" : "var(--glow-purple)",
                cursor: refreshingToken ? "not-allowed" : "pointer",
                fontSize: "0.8125rem", fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={refreshingToken ? "animate-spin" : ""} />
              {refreshingToken ? "Refreshing..." : "Refresh Instagram Token"}
            </button>
          </div>
          {tokenMessage && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "0.5rem",
              background: tokenMessage.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${tokenMessage.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              <p style={{ fontSize: "0.8125rem", color: tokenMessage.type === "success" ? "#10b981" : "#ef4444" }}>
                {tokenMessage.text}
              </p>
              {tokenMessage.type === "success" && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                  Copy the new token and update INSTAGRAM_ACCESS_TOKEN in Vercel env vars, then redeploy.
                </p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Auto-Post Settings */}
      <Section title="Auto-Post Settings" icon={<Settings size={14} />}>
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Auto-posting is enabled when platform credentials are configured.
            Vendors can post promo cards to WhatsApp Status and Instagram Story directly from their dashboard.
          </p>
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "0.5rem",
            background: "rgba(168,133,247,0.06)", border: "1px solid rgba(168,133,247,0.15)",
          }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> Vendors select a product → choose a card style → click "Post to WhatsApp/Instagram" → the promo card is sent via the platform API. Scheduled posts are processed every 15 minutes via the marketing cron job.
            </p>
          </div>
        </div>
      </Section>

      {/* Promo Post Database Stats */}
      <Section title="Database" icon={<Activity size={14} />}>
        <DatabaseStats />
      </Section>
    </div>
  );
}

// ─── Monitoring Tab ─────────────────────────────────────────────────────────

function MonitoringTab() {
  const [posts, setPosts] = useState<PromoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "posted" | "failed" | "pending">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "whatsapp" | "instagram">("all");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (platformFilter !== "all") params.set("platform", platformFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/promo/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter, platformFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const stats = {
    total: posts.length,
    posted: posts.filter((p) => p.status === "posted").length,
    failed: posts.filter((p) => p.status === "failed").length,
    pending: posts.filter((p) => p.status === "pending").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "0.75rem" }}>
        <StatCard label="Total" value={stats.total} color="var(--text-primary)" />
        <StatCard label="Posted" value={stats.posted} color="#10b981" />
        <StatCard label="Failed" value={stats.failed} color="#ef4444" />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.25rem", border: "1px solid var(--border-subtle)" }}>
          {(["all", "posted", "failed", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                background: filter === s ? "rgba(168,133,247,0.15)" : "transparent",
                color: filter === s ? "var(--glow-purple)" : "var(--text-muted)",
                border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.25rem", border: "1px solid var(--border-subtle)" }}>
          {(["all", "whatsapp", "instagram"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                background: platformFilter === p ? "rgba(168,133,247,0.15)" : "transparent",
                color: platformFilter === p ? "var(--glow-purple)" : "var(--text-muted)",
                border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {p === "all" ? "All Platforms" : p}
            </button>
          ))}
        </div>

        <button
          onClick={fetchPosts}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Posts Table */}
      <Section title="Promo Posts" icon={<Activity size={14} />}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.8125rem" }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            <ImageIcon size={24} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
            <p style={{ fontSize: "0.8125rem" }}>No promo posts found</p>
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={thStyle}>Store</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Platform</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Posted At</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={tdStyle}>{post.store_name || "—"}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {post.product_image && (
                          <img
                            src={post.product_image}
                            alt=""
                            style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.25rem", objectFit: "cover" }}
                          />
                        )}
                        <span style={{ maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.product_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <PlatformBadge platform={post.platform} />
                    </td>
                    <td style={tdStyle}>
                      <StatusDot status={post.status} />
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {post.posted_at ? new Date(post.posted_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Generate Tab ───────────────────────────────────────────────────────────

function GenerateTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Load stores
  useEffect(() => {
    const loadStores = async () => {
      setLoadingStores(true);
      try {
        const res = await fetch("/api/admin/stores?limit=500");
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch { /* ignore */ }
      setLoadingStores(false);
    };
    loadStores();
  }, []);

  // Load products when store is selected
  useEffect(() => {
    if (!selectedStore) { setProducts([]); return; }
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/products?store_id=${selectedStore.id}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch { /* ignore */ }
      setLoadingProducts(false);
    };
    loadProducts();
  }, [selectedStore]);

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Store Selector */}
      <Section title="Select Store" icon={<MessageCircle size={14} />}>
        <div style={{ padding: "0.75rem" }}>
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
              background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)", fontSize: "0.8125rem", outline: "none",
              marginBottom: "0.75rem",
            }}
          />
          {loadingStores ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={16} className="animate-spin" />
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.5rem", maxHeight: "20rem", overflowY: "auto",
            }}>
              {filteredStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => { setSelectedStore(store); setSelectedProduct(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                    background: selectedStore?.id === store.id ? "rgba(168,133,247,0.1)" : "var(--bg-secondary)",
                    border: `1px solid ${selectedStore?.id === store.id ? "rgba(168,133,247,0.3)" : "var(--border-subtle)"}`,
                    color: "var(--text-primary)", cursor: "pointer", textAlign: "left",
                    fontSize: "0.8125rem", transition: "all 0.15s",
                  }}
                >
                  {store.logo_url ? (
                    <img src={store.logo_url} alt="" style={{ width: "1.5rem", height: "1.5rem", borderRadius: "0.25rem" }} />
                  ) : (
                    <div style={{
                      width: "1.5rem", height: "1.5rem", borderRadius: "0.25rem",
                      background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.625rem", fontWeight: 700, color: "var(--text-muted)",
                    }}>
                      {store.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {store.name}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>/{store.slug}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Product Selector */}
      {selectedStore && (
        <Section title={`Products — ${selectedStore.name}`} icon={<ImageIcon size={14} />}>
          <div style={{ padding: "0.75rem" }}>
            {loadingProducts ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                <RefreshCw size={16} className="animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "0.8125rem" }}>No products in this store</p>
              </div>
            ) : (
              <div style={{
                display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.5rem", maxHeight: "24rem", overflowY: "auto",
              }}>
                {products.filter((p) => p.in_stock).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      display: "flex", gap: "0.625rem", padding: "0.625rem", borderRadius: "0.5rem",
                      background: selectedProduct?.id === product.id ? "rgba(168,133,247,0.1)" : "var(--bg-secondary)",
                      border: `1px solid ${selectedProduct?.id === product.id ? "rgba(168,133,247,0.3)" : "var(--border-subtle)"}`,
                      color: "var(--text-primary)", cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt=""
                        style={{ width: "3rem", height: "3rem", borderRadius: "0.375rem", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: "3rem", height: "3rem", borderRadius: "0.375rem",
                        background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <ImageIcon size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                    <div style={{ overflow: "hidden", minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--glow-green)", fontWeight: 600 }}>
                        ₦{product.price.toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Promo Card Generator */}
      {selectedStore && selectedProduct && (
        <Section title="Generate Promo Card" icon={<Wand2 size={14} />}>
          <PromoCardPreview store={selectedStore} product={selectedProduct} />
        </Section>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "0.75rem",
      border: "1px solid var(--border-subtle)", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.875rem 1rem", borderBottom: "1px solid var(--border-subtle)",
      }}>
        {icon && <span style={{ color: "var(--glow-purple)" }}>{icon}</span>}
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.375rem",
      padding: "0.25rem 0.625rem", borderRadius: "1rem",
      background: active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
    }}>
      <div style={{
        width: "0.375rem", height: "0.375rem", borderRadius: "50%",
        background: active ? "#10b981" : "#ef4444",
      }} />
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: active ? "#10b981" : "#ef4444" }}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: "0.875rem 1rem", borderRadius: "0.625rem",
      background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
    }}>
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "1.25rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, { bg: string; color: string; icon: string }> = {
    whatsapp: { bg: "rgba(37,211,102,0.1)", color: "#25d366", icon: "💬" },
    instagram: { bg: "rgba(225,48,108,0.1)", color: "#e1306c", icon: "📸" },
  };
  const c = colors[platform] || { bg: "var(--bg-secondary)", color: "var(--text-muted)", icon: "?" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
      background: c.bg, fontSize: "0.6875rem", fontWeight: 600, color: c.color,
    }}>
      {c.icon} {platform}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { posted: "#10b981", failed: "#ef4444", pending: "#f59e0b" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
      <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: colors[status] || "var(--text-muted)" }} />
      <span style={{ fontSize: "0.75rem", textTransform: "capitalize", color: colors[status] || "var(--text-muted)" }}>{status}</span>
    </div>
  );
}

function PostCard({ post }: { post: PromoPost }) {
  return (
    <div style={{
      padding: "0.75rem", borderRadius: "0.5rem",
      background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
      display: "flex", gap: "0.625rem", alignItems: "center",
    }}>
      {post.product_image && (
        <img src={post.product_image} alt="" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.375rem", objectFit: "cover" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {post.product_name || "Unknown"}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <PlatformBadge platform={post.platform} />
          <StatusDot status={post.status} />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : "—"}
        </p>
      </div>
    </div>
  );
}

function DatabaseStats() {
  const [stats, setStats] = useState<{ promo_posts: number; scheduled_posts: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/promo/config");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: "1rem", textAlign: "center" }}><RefreshCw size={14} className="animate-spin" /></div>;

  return (
    <div style={{ padding: "1rem", display: "flex", gap: "1.5rem" }}>
      <div>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>promo_posts</p>
        <p style={{ fontSize: "1rem", fontWeight: 700 }}>{stats?.promo_posts ?? "—"}</p>
      </div>
      <div>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>scheduled_promo_posts</p>
        <p style={{ fontSize: "1rem", fontWeight: 700 }}>{stats?.scheduled_posts ?? "—"}</p>
      </div>
    </div>
  );
}

function PromoCardPreview({ store, product }: { store: Store; product: Product }) {
  // Inline mini preview — imports PromoCardGenerator modal for full generation
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <div style={{ padding: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1, minWidth: "200px" }}>
        {product.image_url && (
          <img src={product.image_url} alt="" style={{ width: "4rem", height: "4rem", borderRadius: "0.5rem", objectFit: "cover" }} />
        )}
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{product.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--glow-green)" }}>₦{product.price.toLocaleString()}</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Store: {store.name}</p>
        </div>
      </div>
      <button
        onClick={() => setShowGenerator(true)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.625rem 1.25rem", borderRadius: "0.5rem",
          background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
          color: "white", fontSize: "0.8125rem", fontWeight: 700,
          border: "none", cursor: "pointer", minHeight: "44px",
        }}
      >
        <Wand2 size={14} /> Generate Card
      </button>

      {showGenerator && (
        <PromoCardModal
          store={store}
          product={product}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}

// Lazy import to avoid circular dependency
function PromoCardModal({ store, product, onClose }: { store: Store; product: Product; onClose: () => void }) {
  const [Generator, setGenerator] = useState<React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    store: { slug: string; name: string; logo_url?: string; whatsapp_number?: string; instagram_handle?: string };
  }> | null>(null);

  useEffect(() => {
    import("@/components/PromoCardGenerator").then((mod) => {
      setGenerator(() => mod.PromoCardGenerator);
    });
  }, []);

  if (!Generator) return null;

  return (
    <Generator
      isOpen={true}
      onClose={onClose}
      product={product}
      store={{
        slug: store.slug,
        name: store.name,
        logo_url: store.logo_url,
        whatsapp_number: store.whatsapp_number,
        instagram_handle: store.instagram_handle,
      }}
    />
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600,
  fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
};

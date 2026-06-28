"use client";

import { useState, useEffect } from "react";
import {
  Clock, Calendar, Sparkles, Check, RefreshCw, Play, Pause,
  Trash2, Plus, Globe, MessageCircle, Image
} from "lucide-react";

interface AutoPostSchedulerProps {
  storeId: string;
  storeSlug: string;
  storeName: string;
  products: Array<{ id: string; name: string; price: number; image_url?: string }>;
  whatsappConnected: boolean;
  instagramConnected: boolean;
}

interface ScheduledPost {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  platform: "whatsapp" | "instagram" | "both";
  scheduled_at: string;
  status: "pending" | "posted" | "failed";
  created_at: string;
}

export function AutoPostScheduler({
  storeId,
  storeSlug,
  storeName,
  products,
  whatsappConnected,
  instagramConnected,
}: AutoPostSchedulerProps) {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<"whatsapp" | "instagram" | "both">("both");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchScheduledPosts(); }, []);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/promo/scheduled?store_id=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setScheduledPosts(data.posts || []);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduled = async () => {
    if (!selectedProduct || !scheduledDate) return;

    setCreating(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const res = await fetch("/api/promo/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          productId: selectedProduct,
          platform: selectedPlatform,
          scheduledAt,
        }),
      });

      if (res.ok) {
        setShowNewPost(false);
        setSelectedProduct("");
        setScheduledDate("");
        fetchScheduledPosts();
      }
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await fetch(`/api/promo/scheduled?id=${postId}`, { method: "DELETE" });
      fetchScheduledPosts();
    } catch {
      // handle error
    }
  };

  const handlePostNow = async (postId: string) => {
    try {
      await fetch("/api/promo/scheduled/post-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      fetchScheduledPosts();
    } catch {
      // handle error
    }
  };

  const pendingPosts = scheduledPosts.filter((p) => p.status === "pending");
  const postedPosts = scheduledPosts.filter((p) => p.status === "posted");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} style={{ color: "var(--glow-purple)" }} />
            Auto-Post Scheduler
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Schedule promo cards to post automatically
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", borderRadius: "0.5rem",
            background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
            color: "white", fontSize: "0.8125rem", fontWeight: 600,
            border: "none", cursor: "pointer", minHeight: "40px",
          }}
        >
          <Plus size={14} /> Schedule Post
        </button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, var(--glow-purple), var(--glow-cyan))",
          }} />

          <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>
            Schedule New Post
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Product selector */}
            <div>
              <label style={labelStyle}>Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₦{p.price.toLocaleString()}</option>
                ))}
              </select>
            </div>

            {/* Platform selector */}
            <div>
              <label style={labelStyle}>Platform</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[
                  { value: "both" as const, label: "Both", icon: "🌐", disabled: false },
                  { value: "whatsapp" as const, label: "WhatsApp", icon: "💬", disabled: !whatsappConnected },
                  { value: "instagram" as const, label: "Instagram", icon: "📸", disabled: !instagramConnected },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => !opt.disabled && setSelectedPlatform(opt.value)}
                    disabled={opt.disabled}
                    style={{
                      flex: 1, padding: "0.625rem", borderRadius: "0.5rem",
                      border: `1.5px solid ${selectedPlatform === opt.value ? "var(--glow-purple)" : "var(--border-subtle)"}`,
                      background: selectedPlatform === opt.value ? "rgba(168,133,247,0.1)" : "var(--bg-secondary)",
                      color: opt.disabled ? "var(--text-muted)" : selectedPlatform === opt.value ? "var(--glow-purple)" : "var(--text-secondary)",
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                      fontSize: "0.75rem", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                      opacity: opt.disabled ? 0.5 : 1,
                    }}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                    {opt.disabled && <span style={{ fontSize: "0.5rem" }}>⚠️</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleCreateScheduled}
              disabled={!selectedProduct || !scheduledDate || creating}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.75rem", borderRadius: "0.5rem",
                background: selectedProduct && scheduledDate
                  ? "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))"
                  : "var(--bg-secondary)",
                color: selectedProduct && scheduledDate ? "white" : "var(--text-muted)",
                fontSize: "0.875rem", fontWeight: 600,
                border: "none", cursor: selectedProduct && scheduledDate ? "pointer" : "not-allowed",
                minHeight: "48px",
              }}
            >
              {creating ? <RefreshCw size={16} className="animate-spin" /> : <Calendar size={16} />}
              {creating ? "Scheduling..." : "Schedule Post"}
            </button>
          </div>
        </div>
      )}

      {/* Pending Posts */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, var(--glow-amber), var(--glow-red))",
        }} />
        <h4 style={{
          fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <Clock size={14} style={{ color: "var(--glow-amber)" }} />
          Scheduled ({pendingPosts.length})
        </h4>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ height: "3.5rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : pendingPosts.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center" }}>
            <Calendar size={20} style={{ color: "var(--text-muted)", opacity: 0.4, marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No scheduled posts</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pendingPosts.map((post) => (
              <div key={post.id} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem", borderRadius: "0.5rem",
                background: "var(--bg-secondary)",
              }}>
                {post.product_image && (
                  <img
                    src={post.product_image}
                    alt={post.product_name}
                    style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.375rem", objectFit: "cover" }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.product_name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
                    <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                      {new Date(post.scheduled_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                      {new Date(post.scheduled_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span style={{
                      fontSize: "0.5625rem", padding: "0.125rem 0.375rem",
                      borderRadius: "0.25rem", background: "rgba(168,133,247,0.15)", color: "var(--glow-purple)",
                      fontWeight: 600,
                    }}>
                      {post.platform === "both" ? "🌐 Both" : post.platform === "whatsapp" ? "💬 WhatsApp" : "📸 Instagram"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    onClick={() => handlePostNow(post.id)}
                    style={{
                      width: "2rem", height: "2rem", borderRadius: "0.375rem",
                      background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                      color: "var(--glow-green)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Post now"
                  >
                    <Play size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    style={{
                      width: "2rem", height: "2rem", borderRadius: "0.375rem",
                      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                      color: "var(--glow-red)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posted History */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.875rem", padding: "1.25rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, var(--glow-green), var(--glow-cyan))",
        }} />
        <h4 style={{
          fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <Check size={14} style={{ color: "var(--glow-green)" }} />
          Posted ({postedPosts.length})
        </h4>

        {postedPosts.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center" }}>
            <Check size={20} style={{ color: "var(--text-muted)", opacity: 0.4, marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No posts yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {postedPosts.slice(0, 10).map((post) => (
              <div key={post.id} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                background: "var(--bg-secondary)", opacity: 0.7,
              }}>
                <Check size={12} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.product_name}
                  </p>
                </div>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                  {new Date(post.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
  marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.03em",
};

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
  background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)", fontSize: "0.8125rem",
  outline: "none", minHeight: "44px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
  background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)", fontSize: "0.8125rem",
  outline: "none", minHeight: "44px",
};

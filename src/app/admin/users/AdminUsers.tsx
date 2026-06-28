"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { getPlanName } from "@/lib/subscription";
import { SubscriptionPlan } from "@/types";
import {
  Users as UsersIcon, Search, RefreshCw, Mail, Clock, Store,
  ShoppingCart, ChevronDown, ExternalLink, User
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface UserWithStores {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_sign_in: string | null;
  stores: { id: string; name: string; slug: string; plan: SubscriptionPlan; created_at: string; order_count: number; whatsapp_number: string | null; instagram_handle: string | null }[];
  total_orders: number;
}

export function AdminUsers() {
  const { error: showError } = useAlert();
  const [users, setUsers] = useState<UserWithStores[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmall = useMediaQuery("(max-width: 480px)");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=50`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      showError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  return (
    <div style={{ padding: "clamp(1rem,3vw,1.5rem)", maxWidth: "72rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UsersIcon size={20} style={{ color: "var(--glow-cyan)" }} />
            User Management
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{total} registered users</p>
        </div>
        <button onClick={fetchUsers} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
          fontSize: "0.8125rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
          borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
        </div>
      ) : users.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No users found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {users.map((u) => {
            const isExpanded = expandedId === u.id;
            return (
              <div key={u.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.625rem", overflow: "hidden",
              }}>
                <div
                  style={{
                    display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto auto auto",
                    alignItems: "center", gap: "1rem", padding: "0.875rem 1rem",
                    cursor: "pointer", minHeight: "44px",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <div style={{
                      width: "2rem", height: "2rem", borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <User size={12} style={{ color: "white" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.name || "Unnamed"}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: isMobile ? "none" : "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Store size={12} /> {u.stores.length}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: isMobile ? "none" : "flex", alignItems: "center", gap: "0.25rem" }}>
                    <ShoppingCart size={12} /> {u.total_orders}
                  </span>
                  <ChevronDown size={14} style={{
                    color: "var(--text-muted)", transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }} />
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Joined</p>
                        <p style={{ fontSize: "0.8125rem" }}>{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Last Sign In</p>
                        <p style={{ fontSize: "0.8125rem" }}>{u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "Never"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>User ID</p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{u.id.slice(0, 12)}...</p>
                      </div>
                    </div>

                    {u.stores.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Stores</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {u.stores.map((store) => (
                            <div key={store.id} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "0.5rem 0.75rem", background: "var(--bg-primary)",
                              borderRadius: "0.375rem", border: "1px solid var(--border-subtle)",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{store.name}</span>
                                <span style={{
                                  padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.625rem",
                                  fontWeight: 600, color: "var(--glow-purple)", background: "rgba(168,133,247,0.1)",
                                }}>{getPlanName(store.plan)}</span>
                                {store.whatsapp_number && (
                                  <span style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.375rem", borderRadius: "1rem", background: "rgba(37,211,102,0.1)", color: "#25d366", border: "1px solid rgba(37,211,102,0.2)" }}>WA</span>
                                )}
                                {store.instagram_handle && (
                                  <span style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.375rem", borderRadius: "1rem", background: "rgba(225,48,108,0.1)", color: "#e1306c", border: "1px solid rgba(225,48,108,0.2)" }}>IG</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{store.order_count} orders</span>
                                <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer"
                                  style={{ color: "var(--glow-purple)", display: "flex" }}>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > 50 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: page === 1 ? 0.5 : 1, minHeight: "44px" }}>
            Previous
          </button>
          <span style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 50}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: users.length < 50 ? 0.5 : 1, minHeight: "44px" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

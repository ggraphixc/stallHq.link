"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  Activity, RefreshCw, Server, Database, Mail, CreditCard,
  Key, Globe, CheckCircle2, XCircle, Clock, Zap, HardDrive,
  Shield, Cpu, MemoryStick
} from "lucide-react";

interface SystemData {
  overview: Record<string, number>;
  environment: Record<string, string | boolean | undefined>;
}

export function AdminSystem() {
  const { error: showError } = useAlert();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
      </div>
    );
  }

  const env = data?.environment || {};

  return (
    <div style={{ padding: "1.5rem", maxWidth: "72rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} style={{ color: "var(--glow-red)" }} />
            System Monitor
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Platform health and configuration
            {lastChecked && <span> · Last checked {lastChecked.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={fetchData} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
          fontSize: "0.8125rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
          borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Environment Variables Status */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Key size={16} style={{ color: "var(--glow-amber)" }} />
          Environment Configuration
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "0.75rem" }}>
          {[
            { label: "Node Environment", key: "nodeEnv", icon: <Server size={14} />, ok: env.nodeEnv === "production", detail: String(env.nodeEnv) },
            { label: "App URL", key: "appUrl", icon: <Globe size={14} />, ok: !!env.appUrl, detail: String(env.appUrl) },
            { label: "Supabase URL", key: "supabaseUrl", icon: <Database size={14} />, ok: !!env.supabaseUrl, detail: String(env.supabaseUrl) },
            { label: "Service Role Key", key: "hasServiceRoleKey", icon: <Shield size={14} />, ok: !!env.hasServiceRoleKey },
            { label: "Brevo API Key", key: "hasBrevoKey", icon: <Mail size={14} />, ok: !!env.hasBrevoKey },
            { label: "Paystack Secret Key", key: "hasPaystackKey", icon: <CreditCard size={14} />, ok: !!env.hasPaystackKey },
            { label: "Cron Secret", key: "hasCronSecret", icon: <Key size={14} />, ok: !!env.hasCronSecret },
          ].map(({ label, icon, ok, detail }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem",
              border: `1px solid ${ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: ok ? "var(--glow-green)" : "var(--glow-red)" }}>{icon}</span>
                <span style={{ fontSize: "0.8125rem" }}>{label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {detail && <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</span>}
                {ok ? <CheckCircle2 size={14} style={{ color: "var(--glow-green)" }} /> : <XCircle size={14} style={{ color: "var(--glow-red)" }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Metrics */}
      {data?.overview && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={16} style={{ color: "var(--glow-cyan)" }} />
            Platform Metrics
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "0.5rem" }}>
            {Object.entries(data.overview).map(([key, value]) => (
              <div key={key} style={{
                padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
              }}>
                <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--glow-purple)" }}>
                  {typeof value === "number" ? value.toLocaleString() : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Endpoints Status */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1.25rem",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HardDrive size={16} style={{ color: "var(--glow-green)" }} />
          API Endpoints
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "0.5rem" }}>
          {[
            { path: "/api/auth/login", method: "POST", desc: "User login" },
            { path: "/api/auth/signup", method: "POST", desc: "User registration" },
            { path: "/api/stores", method: "GET/POST/PATCH", desc: "Store CRUD" },
            { path: "/api/products", method: "GET/POST", desc: "Product management" },
            { path: "/api/orders", method: "GET/PATCH", desc: "Order management" },
            { path: "/api/payments/initialize", method: "POST", desc: "Paystack checkout" },
            { path: "/api/webhooks/paystack", method: "POST", desc: "Payment webhook" },
            { path: "/api/cron/check-expiry", method: "GET", desc: "Expiry reminders" },
            { path: "/api/admin/stores", method: "GET", desc: "Admin: all stores" },
            { path: "/api/admin/users", method: "GET", desc: "Admin: all users" },
            { path: "/api/admin/orders", method: "GET/PATCH", desc: "Admin: all orders" },
            { path: "/api/admin/system", method: "GET", desc: "System health" },
          ].map(({ path, method, desc }) => (
            <div key={path} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.5rem 0.75rem", background: "var(--bg-primary)", borderRadius: "0.375rem",
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <span style={{
                  padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.5625rem",
                  fontWeight: 700, color: "var(--glow-cyan)", background: "rgba(6,182,212,0.1)",
                  fontFamily: "monospace",
                }}>{method}</span>
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path}</span>
              </div>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: "0.5rem" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

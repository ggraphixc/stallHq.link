"use client";

import { useState, useEffect, useRef } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Settings, Save, Loader2, Shield, Mail, CreditCard, Globe, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Eye, EyeOff, Palette, Upload, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Setting {
  key: string; value: any; updated_at: string;
}

const DEFAULT_SETTINGS: Record<string, any> = {
  app_name: "StallHq", app_url: process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app",
  brevo_sender_email: process.env.BREVO_SENDER_EMAIL || "", brevo_sender_name: "StallHq",
  maintenance_mode: false, allow_signup: true,
  max_free_products: 10, trial_days: 5, support_email: "",
  ai_enabled: false, ai_provider: "openrouter", ai_model: "", ai_api_key: "", ai_base_url: "",
  logo_url: "", favicon_url: "", platform_name: "",
};

export default function AdminSettings() {
  const { error: showError, success: showSuccess } = useAlert();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showAIKey, setShowAIKey] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data: Setting[] = await res.json();
        const map: Record<string, any> = { ...DEFAULT_SETTINGS };
        data.forEach(s => { map[s.key] = s.value; });
        setSettings(map);
      }
    } catch { showError("Failed to load settings"); }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showSuccess("Settings saved");
    } catch { showError("Failed to save settings"); }
    setSaving(false);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "email", label: "Email", icon: Mail },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings size={20} style={{ color: "var(--glow-purple)" }} /> Platform Settings
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Configure platform-wide settings</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem", opacity: saving ? 0.5 : 1 }}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Tabs - Horizontal scroll on mobile */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "0.25rem", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === tab.id ? "rgba(168,133,247,0.1)" : "transparent", color: activeTab === tab.id ? "var(--glow-purple)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0, minWidth: "fit-content" }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "clamp(1rem,3vw,1.5rem)", overflow: "hidden", wordBreak: "break-word" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
          </div>
        ) : activeTab === "general" ? (
          <GeneralTab settings={settings} updateSetting={updateSetting} />
        ) : activeTab === "branding" ? (
          <BrandingTab settings={settings} updateSetting={updateSetting} />
        ) : activeTab === "email" ? (
          <EmailTab settings={settings} updateSetting={updateSetting} />
        ) : activeTab === "payments" ? (
          <PaymentsTab />
        ) : activeTab === "ai" ? (
          <AITab settings={settings} updateSetting={updateSetting} showAIKey={showAIKey} setShowAIKey={setShowAIKey} />
        ) : (
          <SecurityTab settings={settings} updateSetting={updateSetting} />
        )}
      </div>
    </div>
  );
}

/* ── General Tab ────────────────────────────────── */
function GeneralTab({ settings, updateSetting }: { settings: Record<string, any>; updateSetting: (key: string, value: any) => void }) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>General</h3>
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>App Name</label>
        <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.app_name || ""} onChange={(e) => updateSetting("app_name", e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>App URL</label>
        <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.app_url || ""} onChange={(e) => updateSetting("app_url", e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Support Email</label>
        <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Trial Days</label>
          <input className="ambient-input" type="number" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.trial_days || 5} onChange={(e) => updateSetting("trial_days", parseInt(e.target.value) || 5)} />
        </div>
        <div>
          <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Max Free Products</label>
          <input className="ambient-input" type="number" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.max_free_products || 10} onChange={(e) => updateSetting("max_free_products", parseInt(e.target.value) || 10)} />
        </div>
      </div>
    </div>
  );
}

/* ── Branding Tab ────────────────────────────────── */
function BrandingTab({ settings, updateSetting }: { settings: Record<string, any>; updateSetting: (key: string, value: any) => void }) {
  const { error: showError, success: showSuccess } = useAlert();
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: "logo" | "favicon") => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"];
    if (!allowedTypes.includes(file.type)) {
      showError("Invalid file type. Use JPEG, PNG, WebP, GIF, or ICO.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError("File too large. Maximum 2MB.");
      return;
    }
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "products");
      formData.append("folder", `branding/${type}`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      updateSetting(type === "logo" ? "logo_url" : "favicon_url", data.url);
      showSuccess(`${type === "logo" ? "Logo" : "Favicon"} uploaded`);
    } catch {
      showError(`Failed to upload ${type}`);
    }
    setUploading(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Palette size={16} style={{ color: "var(--glow-purple)" }} /> Branding
      </h3>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Configure platform name, logo, and favicon displayed across the platform.
      </p>

      {/* Platform Name */}
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Platform Name</label>
        <input
          className="ambient-input"
          style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }}
          placeholder="stallHq"
          value={settings.platform_name || ""}
          onChange={(e) => updateSetting("platform_name", e.target.value)}
        />
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Shown in headers, browser tabs, emails, and all platform pages.
        </p>
      </div>

      {/* Logo Upload */}
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Logo</label>
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={uploading === "logo"}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "1.5rem 1rem", fontSize: "0.8125rem",
            background: "var(--bg-primary)", border: "2px dashed var(--border-subtle)",
            borderRadius: "0.5rem", color: "var(--text-muted)", cursor: uploading === "logo" ? "wait" : "pointer",
          }}
        >
          {uploading === "logo" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
          {uploading === "logo" ? "Uploading..." : settings.logo_url ? "Replace" : "Upload Logo"}
        </button>
        <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "logo"); e.target.value = ""; }} />
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>200x200px or larger. PNG/SVG with transparency.</p>
        {settings.logo_url && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src={settings.logo_url} alt="Logo" style={{ maxHeight: "2rem", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{settings.logo_url}</div>
            <button onClick={() => updateSetting("logo_url", "")} style={{ width: "1.5rem", height: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", border: "none", background: "rgba(239,68,68,0.1)", color: "var(--glow-red)", cursor: "pointer", flexShrink: 0 }}><X size={10} /></button>
          </div>
        )}
      </div>

      {/* Favicon Upload */}
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Favicon</label>
        <button
          type="button"
          onClick={() => faviconInputRef.current?.click()}
          disabled={uploading === "favicon"}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "1.5rem 1rem", fontSize: "0.8125rem",
            background: "var(--bg-primary)", border: "2px dashed var(--border-subtle)",
            borderRadius: "0.5rem", color: "var(--text-muted)", cursor: uploading === "favicon" ? "wait" : "pointer",
          }}
        >
          {uploading === "favicon" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
          {uploading === "favicon" ? "Uploading..." : settings.favicon_url ? "Replace" : "Upload Favicon"}
        </button>
        <input ref={faviconInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "favicon"); e.target.value = ""; }} />
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>32x32 or 64x64 ICO/PNG.</p>
        {settings.favicon_url && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src={settings.favicon_url} alt="Favicon" style={{ width: "1.25rem", height: "1.25rem", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{settings.favicon_url}</div>
            <button onClick={() => updateSetting("favicon_url", "")} style={{ width: "1.5rem", height: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", border: "none", background: "rgba(239,68,68,0.1)", color: "var(--glow-red)", cursor: "pointer", flexShrink: 0 }}><X size={10} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Email Tab ────────────────────────────────── */
function EmailTab({ settings, updateSetting }: { settings: Record<string, any>; updateSetting: (key: string, value: any) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Mail size={16} style={{ color: "var(--glow-purple)" }} /> Email (Brevo)
      </h3>
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Sender Email</label>
        <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.brevo_sender_email || ""} onChange={(e) => updateSetting("brevo_sender_email", e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Sender Name</label>
        <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.brevo_sender_name || ""} onChange={(e) => updateSetting("brevo_sender_name", e.target.value)} />
      </div>
    </div>
  );
}

/* ── Payments Tab ────────────────────────────────── */
function PaymentsTab() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CreditCard size={16} style={{ color: "var(--glow-purple)" }} /> Payments (Paystack)
      </h3>
      <div style={{ padding: "0.875rem", background: "rgba(168,133,247,0.05)", border: "1px solid rgba(168,133,247,0.15)", borderRadius: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Paystack API keys are configured via environment variables.</p>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Set <code style={{ padding: "0.125rem 0.25rem", background: "var(--bg-primary)", borderRadius: "0.25rem", fontSize: "0.625rem" }}>PAYSTACK_SECRET_KEY</code> in Vercel env vars.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "0.5rem" }}>
        {[
          { label: "Monthly", price: "₦3,500" },
          { label: "Quarterly", price: "₦7,500" },
          { label: "Annual", price: "₦12,000" },
        ].map((plan) => (
          <div key={plan.label} style={{ padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>{plan.label}</p>
            <p style={{ fontSize: "1rem", fontWeight: 700 }}>{plan.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AI Tab ────────────────────────────────── */
function AITab({ settings, updateSetting, showAIKey, setShowAIKey }: { settings: Record<string, any>; updateSetting: (key: string, value: any) => void; showAIKey: boolean; setShowAIKey: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Sparkles size={16} style={{ color: "var(--glow-purple)" }} /> AI Provider
      </h3>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
        <input type="checkbox" checked={!!settings.ai_enabled} onChange={(e) => updateSetting("ai_enabled", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Enable AI Features</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Product description generation</p>
        </div>
      </label>
      {settings.ai_enabled && (
        <>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Provider</label>
            <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={settings.ai_provider || "openrouter"} onChange={(e) => updateSetting("ai_provider", e.target.value)}>
              <option value="openrouter">OpenRouter</option>
              <option value="opencodezen">OpenCode Zen</option>
              <option value="openai">OpenAI</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Model</label>
            <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.ai_model || ""} onChange={(e) => updateSetting("ai_model", e.target.value)} placeholder={settings.ai_provider === "openrouter" ? "google/gemini-2.0-flash-exp:free" : settings.ai_provider === "opencodezen" ? "mimo-v2.5-free" : "model-name"} />
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>API Key</label>
            <div style={{ position: "relative" }}>
              <input className="ambient-input" type={showAIKey ? "text" : "password"} style={{ width: "100%", padding: "0.625rem 0.875rem", paddingRight: "2.5rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.ai_api_key || ""} onChange={(e) => updateSetting("ai_api_key", e.target.value)} placeholder="sk-..." />
              <button type="button" onClick={() => setShowAIKey(!showAIKey)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem" }}>
                {showAIKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {(settings.ai_provider === "custom" || settings.ai_provider === "opencodezen") && (
            <div>
              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Base URL</label>
              <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={settings.ai_base_url || ""} onChange={(e) => updateSetting("ai_base_url", e.target.value)} placeholder={settings.ai_provider === "opencodezen" ? "https://opencode.ai/zen/v1" : "https://api.example.com/v1"} />
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>/chat/completions appended automatically</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Security Tab ────────────────────────────────── */
function SecurityTab({ settings, updateSetting }: { settings: Record<string, any>; updateSetting: (key: string, value: any) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Shield size={16} style={{ color: "var(--glow-purple)" }} /> Security
      </h3>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
        <input type="checkbox" checked={!!settings.maintenance_mode} onChange={(e) => updateSetting("maintenance_mode", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Maintenance Mode</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Disable public access</p>
        </div>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
        <input type="checkbox" checked={settings.allow_signup !== false} onChange={(e) => updateSetting("allow_signup", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Allow Signups</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Allow new vendor accounts</p>
        </div>
      </label>
      {settings.maintenance_mode && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "0.5rem" }}>
          <AlertTriangle size={14} style={{ color: "#f97316" }} />
          <p style={{ fontSize: "0.75rem", color: "#f97316" }}>Maintenance mode is ON.</p>
        </div>
      )}
    </div>
  );
}

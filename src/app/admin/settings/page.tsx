"use client";

import { useState, useEffect, useRef } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Settings, Save, Loader2, Shield, Mail, CreditCard, Globe, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Eye, EyeOff, Palette, Upload, X } from "lucide-react";

interface Setting {
  key: string; value: any; updated_at: string;
}

const DEFAULT_SETTINGS: Record<string, any> = {
  app_name: "StallHq", app_url: process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app",
  brevo_sender_email: process.env.BREVO_SENDER_EMAIL || "", brevo_sender_name: "StallHq",
  maintenance_mode: false, allow_signup: true,
  max_free_products: 10, trial_days: 5, support_email: "",
  ai_enabled: false, ai_provider: "openrouter", ai_model: "", ai_api_key: "", ai_base_url: "",
  logo_url: "", favicon_url: "",
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
    <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings size={24} style={{ color: "var(--glow-purple)" }} /> Platform Settings
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Configure platform-wide settings</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1rem", fontSize: "0.8125rem", opacity: saving ? 0.5 : 1 }}>
          {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "1rem" }} className="admin-grid-2col">
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === tab.id ? "rgba(168,133,247,0.1)" : "transparent", color: activeTab === tab.id ? "var(--glow-purple)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.8125rem", textAlign: "left", width: "100%" }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
            </div>
          ) : activeTab === "general" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>General</h3>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>App Name</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.app_name || ""} onChange={(e) => updateSetting("app_name", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>App URL</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.app_url || ""} onChange={(e) => updateSetting("app_url", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Support Email</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Trial Days</label>
                  <input className="ambient-input" type="number" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.trial_days || 5} onChange={(e) => updateSetting("trial_days", parseInt(e.target.value) || 5)} />
                </div>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Max Free Products</label>
                  <input className="ambient-input" type="number" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.max_free_products || 10} onChange={(e) => updateSetting("max_free_products", parseInt(e.target.value) || 10)} />
                </div>
              </div>
            </div>
          ) : activeTab === "branding" ? (
            <BrandingTab settings={settings} updateSetting={updateSetting} />
          ) : activeTab === "email" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Email (Brevo)</h3>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Sender Email</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.brevo_sender_email || ""} onChange={(e) => updateSetting("brevo_sender_email", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Sender Name</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} value={settings.brevo_sender_name || ""} onChange={(e) => updateSetting("brevo_sender_name", e.target.value)} />
              </div>
            </div>
          ) : activeTab === "payments" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Payments (Paystack)</h3>
              <div style={{ padding: "1rem", background: "rgba(168,133,247,0.05)", border: "1px solid rgba(168,133,247,0.15)", borderRadius: "0.5rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Paystack API keys are configured via environment variables for security.</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>Set <code style={{ padding: "0.125rem 0.25rem", background: "var(--bg-primary)", borderRadius: "0.25rem" }}>PAYSTACK_SECRET_KEY</code> and <code style={{ padding: "0.125rem 0.25rem", background: "var(--bg-primary)", borderRadius: "0.25rem" }}>NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> in your Vercel environment variables.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ padding: "1rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Monthly</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>₦3,500</p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Quarterly</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>₦7,500</p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Annual</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>₦12,000</p>
                </div>
              </div>
            </div>
          ) : activeTab === "ai" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--glow-purple)" }} /> AI Provider Configuration
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Configure AI provider for product description generation and other smart features.
              </p>

              {/* Enable/Disable */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                <input type="checkbox" checked={!!settings.ai_enabled} onChange={(e) => updateSetting("ai_enabled", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Enable AI Features</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Turn on AI-powered product description generation</p>
                </div>
              </label>

              {settings.ai_enabled && (
                <>
                  {/* Provider */}
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Provider</label>
                    <select
                      className="ambient-input"
                      style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)" }}
                      value={settings.ai_provider || "openrouter"}
                      onChange={(e) => updateSetting("ai_provider", e.target.value)}
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="opencodezen">OpenCode Zen</option>
                      <option value="openai">OpenAI</option>
                      <option value="custom">Custom (OpenAI-compatible)</option>
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Model</label>
                    <input
                      className="ambient-input"
                      style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }}
                      value={settings.ai_model || ""}
                      onChange={(e) => updateSetting("ai_model", e.target.value)}
                      placeholder={
                        settings.ai_provider === "openrouter" ? "e.g. google/gemini-2.0-flash-exp:free" :
                        settings.ai_provider === "opencodezen" ? "e.g. gemini-2.0-flash" :
                        settings.ai_provider === "openai" ? "e.g. gpt-4o-mini" :
                        "e.g. model-name"
                      }
                    />
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {settings.ai_provider === "openrouter" && "Browse free models at openrouter.ai/models?fmt=free"}
                      {settings.ai_provider === "opencodezen" && "Use any available model from OpenCode Zen"}
                      {settings.ai_provider === "openai" && "e.g. gpt-4o-mini, gpt-4o"}
                      {settings.ai_provider === "custom" && "Enter the model name for your API"}
                    </p>
                  </div>

                  {/* API Key */}
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>API Key</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="ambient-input"
                        type={showAIKey ? "text" : "password"}
                        style={{ width: "100%", padding: "0.625rem 0.875rem", paddingRight: "2.5rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }}
                        value={settings.ai_api_key || ""}
                        onChange={(e) => updateSetting("ai_api_key", e.target.value)}
                        placeholder="sk-... or your API key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAIKey(!showAIKey)}
                        style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem" }}
                      >
                        {showAIKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {settings.ai_provider === "openrouter" && "Get your key at openrouter.ai/keys"}
                      {settings.ai_provider === "opencodezen" && "Enter your OpenCode Zen API key"}
                      {settings.ai_provider === "openai" && "Enter your OpenAI API key"}
                      {settings.ai_provider === "custom" && "Enter your API key"}
                    </p>
                  </div>

                  {/* Base URL (for custom provider) */}
                  {(settings.ai_provider === "custom" || settings.ai_provider === "opencodezen") && (
                    <div>
                      <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Base URL</label>
                      <input
                        className="ambient-input"
                        style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }}
                        value={settings.ai_base_url || ""}
                        onChange={(e) => updateSetting("ai_base_url", e.target.value)}
                        placeholder={
                          settings.ai_provider === "opencodezen" ? "https://api.opencodezen.com/v1" :
                          "https://api.example.com/v1"
                        }
                      />
                    </div>
                  )}

                  {/* Provider Info */}
                  <div style={{ padding: "1rem", background: "rgba(168,133,247,0.05)", border: "1px solid rgba(168,133,247,0.15)", borderRadius: "0.5rem" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.5rem" }}>
                      {settings.ai_provider === "openrouter" && "OpenRouter"}
                      {settings.ai_provider === "opencodezen" && "OpenCode Zen"}
                      {settings.ai_provider === "openai" && "OpenAI"}
                      {settings.ai_provider === "custom" && "Custom Provider"}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {settings.ai_provider === "openrouter" && "Access free and paid AI models. Many free models support image input (multimodal). No credit card required for free models."}
                      {settings.ai_provider === "opencodezen" && "OpenCode Zen provides access to various AI models. Configure your base URL and API key above."}
                      {settings.ai_provider === "openai" && "Direct OpenAI API access. Requires a paid API key."}
                      {settings.ai_provider === "custom" && "Use any OpenAI-compatible API endpoint. Configure the base URL and API key above."}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Security</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!settings.maintenance_mode} onChange={(e) => updateSetting("maintenance_mode", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Maintenance Mode</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Temporarily disable public access to the platform</p>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                  <input type="checkbox" checked={settings.allow_signup !== false} onChange={(e) => updateSetting("allow_signup", e.target.checked)} style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }} />
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Allow New Signups</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Allow new vendors to create accounts</p>
                  </div>
                </label>
              </div>
              {settings.maintenance_mode && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "0.5rem" }}>
                  <AlertTriangle size={16} style={{ color: "#f97316" }} />
                  <p style={{ fontSize: "0.75rem", color: "#f97316" }}>Maintenance mode is ON. Public pages are disabled.</p>
                </div>
              )}
            </div>
          )}
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

  const FileUpload = ({ label, type, accept, desc }: { label: string; type: "logo" | "favicon"; accept: string; desc: string }) => {
    const url = settings[type === "logo" ? "logo_url" : "favicon_url"];
    const inputRef = type === "logo" ? logoInputRef : faviconInputRef;
    return (
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading === type}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "2rem 1rem", fontSize: "0.8125rem",
              background: "var(--bg-primary)", border: "2px dashed var(--border-subtle)",
              borderRadius: "0.5rem", color: "var(--text-muted)", cursor: uploading === type ? "wait" : "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseOver={(e) => { if (uploading !== type) e.currentTarget.style.borderColor = "rgba(168,133,247,0.4)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
          >
            {uploading === type ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Upload size={16} />
            )}
            {uploading === type ? "Uploading..." : url ? "Replace file" : "Click to upload"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, type);
              e.target.value = "";
            }}
          />
        </div>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{desc}</p>

        {/* Preview */}
        {url && (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src={url}
              alt={`${label} preview`}
              style={type === "logo" ? { maxHeight: "2.5rem", objectFit: "contain" } : { width: "1.5rem", height: "1.5rem", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting(type === "logo" ? "logo_url" : "favicon_url", "")}
              style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "rgba(239,68,68,0.1)", color: "var(--glow-red)", cursor: "pointer", flexShrink: 0 }}
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Palette size={18} style={{ color: "var(--glow-purple)" }} /> Branding
      </h3>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
        Upload logo and favicon displayed across the platform.
      </p>

      <FileUpload
        label="Logo"
        type="logo"
        accept="image/jpeg,image/png,image/webp,image/gif"
        desc="Recommended: 200x200px or larger. PNG/SVG with transparency works best."
      />

      <FileUpload
        label="Favicon"
        type="favicon"
        accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon"
        desc="Recommended: 32x32 or 64x64 ICO/PNG."
      />

      <div style={{ padding: "1rem", background: "rgba(168,133,247,0.05)", border: "1px solid rgba(168,133,247,0.15)", borderRadius: "0.5rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          Logo and favicon are uploaded to Supabase storage and applied site-wide in headers, emails, and browser tabs.
        </p>
      </div>
    </div>
  );
}

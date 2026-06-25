"use client";

import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Store, StoreHours } from "@/types";
import { X, Loader2, Camera, Instagram, Trash2 } from "lucide-react";
import { StoreHoursManager } from "./StoreHoursManager";

interface StoreSettingsProps {
  store: Store;
  onClose: () => void;
  onSaved: (store: Store) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--text-muted)",
  marginTop: "0.25rem",
};

const uploadBox: React.CSSProperties = {
  position: "relative",
  width: "100%",
  borderRadius: "0.75rem",
  border: "1px dashed var(--border-subtle)",
  background: "var(--bg-primary)",
  cursor: "pointer",
  overflow: "hidden",
  transition: "border-color 0.2s",
};

async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  if (file.size < 200_000) return file;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function StoreSettings({ store, onClose, onSaved }: StoreSettingsProps) {
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess, confirm } = useAlert();
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number);
  const [instagramHandle, setInstagramHandle] = useState(store.instagram_handle || "");
  const [email, setEmail] = useState(store.email || "");
  const [description, setDescription] = useState(store.description || "");
  const [storeHours, setStoreHours] = useState<StoreHours | null>(store.store_hours || null);
  const [logoUrl, setLogoUrl] = useState(store.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(store.low_stock_threshold ?? 5);
  const [stockAlertsEnabled, setStockAlertsEnabled] = useState(store.stock_alerts_enabled ?? true);
  const [deletingStore, setDeletingStore] = useState(false);

  const handleImageUpload = async (file: File, type: "logo" | "banner") => {
    const setUpload = type === "logo" ? setUploadingLogo : setUploadingBanner;
    const setUrl = type === "logo" ? setLogoUrl : setBannerUrl;
    setUpload(true);
    try {
      const blob = await compressImage(file, type === "banner" ? 1600 : 400, 0.85);
      const formData = new FormData();
      formData.append("file", blob, file.name);
      formData.append("folder", `stores/${store.id}/${type}`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUrl(data.url);
    } catch {
      showError(`Failed to upload ${type}`);
    } finally {
      setUpload(false);
    }
  };

  const handleDeleteStore = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${store.name}"?\n\nThis will permanently delete:\n- Your store and all products\n- All orders and analytics\n- All reviews and support tickets\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm("This is your last chance. Click OK to permanently delete your store and all its data.");
    if (!doubleConfirm) return;

    setDeletingStore(true);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Failed to delete store");
        return;
      }

      showSuccess("Store deleted. Redirecting...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch {
      showError("Network error. Please try again.");
    } finally {
      setDeletingStore(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, whatsapp_number: whatsappNumber,
          instagram_handle: instagramHandle || null,
          email: email || undefined, description: description || undefined,
          store_hours: storeHours,
          logo_url: logoUrl || null, banner_url: bannerUrl || null,
          low_stock_threshold: lowStockThreshold,
          stock_alerts_enabled: stockAlertsEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update store");
      onSaved(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Store Settings</h2>
          <button onClick={onClose} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Logo Upload */}
          <div>
            <label style={labelStyle}>Store Logo</label>
            <label style={{ ...uploadBox, height: "6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "logo"); }} />
              {uploadingLogo ? (
                <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, borderRadius: "0.75rem" }} />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <Camera size={20} style={{ margin: "0 auto 0.25rem" }} />
                  <p style={{ fontSize: "0.75rem" }}>Upload logo</p>
                </div>
              )}
            </label>
            <p style={hintStyle}>Square recommended. Shown on store card.</p>
          </div>

          {/* Banner Upload */}
          <div>
            <label style={labelStyle}>Store Banner</label>
            <label style={{ ...uploadBox, height: "8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "banner"); }} />
              {uploadingBanner ? (
                <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
              ) : bannerUrl ? (
                <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, borderRadius: "0.75rem" }} />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <Camera size={20} style={{ margin: "0 auto 0.25rem" }} />
                  <p style={{ fontSize: "0.75rem" }}>Upload banner</p>
                </div>
              )}
            </label>
            <p style={hintStyle}>Wide image shown at top of your store page.</p>
          </div>

          <div>
            <label style={labelStyle}>Store Name</label>
            <input type="text" className="ambient-input" style={inputStyle} placeholder="My Awesome Store" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>Store URL</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ padding: "0.625rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                stallhq.link/
              </span>
              <input type="text" className="ambient-input" style={{ ...inputStyle, borderRadius: "0 0.5rem 0.5rem 0" }} placeholder="my-store" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>WhatsApp Number</label>
            <input type="tel" className="ambient-input" style={inputStyle} placeholder="+234 800 000 0000" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            <p style={hintStyle}>Customers will chat with you on this number</p>
          </div>

          <div>
            <label style={labelStyle}>Instagram Handle <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ padding: "0.625rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Instagram size={12} />
                <span>@</span>
              </span>
              <input type="text" className="ambient-input" style={{ ...inputStyle, borderRadius: "0 0.5rem 0.5rem 0" }} placeholder="your_store" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
            </div>
            <p style={hintStyle}>Customers can also reach you on Instagram</p>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <input type="email" className="ambient-input" style={inputStyle} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p style={hintStyle}>Receive email alerts when orders are placed</p>
          </div>

          <div>
            <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <textarea className="ambient-input" style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="What do you sell?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <StoreHoursManager hours={storeHours} onChange={setStoreHours} />
          </div>

          {/* Inventory Alerts */}
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={stockAlertsEnabled}
                onChange={(e) => setStockAlertsEnabled(e.target.checked)}
                style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }}
              />
              Enable Low Stock Alerts
            </label>
            <p style={hintStyle}>Get email alerts when products are running low</p>
            {stockAlertsEnabled && (
              <div style={{ marginTop: "0.5rem" }}>
                <label style={labelStyle}>Alert when stock reaches</label>
                <input
                  type="number"
                  className="ambient-input"
                  style={inputStyle}
                  min={1}
                  max={100}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <p style={hintStyle}>Email sent when any product&apos;s stock drops to this level</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-button"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
        </form>

        {/* Delete Store */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "1rem", paddingTop: "1rem" }}>
          <button
            type="button"
            onClick={handleDeleteStore}
            disabled={deletingStore}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(239,68,68,0.3)",
              background: deletingStore ? "rgba(239,68,68,0.03)" : "rgba(239,68,68,0.08)",
              color: "var(--glow-red)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: deletingStore ? "not-allowed" : "pointer",
              width: "100%",
              justifyContent: "center",
              minHeight: "44px",
              opacity: deletingStore ? 0.6 : 1,
            }}
          >
            <Trash2 size={14} />
            {deletingStore ? "Deleting Store..." : "Delete Store & Account"}
          </button>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
            This will permanently delete your store, products, orders, and account.
          </p>
        </div>
      </div>
    </div>
  );
}

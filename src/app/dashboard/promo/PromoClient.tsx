"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { AutoPostScheduler } from "@/components/AutoPostScheduler";
import { PromoCardGenerator } from "@/components/PromoCardGenerator";

interface PromoClientProps {
  store: {
    id: string;
    slug: string;
    name: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    image_url?: string;
  }>;
}

export function PromoClient({ store, products }: PromoClientProps) {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [checkingChannels, setCheckingChannels] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || "");
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    checkChannels();
  }, []);

  const checkChannels = async () => {
    setCheckingChannels(true);
    try {
      const res = await fetch(`/api/store/channels?store_id=${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappConnected(!!data.whatsapp);
        setInstagramConnected(!!data.instagram);
      }
    } catch {
      // ignore
    }
    setCheckingChannels(false);
  };

  const selected = products.find((p) => p.id === selectedProduct);

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={20} style={{ color: "var(--glow-purple)" }} /> Promo Cards
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Create & schedule product promo cards for WhatsApp Status & Instagram
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            <ExternalLink size={14} /> View Store
          </a>
        </div>
      </div>

      {/* Channel Status */}
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.25rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, var(--glow-green), var(--glow-cyan))" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Connected Channels</h3>
          <button onClick={checkChannels} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", fontSize: "0.625rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "0.375rem", color: "var(--text-muted)", cursor: "pointer" }}>
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
        {checkingChannels ? (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ flex: 1, height: "3rem", borderRadius: "0.5rem", background: "var(--bg-primary)", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", background: whatsappConnected ? "rgba(16,185,129,0.08)" : "var(--bg-primary)", border: `1px solid ${whatsappConnected ? "rgba(16,185,129,0.2)" : "var(--border-subtle)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>💬</span>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>WhatsApp</p>
                  <p style={{ fontSize: "0.625rem", color: whatsappConnected ? "var(--glow-green)" : "var(--text-muted)" }}>
                    {whatsappConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", background: instagramConnected ? "rgba(168,133,247,0.08)" : "var(--bg-primary)", border: `1px solid ${instagramConnected ? "rgba(168,133,247,0.2)" : "var(--border-subtle)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>📸</span>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>Instagram</p>
                  <p style={{ fontSize: "0.625rem", color: instagramConnected ? "var(--glow-purple)" : "var(--text-muted)" }}>
                    {instagramConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Card Section */}
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.25rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, var(--glow-purple), var(--glow-cyan))" }} />
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={16} style={{ color: "var(--glow-purple)" }} />
          Create Promo Card
        </h3>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.375rem" }}>
            Select Product
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{
              width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
              background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)", fontSize: "0.8125rem", outline: "none",
              minHeight: "44px",
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₦{p.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowGenerator(true)}
          disabled={!selected}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.5rem", padding: "0.75rem", borderRadius: "0.5rem",
            background: selected ? "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))" : "var(--bg-primary)",
            color: selected ? "white" : "var(--text-muted)",
            fontSize: "0.875rem", fontWeight: 600,
            border: "none", cursor: selected ? "pointer" : "not-allowed",
            minHeight: "48px",
          }}
        >
          <Sparkles size={16} />
          Generate Card
        </button>
      </div>

      {/* Scheduler */}
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", padding: "1.25rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, var(--glow-amber), var(--glow-red))" }} />
        <AutoPostScheduler
          storeId={store.id}
          storeSlug={store.slug}
          storeName={store.name}
          products={products}
          whatsappConnected={whatsappConnected}
          instagramConnected={instagramConnected}
        />
      </div>

      {/* PromoCardGenerator Modal */}
      {showGenerator && selected && (
        <PromoCardGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          product={{
            id: selected.id,
            name: selected.name,
            price: selected.price,
            image_url: selected.image_url,
          }}
          store={{
            slug: store.slug,
            name: store.name,
          }}
        />
      )}
    </div>
  );
}

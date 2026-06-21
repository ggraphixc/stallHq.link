"use client";

import { Store } from "@/types";
import { CartDrawer } from "./CartDrawer";
import { StoreAvatar } from "./ui/StoreAvatar";
import { MessageCircle } from "lucide-react";

interface StoreHeaderProps {
  store: Store;
}

const iconBtn: React.CSSProperties = {
  width: "2.75rem",
  height: "2.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0.625rem",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s",
  position: "relative",
  color: "white",
};

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(6,6,11,0.85)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <div style={{
        maxWidth: "80rem",
        margin: "0 auto",
        padding: "0 1rem",
        height: "3.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <StoreAvatar name={store.name} logoUrl={store.logo_url} size="md" />
          <h1 style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {store.name}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* WhatsApp Chat — icon only */}
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, good day ${store.name} 👋`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconBtn, background: "linear-gradient(135deg, #25d366, #128c7e)" }}
            title="Chat on WhatsApp"
          >
            <MessageCircle size={18} />
          </a>

          {/* Cart — icon only */}
          <CartDrawer store={store} />
        </div>
      </div>
    </header>
  );
}

"use client";

import { Store } from "@/types";
import { CartDrawer } from "./CartDrawer";
import { StoreAvatar } from "./ui/StoreAvatar";
import { MessageCircle } from "lucide-react";

interface StoreHeaderProps {
  store: Store;
}

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
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-button whatsapp-button"
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              minHeight: "2.25rem",
            }}
          >
            <MessageCircle size={16} />
            <span>Chat</span>
          </a>
          <CartDrawer store={store} />
        </div>
      </div>
    </header>
  );
}

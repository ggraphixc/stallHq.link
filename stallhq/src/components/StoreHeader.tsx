"use client";

import { Store } from "@/types";
import { CartDrawer } from "./CartDrawer";
import { MessageCircle } from "lucide-react";

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Store Name */}
        <div className="flex items-center gap-3 min-w-0">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-bold text-lg truncate">{store.name}</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-button whatsapp-button !px-3 !py-2 !min-h-[44px] !text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </a>
          <CartDrawer store={store} />
        </div>
      </div>
    </header>
  );
}

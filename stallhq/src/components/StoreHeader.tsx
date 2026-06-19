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
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <StoreAvatar name={store.name} logoUrl={store.logo_url} size="md" />
          <h1 className="font-bold text-sm sm:text-base truncate">{store.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-button whatsapp-button !px-3 !py-2 !min-h-[44px] !text-xs"
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

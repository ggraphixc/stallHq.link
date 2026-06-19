"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Minus, Trash2, MessageCircle, Mail } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Store } from "@/types";

interface CartDrawerProps {
  store: Store;
}

export function CartDrawer({ store }: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    itemCount,
  } = useCart();
  const { trackWhatsAppClick } = useAnalytics();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleCheckout = async () => {
    trackWhatsAppClick(store.id);

    // Create order in database
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        variant_id: item.variant?.id,
        variant_name: item.variant
          ? `${item.variant.option_name}: ${item.variant.option_value}`
          : undefined,
        price: item.variant?.price ?? item.product.price,
        quantity: item.quantity,
      }));

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          store_name: store.name,
          store_email: store.email,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          customer_email: customerEmail || undefined,
          items: orderItems,
          total,
        }),
      });
    } catch (error) {
      console.error("Error creating order:", error);
    }

    // Open WhatsApp
    const url = generateWhatsAppUrl(store.whatsapp_number, store.name, items);
    window.open(url, "_blank");
    clearCart();
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="glow-button !px-4" aria-label="Open cart">
          <span className="relative">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--glow-green)] rounded-full text-xs font-bold flex items-center justify-center text-black">
                {itemCount}
              </span>
            )}
          </span>
          <span className="hidden sm:inline">Cart</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--bg-secondary)] z-50 flex flex-col slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <Dialog.Title className="text-lg font-semibold">
              Your Cart ({itemCount})
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mb-4 opacity-50"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p>Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = item.variant?.price ?? item.product.price;
                const itemKey = item.variant?.id
                  ? `${item.product.id}-${item.variant.id}`
                  : item.product.id;

                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 p-3 rounded-lg bg-[var(--bg-card)]"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--bg-primary)] flex-shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {item.product.name}
                      </h4>
                      {item.variant && (
                        <p className="text-xs text-[var(--glow-purple)]">
                          {item.variant.option_name}: {item.variant.option_value}
                        </p>
                      )}
                      <p className="text-sm text-[var(--glow-green)]">
                        ₦{itemPrice.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.variant?.id
                            )
                          }
                          className="w-8 h-8 rounded-md bg-[var(--bg-primary)] flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.variant?.id
                            )
                          }
                          className="w-8 h-8 rounded-md bg-[var(--bg-primary)] flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            removeItem(item.product.id, item.variant?.id)
                          }
                          className="ml-auto p-2 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-[var(--border-subtle)] space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Your Info (optional)</p>
                <input
                  type="text"
                  className="ambient-input text-sm"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="tel"
                  className="ambient-input text-sm"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    className="ambient-input text-sm !pl-9"
                    placeholder="Email for order updates"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between text-lg">
                <span className="text-[var(--text-secondary)]">Total</span>
                <span className="price-display">₦{total.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="glow-button whatsapp-button w-full"
                >
                  <MessageCircle className="w-5 h-5" />
                  Checkout via WhatsApp
                </button>

                <button
                  onClick={clearCart}
                  className="w-full py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

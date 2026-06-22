"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Store, Users, ShoppingCart, Crown,
  Activity, MessageCircle, Shield, ArrowLeft, Menu, X,
  LifeBuoy, Bell, Settings
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Crown },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/system", label: "System", icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: "16rem", flexShrink: 0, background: "var(--bg-card)",
        borderRight: "1px solid var(--border-subtle)", display: "flex",
        flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 40,
      }}
        className="admin-sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "0.875rem", height: "0.875rem", color: "white" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem" }} className="text-gradient">StallHq</span>
            <span style={{
              fontSize: "0.5625rem", fontWeight: 700, color: "var(--glow-amber)",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "0.25rem", padding: "0.125rem 0.375rem", marginLeft: "0.25rem",
            }}>ADMIN</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  fontSize: "0.8125rem", fontWeight: isActive ? 600 : 500,
                  textDecoration: "none", transition: "all 0.15s",
                  background: isActive ? "rgba(168,133,247,0.1)" : "transparent",
                  color: isActive ? "var(--glow-purple)" : "var(--text-secondary)",
                  border: isActive ? "1px solid rgba(168,133,247,0.15)" : "1px solid transparent",
                  minHeight: "44px",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
            fontSize: "0.8125rem", color: "var(--text-muted)",
            textDecoration: "none", minHeight: "44px",
          }}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div
        className="admin-mobile-header"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "3.5rem",
          background: "rgba(6,6,11,0.9)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-subtle)", display: "none",
          alignItems: "center", justifyContent: "space-between", padding: "0 1rem",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={16} style={{ color: "var(--glow-amber)" }} />
          <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            width: "44px", height: "44px", display: "flex", alignItems: "center",
            justifyContent: "center", background: "transparent", border: "none",
            color: "var(--text-primary)", cursor: "pointer",
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 45,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className="admin-sidebar-mobile"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: "16rem",
          background: "var(--bg-card)", borderRight: "1px solid var(--border-subtle)",
          display: "none", flexDirection: "column", zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s",
        }}
      >
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Admin Panel</span>
          <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  fontSize: "0.8125rem", fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  background: isActive ? "rgba(168,133,247,0.1)" : "transparent",
                  color: isActive ? "var(--glow-purple)" : "var(--text-secondary)",
                  minHeight: "44px",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="admin-main"
        style={{
          flex: 1, marginLeft: "16rem", minHeight: "100vh",
          paddingTop: "0",
        }}
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-header { display: flex !important; }
          .admin-sidebar-mobile { display: flex !important; }
          .admin-main { margin-left: 0 !important; padding-top: 3.5rem !important; }
        }
      `}</style>
    </div>
  );
}

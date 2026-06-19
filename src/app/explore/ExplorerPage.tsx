"use client";

import { useState } from "react";
import Link from "next/link";
import { Store as StoreIcon, ArrowRight } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterPills } from "@/components/ui/FilterPills";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { EmptyState } from "@/components/ui/EmptyState";

interface ExplorerPageProps {
  stores: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    category: string | null;
    created_at: string;
  }>;
  categories: string[];
}

export function ExplorerPage({ stores, categories }: ExplorerPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory
      ? store.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.875rem" }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>StallHq</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              href="/auth/login"
              style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textDecoration: "none" }}
            >
              Login
            </Link>
            <Link href="/auth/signup" className="glow-button" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
              Create Store
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2.5rem 1rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "clamp(1.875rem,5vw,3rem)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>
            Discover{" "}
            <span className="text-gradient">Amazing Stores</span>
          </h1>
          <p style={{ fontSize: "clamp(0.875rem,2vw,1rem)", color: "var(--text-secondary)", maxWidth: "36rem", margin: "0 auto" }}>
            Browse digital storefronts powered by StallHq
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ maxWidth: "36rem", margin: "0 auto 2.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search stores..."
          />
          {categories.length > 0 && (
            <FilterPills
              options={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          )}
        </div>

        {/* Store Grid */}
        {filteredStores.length > 0 ? (
          <div className="stagger-children" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1.25rem" }}>
            {filteredStores.map((store) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="ambient-card ambient-card-interactive"
                style={{ textDecoration: "none", overflow: "hidden" }}
              >
                {/* Banner */}
                <div style={{ height: "7rem", position: "relative", overflow: "hidden" }}>
                  {store.banner_url ? (
                    <img
                      src={store.banner_url}
                      alt={`${store.name} banner`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(to bottom right, var(--glow-purple-dim), var(--glow-cyan-dim))" }} />
                  )}
                  <div
                    style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg-card), transparent 60%)" }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: "1rem", marginTop: "-2rem", position: "relative", zIndex: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <StoreAvatar
                      name={store.name}
                      logoUrl={store.logo_url}
                      size="lg"
                      rounded="2xl"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 700, fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {store.name}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        stallhq.link/{store.slug}
                      </p>
                    </div>
                  </div>

                  {store.description && (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: "0.75rem" }}>
                      {store.description}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {store.category && (
                      <span className="category-tag">{store.category}</span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "var(--glow-purple)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      Visit <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<StoreIcon style={{ width: "2rem", height: "2rem" }} />}
            title="No stores found"
            description={
              search || selectedCategory
                ? "Try adjusting your search or filters"
                : "Be the first to create a store!"
            }
            action={
              !search && !selectedCategory ? (
                <Link href="/auth/signup" className="glow-button">
                  Get Started
                </Link>
              ) : undefined
            }
          />
        )}

        {/* CTA */}
        <div style={{ marginTop: "5rem", textAlign: "center" }}>
          <div className="glass-card" style={{ maxWidth: "36rem", margin: "0 auto", padding: "2rem" }}>
            <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 700, marginBottom: "0.75rem" }}>Create Your Own Store</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Set up in minutes. Start selling on WhatsApp today.
            </p>
            <Link href="/auth/signup" className="glow-button">
              Get Started — It&apos;s Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} StallHq
          </p>
        </div>
      </footer>
    </div>
  );
}

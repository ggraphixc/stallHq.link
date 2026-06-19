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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-sm">StallHq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Login
            </Link>
            <Link href="/auth/signup" className="glow-button !px-4 !py-2 !text-xs !min-h-[44px]">
              Create Store
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Discover{" "}
            <span className="text-gradient">Amazing Stores</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
            Browse digital storefronts powered by StallHq
          </p>
        </div>

        {/* Search & Filters */}
        <div className="max-w-xl mx-auto mb-10 space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger-children">
            {filteredStores.map((store) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="ambient-card ambient-card-interactive group"
              >
                {/* Banner */}
                <div className="h-28 sm:h-32 relative overflow-hidden">
                  {store.banner_url ? (
                    <img
                      src={store.banner_url}
                      alt={`${store.name} banner`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--glow-purple-dim)] to-[var(--glow-cyan-dim)]" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, var(--bg-card), transparent 60%)" }}
                  />
                </div>

                {/* Content */}
                <div className="p-4 -mt-8 relative z-10">
                  <div className="flex items-end gap-3 mb-3">
                    <StoreAvatar
                      name={store.name}
                      logoUrl={store.logo_url}
                      size="lg"
                      rounded="2xl"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate group-hover:text-[var(--glow-purple)] transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        stallhq.link/{store.slug}
                      </p>
                    </div>
                  </div>

                  {store.description && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                      {store.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {store.category && (
                      <span className="category-tag">{store.category}</span>
                    )}
                    <span className="text-xs text-[var(--glow-purple)] flex items-center gap-1">
                      Visit <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<StoreIcon className="w-8 h-8" />}
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
        <div className="mt-20 text-center">
          <div className="glass-card max-w-lg mx-auto p-8 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Create Your Own Store</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              Set up in minutes. Start selling on WhatsApp today.
            </p>
            <Link href="/auth/signup" className="glow-button">
              Get Started — It&apos;s Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} StallHq
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Store as StoreIcon, ArrowRight, Package, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterPills } from "@/components/ui/FilterPills";
import { StoreAvatar } from "@/components/ui/StoreAvatar";
import { EmptyState } from "@/components/ui/EmptyState";

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = ["rgba(168,133,247,0.4)", "rgba(6,182,212,0.4)", "rgba(16,185,129,0.3)"];
    const dots = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

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
    plan?: string;
    verified?: boolean;
    productCount?: number;
  }>;
  categories: string[];
}

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string | null;
  store: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    plan: string;
  };
}

interface SuggestedStore {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
}

export function ExplorerPage({ stores, categories }: ExplorerPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedStore[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [recIndex, setRecIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recScrollRef = useRef<HTMLDivElement>(null);

  // Fetch recommended products
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch("/api/products/recommended?limit=6");
        if (res.ok) {
          const data = await res.json();
          setRecommended(data.products || []);
        }
      } catch {}
    };
    fetchRecommended();
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/stores/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.stores || []);
      setShowDropdown((data.stores || []).length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />
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

      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2.5rem 1rem", position: "relative", zIndex: 1 }}>
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

        {/* Recommended Products Carousel */}
        {recommended.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--glow-purple)" }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recommended for You</h2>
              </div>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <button
                  onClick={() => {
                    if (recScrollRef.current) recScrollRef.current.scrollBy({ left: -240, behavior: "smooth" });
                  }}
                  style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    if (recScrollRef.current) recScrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
                  }}
                  style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div
              ref={recScrollRef}
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: "0.5rem",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {recommended.map((product) => (
                <Link
                  key={product.id}
                  href={`/${product.store.slug}/product/${product.id}`}
                  style={{
                    flex: "0 0 220px",
                    scrollSnapAlign: "start",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(168,133,247,0.3)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                >
                  {/* Product Image */}
                  <div style={{ height: "10rem", position: "relative", overflow: "hidden", background: "var(--bg-primary)" }}>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={24} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.7)", borderRadius: "0.375rem", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--glow-green)" }}>
                      ₦{product.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: "0.75rem" }}>
                    <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.375rem" }}>
                      {product.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      {product.store.logo_url ? (
                        <img src={product.store.logo_url} alt="" style={{ width: "1rem", height: "1rem", borderRadius: "0.25rem", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "1rem", height: "1rem", borderRadius: "0.25rem", background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))" }} />
                      )}
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.store.name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div ref={dropdownRef} style={{ maxWidth: "36rem", margin: "0 auto 2.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              if (v.length >= 2) setShowDropdown(true);
              else setShowDropdown(false);
            }}
            placeholder="Search stores, products, categories..."
          />

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "0.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
                overflow: "hidden",
                zIndex: 50,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                maxHeight: "20rem",
                overflowY: "auto",
              }}
            >
              {suggestions.map((store) => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    borderBottom: "1px solid var(--border-subtle)",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-primary)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { setShowDropdown(false); setSearch(""); }}
                >
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <StoreIcon size={14} color="white" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {store.name}
                    </div>
                    {store.category && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        {store.category}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {showDropdown && loadingSuggestions && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "0.25rem",
                padding: "1rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
                textAlign: "center",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                zIndex: 50,
              }}
            >
              Searching...
            </div>
          )}

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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {store.category && (
                        <span className="category-tag">{store.category}</span>
                      )}
                      {store.productCount !== undefined && store.productCount > 0 && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Package size={10} />
                          {store.productCount}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      {store.verified && (
                        <ShieldCheck size={14} style={{ color: "var(--glow-green)" }} />
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--glow-purple)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        Visit <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                      </span>
                    </div>
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
              Set up in minutes. Start selling on WhatsApp or Instagram today.
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

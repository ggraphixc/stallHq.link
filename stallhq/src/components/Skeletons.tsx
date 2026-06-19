"use client";

export function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] animate-pulse" />
            <div className="w-32 h-5 rounded bg-[var(--bg-card)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-10 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Info Skeleton */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
            <div className="space-y-2">
              <div className="w-48 h-8 rounded bg-[var(--bg-card)] animate-pulse" />
              <div className="w-64 h-4 rounded bg-[var(--bg-card)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Products Header Skeleton */}
        <div className="w-32 h-8 rounded bg-[var(--bg-card)] animate-pulse mb-6" />

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="ambient-card">
      {/* Image Skeleton */}
      <div className="aspect-square bg-[var(--bg-secondary)] animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="w-3/4 h-5 rounded bg-[var(--bg-card)] animate-pulse" />
          <div className="w-1/2 h-4 rounded bg-[var(--bg-card)] animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="w-20 h-6 rounded bg-[var(--bg-card)] animate-pulse" />
          <div className="w-16 h-8 rounded bg-[var(--bg-card)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] animate-pulse" />
            <div className="space-y-2">
              <div className="w-32 h-5 rounded bg-[var(--bg-card)] animate-pulse" />
              <div className="w-24 h-3 rounded bg-[var(--bg-card)] animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ambient-card p-4">
              <div className="w-16 h-4 rounded bg-[var(--bg-secondary)] animate-pulse mb-2" />
              <div className="w-12 h-8 rounded bg-[var(--bg-secondary)] animate-pulse" />
            </div>
          ))}
        </div>

        {/* Products Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-8 rounded bg-[var(--bg-card)] animate-pulse" />
          <div className="w-32 h-10 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          <div className="flex-1 flex justify-center">
            <div className="w-32 h-5 rounded bg-[var(--bg-card)] animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="aspect-square rounded-2xl bg-[var(--bg-card)] animate-pulse" />

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="w-8 h-5 rounded-full bg-[var(--bg-card)] animate-pulse" />
              <div className="w-full h-10 rounded bg-[var(--bg-card)] animate-pulse" />
              <div className="w-32 h-8 rounded bg-[var(--bg-card)] animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="w-24 h-5 rounded bg-[var(--bg-card)] animate-pulse" />
              <div className="w-full h-20 rounded bg-[var(--bg-card)] animate-pulse" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 h-14 rounded-xl bg-[var(--bg-card)] animate-pulse" />
              <div className="flex-1 h-14 rounded-xl bg-[var(--bg-card)] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

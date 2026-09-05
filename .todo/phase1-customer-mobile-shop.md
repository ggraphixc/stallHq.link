# Phase 1 — Customer mobile shop (implementation plan)

## Goal
A signed-in or guest customer can use the app to browse stores, open a store and product
in-app, manage a cart, order via WhatsApp, favorite stores/products, and read reviews —
all without leaving the app.

## Reuse-first rule
Do not invent new backend here. Read the existing mobile-safe APIs and the existing mobile
auth/supabase setup, then build screens that:
- call existing web API routes where they are session-safe for mobile (bearer token), or
- read existing public endpoints as-is, or
- use the existing mobile Supabase client where the route is public or where direct RLS
  reads already serve the mobile goal (for example, public store/product data).

## 1. Surfaces to build (mobile)
- Customer tab shell: top-level customer `/(customer)/(tabs)` stack refreshed to include:
  - Explore (list stores + search)
  - Favorites (stores + products)
  - Customer profile/settings
- Customer store view: `/(customer)/store/[slug]` — renders store in-app:
  - store header (name, logo, category, hours, about, channels), product list, reviews,
    contact, WhatsApp, share.
- Customer product view: `/(customer)/store/[slug]/product/[id]` — renders product in-app:
  - images/variants, add-to-cart, reviews, share.
- Cart: persistent draft stored locally, rendered in a cart drawer/scree, reconcile with
  the order creation step.
- Order: tap "Order on WhatsApp" pre-fills the message + creates the order record.

## 2. Route choices (confirmed from codebase)
Use these as the data layer for customer mobile; adapt auth per route:

| Need | Existing route/feature | Auth path for mobile |
|---|---|---|
| Store by slug | existing store pages use Supabase direct reads; branding is from `/api/branding` | public direct read + branding from `/api/branding` |
| Products by store | existing product listing pattern exists on web | reuse existing pattern (public read for `in_stock` products) |
| Product by id | existing product detail pattern exists on web | reuse existing pattern |
| Reviews | existing `/api/reviews` and review list components exist | reuse; render in store + product views |
| Favorites | existing `/api/favorites` route exists | reuse for product/weeklist-ish favorites; confirm store-level path before adding |
| Orders | existing `/api/orders` + order detail + lookup exist | reuse for creating/reading orders |
| Cart draft | not in backend, in-memory or localStorage-type draft on mobile | implement mobile-side cart draft; reconcile at order creation |
| Search | existing store search route exists | reuse |
| WhatsApp order message | existing WhatsApp order flow exists on web | mirror the message shape |

## 3. Mobile auth considerations
- Reuse the existing mobile auth context and Supabase client — do not create a second auth
  system.
- For routes that require a session, use the existing mobile bearer approach already present
  in the codebase (Supabase access token forwarded to web API), matching the patterns already
  in `reviewActions.ts` and the vendor tabs.
- Customer screens may be usable as guest in some cases (public store/product data); keep
  the "signed-in vs guest" distinction but do not block basic browsing for guests where the
  existing web allows it.

## 4. Cart + order contract
- Cart draft: mobile local draft (serialize, persist across screens). Do not store cart in
  the backend as a new concept in Phase 1.
- Order creation: on "Order on WhatsApp", create the order record through the existing order
  path (web API or equivalent Supabase write) using the same pre-filled WhatsApp message shape
  the web uses, so order records stay consistent.
- After ordering, optionally deep-link back to an in-app order detail; the existing `/order/[id]`
  pattern on web is the reference.

## 5. Favorites (store + product)
- Reuse `/api/favorites` for the product/device-weeklist path where that already works.
- For store-level favorites: read the existing favorites contract first. If it already supports
  store-level rows, add a store favorite action in the store view. If it is product-only, extend
  cleanly only after confirming no conflict with the existing contract (don't assume).

## 6. Reviews (display)
- Reuse the web review list / store review list rendering pattern and the existing `/api/reviews`
  endpoints; render review list in store view and product view.
- Review posting is out of scope for Phase 1 unless low-risk; display first, post later.

## 7. Deep links / navigation
- Register `store/[slug]` and `store/[slug]/product/[id]` as customer routes so in-app browsing
  is possible.
- For WhatsApp orders, keep the deep-link back into an order detail where useful (use existing
  order ID routing).

## 8. Out of scope (leave for later phases)
- Vendor features in this phase.
- Push / realtime notifications.
- Review photos (Phase 6).
- Review/post flow if done more cleanly after display is in place.
- Billing/receipt/revenue (Phase 4).
- Admin password card / resolved-reports archive / platform KPIs (Phase 5).
- Distribution/iOS (Phases 2–3).

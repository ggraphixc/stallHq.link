# Owned-gap plan

> Scope is everything you said "own these" to, in sequence. Each phase lists what
> I need from you to avoid scoping questions mid-build. Phases run one-at-a-time
> and are verified before the next begins. Config/env/production checks are done
> once at the start of Phase 1 (or when a dependency changes) so later phases
> don't re-ask.

## Phase 1 — Customer mobile shop (in-app browse + order + favorites)

### Target
A customer who signs in (or stays guest) can do in-app:
- explore / store listing and search
- store detail (`/{slug}`) rendered in-app
- product detail (`/{slug}/product/{id}`) rendered in-app, with images, variants, reviews
- cart (draft, persist across screens, reconcile with the web cart contract)
- WhatsApp order (pre-filled message + order record created on tap), possibly with
  deep link back to an in-app order detail
- favorites (store + product) persisted for the current session / signed-in user
- reviews displayed on store + product views

### Scope decisions / guardrails
- Reuse the **existing web API routes** wherever they already serve the right data
  (stores, products by store, product by id, reviews, favorites, orders, analytics).
  Plan should read those routes and reuse only the parts that are stable and public
  or session-scoped as appropriate. Do not build new vendor logic in Phase 1.
- Prefer the reusable mobile design system (`theme.ts`, `BrandLoader`, ambient
  styling patterns already established) over inventing new patterns.
- Cart: implement a local cart draft (serialize + persist on the mobile side),
  then post/order through the web order route or the equivalent Supabase write used
  today, keeping the contract clear. If the web order flow uses a specific
  pre-filled WhatsApp message shape, mirror it so the order record matches.
- Favorites: use the existing favorites route/table where possible; if it is
  product-only today, add a store-level favorite path only if it doesn't conflict
  with the existing contract. Confirm the existing contract before adding store-level
  favorites here — don't assume.
- Reviews: reuse the web review list / store review list pattern and the existing
  `/api/reviews` endpoints; render them in the store and product views. The later
  "review photos" item (Phase 6) is separate and can come after Phase 1.

### Dependencies / pre-checks (do these once, before coding)
- Confirm which routes serve the data we need and which are stable for mobile to
  consume (some routes may be cookie-authed for web and need a bearer-token or
  Supabase direct path for mobile). Read the existing mobile auth pattern and the
  existing Supabase client setup to decide per-route auth approach.
- Confirm the exact OTP/auth flow mobile uses for customers (so a signed-in customer
  can actually reach protected routes where needed). Reuse the existing mobile auth
  context, don't invent a second one.

### Notes
- This phase should make the mobile app useful for a customer, not just a vendor
  utility. That's the largest gap and the main acquisition unlock.
- Do not build vendor features in this phase. If a screen happens to have a small
  vendor affordance (for example a "manage" button only for owners), that's fine as a
  guard, but the goal here is customer-facing completeness.

## Phase 2 — Distribution maturity

### Target
- Android no longer relies on sideload-only APK handoff. Move toward Play Store
  distribution and a real in-app update path so users can update without manually
  downloading an APK.
- Keep the existing `android_download_url` admin control so the admin can still point
  at a manual APK while Play Store publishing ramps up.

### Scope decisions / guardrails
- In-app update via `expo-updates`: the Expo SDK already supports this; implement the
  update check so the app can download+prompt for a newer update when available,
  separate from the admin-configured min-version force gate (the gate is still useful
  for catastrophic regressions; in-app update is the normal path).
- Play Store wiring: I can do build-signing config, the `eas.json` Android profile for
  the store build, the versioning wiring so `android_version_code` stays in sync with
  what gets submitted, and the release pipeline notes. Play Console account sign-up,
  listing copy, screenshots, and staged rollout are either you doing or me doing with
  your decisions — that's the split point.
- Keep iOS out of this phase except to avoid regressions. iOS gets its own phase.

### Dependencies / pre-checks
- Play Store developer account: do you already have one, or do you want me to do the
  account/listing work too (with your input on listing copy, screenshots, category,
  contact email)?
- App signing: confirm whether you want a new Play Store key or reuse an existing one,
  and whether the upload is manual or automated via EAS.
- Confirm whether the current Android build profile in `eas.json` is already suitable
  for a Play Store build or needs a separate profile.

## Phase 3 — iOS build + on-device smoke test

### Status: BLOCKED — no Mac, no Apple Developer account

### What's ready (config-only, no build possible)
- `app.json` has `ios.bundleIdentifier: "com.stallhq.app"` set
- `eas.json` has iOS `preview` and `submit` profiles configured
- Expo project ID `e7290b84-fabd-4bc4-904a-9c2dcf422129` supports iOS builds
- `expo-crypto` and `expo-updates` installed (both support iOS)

### What's needed to unblock
1. **Apple Developer account** — $99/year at https://developer.apple.com/programs/
2. **Mac with Xcode** — required for EAS local builds or EAS Build cloud builds
3. **EAS CLI login** — `eas login` + `eas build:configure` on the Mac
4. **Apple push credentials** — generate via Apple Developer portal for push notifications later

### Smoke test checklist (once unblocked)
- [ ] Auth flow: signup → verify → login → role selection
- [ ] Vendor tabs: dashboard, products, orders, analytics
- [ ] Customer tabs: explore, favorites, profile
- [ ] Store detail: products, reviews, WhatsApp, AI chat
- [ ] Product detail: images, reviews, add-to-cart
- [ ] Cart: add items, adjust qty, order via WhatsApp
- [ ] Deep links: `stallhq://` scheme routes correctly
- [ ] Keyboard handling: inputs don't hide behind keyboard
- [ ] Safe-area insets: notch/Dynamic Island respected
- [ ] Status bar style: light on dark background
- [ ] Splash screen: branded loader displays correctly

## Phase 4 — Billing / receipts / revenue / subscription lifecycle

### Target
- Customers get a readable receipt/invoice for platform subscription payment.
- Vendors get a revenue pane (per store) and a coherent subscription-lifecycle view:
  trial → paid → lapsed → reactivation, with one clean email sequence that hands off
  cleanly between stages.

### Scope decisions / guardrails
- Receipt/invoice: decide whether you want a real PDF invoice or a readable receipt
  card/email. If PDF, decide on branding/template approach; if card/email, keep it
  lightweight and reuse existing email patterns.
- Revenue pane: compute from existing `stores` + `payments` + plans. No new external
  infra. Decide whether it sits in the vendor dashboard, admin, or both.
- Subscription lifecycle: consolidate trial/paid/lapsed states in vendor view and admin
  view, with one email sequence that transitions cleanly between stages. Don't invent
  new billing states; read the existing `plans`, `stores.plan`, `trial_ends_at`,
  `subscription_expires_at`, and `payments` semantics first and fit the lifecycle to
  them.
- Keep Paystack webhook integrity as-is; this phase is about the customer/vendor-facing
  surface around it, not changing webhook validation.

### Dependencies / pre-checks
- Which receipt format you want: PDF invoice vs readable receipt card/email.
- Whether revenue pane goes in vendor dashboard, admin, or both.
- Business rules: trial length, grace period, reactivation behavior for lapsed stores.
- Whether you want export (CSV) from the revenue pane.

## Phase 5 — Admin: password-change card + vendor resolved-reports archive + platform KPIs

### Status: COMPLETE

### Target
- Admin password-change UI in web admin settings (reuse existing `/api/auth/change-password`
  pattern), placed where you prefer.
- Vendor monitoring: a resolved-reports archive that mirrors the admin History query
  where RLS allows, so vendors can see what they've acted on (who/when).
- A platform KPIs block for MRR/churn/active stores/trial→paid conversion, compute-only
  from existing tables.

### Scope decisions / guardrails
- Password-change card: decide placement — Security tab vs a small dedicated admin card.
- Vendor resolved-reports archive: reuse the admin History query pattern; only surface
  what RLS allows. If the vendor monitoring RLS/queries already return resolved items,
  the work is mostly rendering + a small query; if not, read the current state before
  assuming.
- Platform KPIs: compute-only. Decide the exact KPIs you care about (MRR, churn,
  active stores, trial→paid conversion, maybe a few more) so the block is coherent.

### Dependencies / pre-checks
- Password-change placement preference.
- Exact KPI set for the platform block.
- Confirm current vendor monitoring RLS/query state for resolved reports before building
  the archive.

## Phase 6 — Store share + store-level favorites + review photos

### Status: COMPLETE

### Target
- A unified "share this store" action across web/mobile (store QR + share card + consistent
  OG/meta) instead of mismatched sharing.
- Store-level favorites normalized across surfaces (not only product/device-level).
- Review photos: upload, compress, store, display on review lists (web + mobile), with a
  light moderation boundary that matches whatever policy you want.

### Scope decisions / guardrails
- Store share: reuse `StoreHeader`/`StoreFooter` + existing share patterns where possible;
  generate a store-level QR and a shareable URL with consistent OG. Keep it visual/link
  work; no new major logic.
- Store-level favorites: confirm whether the existing `favorites` table/routes already
  support store-level rows or need a column/extension first. Don't add store-level
  favorites if it conflicts with the existing contract — instead extend cleanly.
- Review photos: decide file types/size, whether you want photos today at all, and the
  moderation policy (stored, compressed, displayed; light check vs full review queue).
  If you don't want photos today, skip that sub-item and leave the gap noted.

### Dependencies / pre-checks
- Confirm existing favorites contract (product-only vs also store-level) before adding
  store-level favorites.
- Review photos: file types/size, moderation policy, whether photos are wanted now.

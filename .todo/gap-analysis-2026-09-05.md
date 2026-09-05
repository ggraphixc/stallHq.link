# stallHq gap analysis — 2026-09-05

> This is a planning note, not a spec. Pick any row that rhymes; I can own whichever
> you choose (code plan + execution). Items marked "ownable by me" are ones I can
> implement on the current codebase without new decisions from you.
> Divide the rest into "decisions needed" and "info needed".

## What we just shipped (baseline)
- App version + download management: `supabase/app-versions.sql`, `/api/app-version`,
  `AppDownloadBadges`, new "Get the App / Your store in your pocket" section on the
  homepage, "Download App" footer link, StoreFooter badge on every storefront,
  Admin → Settings → Mobile App tab, and the mobile ForceUpdate gate wired into
  `app/index.tsx`. (commit `1bba065`)
- Everything else shipped before this round (reviews, reports, replies, moderation
  digest, dashboard reviews hub, report history, moderation queue badge, etc.).

## Gap map (why → what's missing → strongly recommend)

### (A) Mobile-native customer features (biggest gap right now)
| Why (root cause) | What's missing today | Strongly recommend | Who |
|---|---|---|---|
| Customer-side app reads from store/web APIs but has no browsing/ordering surface beyond profile | No store listing, no product browsing, no search, no cart, no WhatsApp order, no favorites, no product/store detail | Build the customer tab shell + explore + store/[slug] + product/[id] + cart + WhatsApp order + favorites so customers can actually shop in-app | ownable by me (library + screens; need you to confirm lag/feel) |
| Customer reviews & reports were recently built but never surfaced on mobile views that render customer reviews | Store + product pages don't show review lists / report links from the customer screens | Reuse web ReviewList / StoreReviews patterns and the existing `/api/reviews` + `/api/reviews/*` routes so mobile shows reviews with report | ownable by me |
| Vendor store pages reachable from web are linked as web URLs from the app instead of rendered in-app | No native storefront; customers get kicked to a browser | Render `/{slug}` in-app (product carousel, about, hours, contact, WhatsApp) so browsing doesn't leave the app | ownable by me (layout + store screen; depends on web StoreHeader/StoreFooter reuse) |

### (B) Push / real-time (present on roadmap, absent in code)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Order status changes, new reviews, replies, reports, moderation items arrive only when the app polls or the user opens a screen | No Expo push tokens stored, no Supabase realtime subscription, no notification inbox on mobile or admin | Tie Expo push token + device Id to `auth.users`/`stores` (client + write), read platform_settings Apple/Android push credentials, subscribe to the relevant tables in-app, surface a notification inbox on vendor tabs and admin | ownable by me (need Push credentials + whether iOS builds use EAS or bare; also need native-build environment) |
| Admin moderation digests already email vendors/admins, but in-app users never see what's waiting | No in-app notification log surfaced on vendor app or admin portal | Add a `user_notifications`/`vendor_notifications` table + in-app badge/list on vendor tabs; reuse the same cron/Brevo digest as an optional email path | ownable by me |

### (C) Connect/deep-link / expiry-aware experience (missing, low-risk)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| WhatsApp/Instagram order flow is web-centric; no shared state between in-app cart and the web flow, no expiry-aware banner when trial lapses or plan ends | No in-app trial/plan-expiry banner, no deep link back from WhatsApp into a specific order, no "your store went offline because…" in-app message | Wire Plan/subscription expiry into the vendor tabs (show banner + CTA to upgrade when expired); generate order deep links such that returning from WhatsApp lands on the order detail; surface expiry/timeout messaging consistently (web + mobile + email) | ownable by me (need you to confirm which entitlement flags already exist on `stores.plan` / `trial_ends_at` / `subscription_expires_at`) |
| Favicon/logo/platform branding flows on web but store-specific assets aren't surfaced as first-class app assets | App icon/splash/content branding is platform-level only; store logos are generic images | Keep platform branding as-is (it's fine), but allow per-store logo/banner used inside in-app store views and the force-update/carousel where appropriate | ownable by me (visual only; no RLS decisions) |

### (D) Admin / operations gaps (decisions or info needed)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Auth section wants a password-change UI in web admin settings per report (present in code path for API, not in admin UI surface) | No admin-facing "change my password" + no self-serve reset flow beyond the customer flow | Add admin password-change card inside Admin → Security or a small dedicated admin settings card, reusing the existing `/api/auth/change-password` pattern | info needed: where you want it (Security tab vs separate admin card) |
| Moderation reports & review reports surfaced to admin, but vend/admin monitoring shares no "resolved history" for reports tied to the current store | Vendor monitoring Reports tab shows what's described as reports, but there's no visible "resolved" archive the way admin now has History | Surface resolved reports in vendor monitoring (when RLS allows) with who/when; reuse admin History query pattern | ownable by me (need to confirm the vendor monitoring RLS + query already returns resolved) |
| Admin system health view exists but the platform metrics that matter most for a subscription business (MRR, churn, active stores, trial->paid conversion) aren't a first-class dashboard | Ad-hoc numbers across several places; no MRR/churn/retention summary | Add a small platform KPIs block to Admin → System (or a new Admin → Analytics section) computed from `stores`, `payments`, `plans`; no new external infra | ownable by me (compute-only; no new tables) |

### (E) Distribution maturity (Android APK today; iOS not built/published)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Android APK built via EAS works but there's no store listing, no Play Store sign-up, no in-app update beyond the force-update gate | No Play Store listing/console work started; APK only; iOS still unbuilt and untested on-device for voice/help | Publish Android to Play Store (sign up + listing + build signing + staged rollout); turn the force-update gate into a real in-app update using `expo-updates` (already part of Expo) so users auto-update without manual APK download | info needed: Play Store developer account status + whether you want me to do the listing copy or only the build-release wiring; iOS: do you have a Mac / Apple Developer account ready, or should iOS wait? |
| iOS is referenced in settings/README but there's no iOS build, no test flow, no App Store link target | No iOS artifact and no validation that iOS-specific paths work (deep links, status bar, splash, keyboard, safe areas) | When iOS is ready, add a build profile in `eas.json`, mirror env vars, and run a quick on-device smoke test (auth → vendor dashboard → customer explore) before publishing | info needed: do you have the Mac + Apple Developer account + push credentials? |

### (F) Paystack / billing / receipts (info + decisions)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Paystack is in the project for subscription billing, but there's no customer-facing receipt/invoice/invoicing and no vendor-facing revenue reporting beyond order totals | No invoices, no payment receipts, no revenue report per store, no export | Add a lightweight receipt/invoice email + view through `/dashboard` + order history (read-only), and a per-store revenue pane; keep Paystack webhook integrity as-is | decisions needed: do you want real invoices (PDF) or just a readable receipt card/email; do you want export (CSV) |
| The roadmap mentions subscription invoicing and trial->paid nurture, both touched lightly but not a coherent flow | Trial expiry reminders exist in cron/marketing pieces, but there isn't a single "subscription lifecycle" view (trial → paid → lapsed → reactivation) | Consolidate trial/paid/lapsed states in admin + vendor view, with one email sequence that hands off cleanly between stages; no new infra | info needed: business rules around trial length, grace period, and reactivation on lapsed stores |

### (G) Store/operator onboarding & acquisition (decisions)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Onboarding for new vendors exists on web but mobile sign-up is "select role → verify → create store"; store creation isn't as complete as web | Mobile store-creation flow is thinner than web (no full store settings wizard surfaced on mobile) | Mirror the web onboarding store-creation wizard in mobile (theme, hours, channels, initial products) so mobile sign-up lands vendors in a functional store, not an empty shell | ownable by me (mirror web wizard; need you to confirm which web onboarding steps must be ported) |
| Acquisition funnel (homepage → signup → first store → first product → first order) is strong on web but partially opaque on mobile because customer browsing is absent | Mobile is mostly a vendor utility right now | The customer-browsing work in (A) is the main acquisition unlock on mobile; the rest is polish | decisions needed: is the mobile app primarily a customer marketplace app, a vendor utility, or both (and in what priority order) |

### (H) Polish / trust / discovery (low-risk, ownable)
| Why | Missing | Recommend | Who |
|---|---|---|---|
| Every storefront is SEO-able but individual store "share" experience is inconsistent between web and mobile (mobile sharing uses expo-sharing and web uses QR + OG) | No unified "share this store" action across web/mobile with consistent OG/meta and a store-level QR | Add store-level QR + share card to mobile store view mirroring `StoreHeader` / `StoreFooter` + `ShareCard`; keep web store page OG as-is | ownable by me (visual + link generation) |
| Customers can favorite products but there's no "favorite stores" across web/mobile that's normalized to stores as first-class | Favorites are product/device-based; stores-as-favorites is inconsistent or absent depending on surface | Add store-level favorites (device + auth) that surfaces on explore + customer tabs, reusing the existing favorites table/route patterns where available | ownable by me (need to confirm if `favorites` table already supports store-level rows or needs a column) |
| No review photos, no media in reviews (roadmap mentions "customer reviews with photos") | Reviews are text + rating only | Add review photo upload (Supabase Storage + client compression) with light moderation check; display review photos on store/product review lists | decisions needed: do you want photos today; acceptable file types/size; moderation policy |

## How to use this note
- If you want, say "own these" and name a short list from (A)–(H); I'll convert the chosen
  rows into a build plan and execute.
- For rows tagged "decisions needed" or "info needed", answer the question in the rightmost
  column and I can keep going.

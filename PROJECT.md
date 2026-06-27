# stallHq — Project Bible

> Complete documentation of systems, ideas, features, goals, agenda, structure, foundation, why, reasons, solutions, architecture, design, map, connection, parts & purpose.

---

## Table of Contents

1. [Why — The Problem & Origin](#1--why--the-problem--origin)
2. [What — The Product](#2--what--the-product)
3. [Goal & Agenda](#3--goal--agenda)
4. [Foundation — Tech Stack](#4--foundation--tech-stack)
5. [Architecture — System Design](#5--architecture--system-design)
6. [Database Schema — Data Map](#6--database-schema--data-map)
7. [Authentication & Authorization](#7--authentication--authorization)
8. [Features — Complete Inventory](#8--features--complete-inventory)
9. [Design System — Visual Language](#9--design-system--visual-language)
10. [Page Map — Route Architecture](#10--page-map--route-architecture)
11. [API Map — Endpoint Architecture](#11--api-map--endpoint-architecture)
12. [Component Map — UI Architecture](#12--component-map--ui-architecture)
13. [Library Map — Business Logic](#13--library-map--business-logic)
14. [Context Map — State Architecture](#14--context-map--state-architecture)
15. [Email System — Notification Architecture](#15--email-system--notification-architecture)
16. [Payment System — Subscription Architecture](#16--payment-system--subscription-architecture)
17. [WhatsApp Integration — Order Flow](#17--whatsapp-integration--order-flow)
18. [SEO Infrastructure](#18--seo-infrastructure)
19. [PWA — Progressive Web App](#19--pwa--progressive-web-app)
20. [Admin Panel — Platform Management](#20--admin-panel--platform-management)
21. [Security Model](#21--security-model)
22. [Deployment & Infrastructure](#22--deployment--infrastructure)
23. [File Tree — Complete Structure](#23--file-tree--complete-structure)
24. [Environment Variables](#24--environment-variables)
25. [SQL Migrations — Database Evolution](#25--sql-migrations--database-evolution)
26. [Solutions — Problems Solved](#26--solutions--problems-solved)
27. [Parts & Purpose — Every File Explained](#27--parts--purpose--every-file-explained)
28. [Connection Map — How Everything Links](#28--connection-map--how-everything-links)
29. [Decisions — Technical Rationale](#29--decisions--technical-rationale)
30. [Future Roadmap](#30--future-roadmap)

---

## 1. Why — The Problem & Origin

### The Problem

Millions of small vendors in Nigeria and across Africa run their entire businesses through WhatsApp. They:
- Share product photos in WhatsApp groups
- Manually respond to dozens of "price?" messages daily
- Have no way for customers to browse their catalog without scrolling through chat history
- Lose sales because customers can't find products at 2am when the vendor is asleep
- Have zero online presence — no URL to share, no SEO, no discoverability
- Track orders in their head or in scattered notebook entries
- Use personal WhatsApp numbers for business, blurring life and work

Existing solutions (Shopify, WooCommerce, Jumia) don't work for them because:
- **Too expensive** — Monthly fees in USD that eat into thin margins
- **Too complex** — Require technical knowledge most vendors don't have
- **Wrong model** — Built for shipping/logistics, not WhatsApp-based sales
- **No WhatsApp integration** — Treat WhatsApp as an afterthought

### The Origin

stallHq was built to solve this specific problem: **give WhatsApp vendors a professional digital storefront that connects directly to their existing WhatsApp workflow, at zero hosting cost.**

The insight: vendors don't need an e-commerce platform. They need a **digital catalog** that makes their WhatsApp more professional. The actual transaction — payment, trust, delivery — happens on WhatsApp. stallHq just makes the discovery part world-class.

### Why "stallHq"

- **Stall** — A small shop, a vendor's setup
- **Hq** — Headquarters, the command center
- Together: **Your shop's headquarters** — the place customers go to see everything you sell

---

## 2. What — The Product

stallHq is a **digital storefront platform** for WhatsApp-based vendors. It is NOT:
- An e-commerce platform (no on-platform payments for products)
- A shipping solution (WhatsApp handles delivery coordination)
- A payment gateway (Paystack is only for platform subscriptions)

It IS:
- A beautiful, mobile-first product catalog at `stallhq.link/{slug}`
- A WhatsApp-integrated order system (cart → pre-filled WhatsApp message)
- A vendor dashboard for managing products, orders, and analytics
- A subscription-based SaaS (vendors pay for the platform, customers pay via WhatsApp)
- A PWA that installs on phones like a native app
- An SEO-optimized storefront that gets discovered on Google

### Core Flow

```
Customer browses store → Adds to cart → Clicks "Order on WhatsApp"
  → Pre-filled message sent to vendor's WhatsApp
  → Vendor confirms deal on WhatsApp
  → Payment/trust/delivery handled on WhatsApp
  → Vendor updates order status in dashboard
```

---

## 3. Goal & Agenda

### Primary Goals

1. **Zero Hosting Cost** — Vercel free tier + Supabase free tier = $0/month to run
2. **Mobile-First** — Designed for smartphones, thumb-first layout, works on Opera Mini
3. **WhatsApp-Native** — Every path leads to WhatsApp, the actual business channel
4. **Nigeria/Africa Focus** — Naira pricing, Paystack (not Stripe), WhatsApp (not email)
5. **Instant Setup** — Vendor can have a live store in under 5 minutes

### Business Agenda

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: MVP | DONE | Core storefront, product management, WhatsApp checkout |
| Phase 2: Growth | DONE | Subscriptions, admin panel, analytics, order tracking |
| Phase 3: Scale | DONE | PWA, SEO, favorites, reviews, customer accounts |
| Phase 4: Polish | DONE | Alert system, bug fixes, security hardening |
| Phase 5: Launch | NEXT | Marketing, onboarding flows, vendor acquisition |

### Success Metrics

- **Vendors**: Number of active stores, products listed, subscription conversion rate
- **Customers**: Store visits, product views, WhatsApp clicks, reorder rate
- **Platform**: MRR (Monthly Recurring Revenue), churn rate, support ticket volume

---

## 4. Foundation — Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.9 | App router, server components, API routes, Turbopack |
| **React** | 19.2.4 | UI rendering, hooks, context |
| **TypeScript** | 5.x | Type safety, IDE support, catch bugs at compile time |
| **Tailwind CSS** | 4.x | Utility classes + custom CSS design system |

### Backend & Data

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Storage, Realtime |
| **@supabase/ssr** | Server-side cookie-based auth (not client SDK) |
| **@supabase/supabase-js** | Client-side queries, RLS enforcement |

### Integrations

| Technology | Purpose |
|------------|---------|
| **Brevo** | Transactional email (verification, password reset, notifications) |
| **Paystack** | Platform subscription payments (Naira, Nigerian banks) |
| **WhatsApp API** | Pre-filled order messages via wa.me links |

### UI Libraries

| Technology | Purpose |
|------------|---------|
| **Lucide React** | Icon system (consistent, tree-shakeable) |
| **Radix UI** | Accessible primitives (Dialog, Toast) |
| **qrcode.react** | QR codes for product share links |

### Deployment

| Technology | Purpose |
|------------|---------|
| **Vercel** | Hosting, edge functions, cron jobs, preview deploys |
| **GitHub** | Version control, CI/CD via Vercel integration |

### Why This Stack

- **Next.js 16**: Server components for fast initial load, API routes eliminate separate backend, Turbopack for fast builds
- **Supabase**: Free tier covers MVP scale, RLS for security without custom middleware, PostgreSQL for reliability
- **Tailwind + CSS Variables**: Utility classes for speed, CSS variables for design system consistency
- **Brevo**: Free tier (300 emails/day), no SDK needed (REST API), reliable delivery
- **Paystack**: Nigeria-native, Naira support, instant settlement, webhook reliability
- **Vercel**: Zero-config Next.js deploy, free tier for hobby projects, edge functions for middleware

---

## 5. Architecture — System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Homepage │  │  Store   │  │Dashboard │  │  Admin   │ │
│  │  (SSG)  │  │  Pages   │  │  (CSR)   │  │  (CSR)   │ │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │            │              │              │        │
│  ┌────┴────────────┴──────────────┴──────────────┴────┐  │
│  │              React Context Layer                     │  │
│  │  AlertProvider │ CartContext (localStorage)          │  │
│  └────────────────────┬────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                  SERVER LAYER                             │
│  ┌────────────────────┴────────────────────────────────┐ │
│  │              Next.js Middleware                       │ │
│  │  Session refresh │ Auth check │ Route protection     │ │
│  └────────────────────┬────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────┴────────────────────────────────┐ │
│  │              API Routes (Route Handlers)              │ │
│  │  /api/auth/*  /api/products  /api/orders             │ │
│  │  /api/stores  /api/reviews   /api/favorites          │ │
│  │  /api/admin/* /api/support   /api/payments           │ │
│  └────────────────────┬────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────┴────────────────────────────────┐ │
│  │              Supabase Client Layer                    │ │
│  │  server.ts (cookie auth) │ api.ts (API routes)       │ │
│  │  client.ts (browser)     │ service role (mutations)  │ │
│  └────────────────────┬────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                  DATA LAYER                               │
│  ┌────────────────────┴────────────────────────────────┐ │
│  │              Supabase PostgreSQL                      │ │
│  │  stores │ products │ orders │ reviews │ analytics    │ │
│  │  product_variants │ favorites │ support_tickets      │ │
│  │  support_messages │ admin_notifications              │ │
│  │  platform_settings │ email_verifications             │ │
│  │  password_resets │ payments                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Supabase Storage                         │ │
│  │  products/ (product images)                           │ │
│  │  store-assets/ (logos, banners)                       │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. Browser hits /store-name
2. Next.js middleware runs:
   a. Refreshes Supabase session via cookies
   b. Checks if route needs auth (public pages don't)
   c. Redirects to /auth/login if unauthenticated on protected routes
3. Server component renders:
   a. Fetches store data from Supabase (public read)
   b. Fetches products, reviews, ratings
   c. Renders HTML server-side (fast first paint)
4. Client hydrates:
   a. Cart state loads from localStorage
   b. Interactive elements become clickable
   c. Analytics event fires (visit tracked)
5. User adds to cart → clicks "Order on WhatsApp"
   a. Cart state serialized
   b. WhatsApp URL generated with pre-filled message
   c. WhatsApp opens with order details
   d. Order record created in database
   e. User redirected to order detail page
```

### Auth Flow

```
1. User visits /auth/signup
2. Fills form → POST /api/auth/signup
3. API route:
   a. Creates Supabase auth user (email_confirmed: false)
   b. Generates 6-digit code (crypto.randomInt)
   c. Stores in email_verifications table
   d. Sends verification email via Brevo
   e. Returns success
4. User enters code → POST /api/auth/verify-email
5. API route:
   a. Validates code against email_verifications
   b. Checks expiry (15 min)
   c. Updates auth.users email_confirmed = true
   d. Sends welcome email via Brevo
   e. Returns success
6. User logs in → POST /api/auth/login
7. API route:
   a. Authenticates via Supabase Auth
   b. Sets session cookies (Set-Cookie header)
   c. Checks if admin email → returns redirect: /admin
   d. Returns user data
8. Middleware handles session refresh on every request
```

---

## 6. Database Schema — Data Map

### Entity Relationship

```
auth.users (Supabase Auth)
  │
  ├── stores (1:1 via user_id)
  │     ├── products (1:N via store_id)
  │     │     ├── product_variants (1:N via product_id)
  │     │     └── reviews (1:N via product_id)
  │     ├── orders (1:N via store_id)
  │     ├── analytics (1:N via store_id)
  │     ├── payments (1:N via store_id)
  │     ├── support_tickets (1:N via store_id, nullable)
  │     └── favorites (1:N via store_id)
  │
  ├── email_verifications (1:N via user_id)
  ├── password_resets (1:N via user_id)
  ├── support_tickets (1:N via user_id)
  └── support_messages (1:N via sender_id)
```

### Tables Detail

#### `stores` — Vendor storefronts
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid → auth.users | Owner reference |
| slug | varchar(255) | URL identifier (unique) |
| name | varchar(255) | Store display name |
| description | text | Store bio |
| whatsapp_number | varchar(50) | Business WhatsApp number |
| logo_url | text | Store logo (Supabase Storage) |
| banner_url | text | Store banner image |
| category | varchar(100) | Store category |
| theme | jsonb | Custom colors/fonts |
| store_hours | jsonb | Operating hours by day |
| email | varchar(255) | Business email |
| setup_complete | boolean | Onboarding finished |
| plan | varchar(50) | Subscription plan |
| verified | boolean | Verified vendor badge |
| trial_ends_at | timestamptz | Trial expiry |
| subscription_expires_at | timestamptz | Paid subscription expiry |
| low_stock_threshold | integer | Alert trigger level |
| stock_alerts_enabled | boolean | Email alerts on/off |

#### `products` — Product catalog
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| store_id | uuid → stores | Parent store |
| name | varchar(255) | Product name |
| description | text | Product details |
| price | numeric(10,2) | Price in Naira |
| image_url | text | Primary image |
| images | jsonb | Image gallery array |
| category | varchar(100) | Product category |
| in_stock | boolean | Availability |
| has_variants | boolean | Has size/color options |

#### `product_variants` — Size/color options
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| product_id | uuid → products | Parent product |
| name | varchar(255) | Variant label |
| option_name | varchar(100) | Option type (Size, Color) |
| option_value | varchar(100) | Option value (XL, Red) |
| price | numeric(10,2) | Override price (nullable) |
| stock | integer | Stock count |
| sku | varchar(100) | Stock keeping unit |

#### `orders` — WhatsApp order records
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| store_id | uuid → stores | Vendor store |
| customer_name | varchar(255) | Buyer name |
| customer_phone | varchar(50) | Buyer phone |
| customer_email | varchar(255) | Buyer email |
| customer_id | varchar(64) | Device-based identifier |
| items | jsonb | Order line items |
| total | numeric(10,2) | Order total (₦) |
| status | varchar(50) | pending/confirmed/shipped/delivered/cancelled |
| notes | text | Customer notes |
| vendor_notes | text | Vendor status updates |
| created_at | timestamptz | Order date |

#### `reviews` — Product ratings
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| product_id | uuid → products | Reviewed product |
| store_id | uuid → stores | Parent store |
| reviewer_name | varchar(255) | Reviewer display name |
| rating | integer (1-5) | Star rating |
| comment | text | Review text |
| user_id | uuid | Optional auth user |

#### `analytics` — Store metrics
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| store_id | uuid → stores | Tracked store |
| event_type | varchar(50) | visit/whatsapp_click/product_view |
| product_id | uuid → products | Optional product reference |
| metadata | jsonb | Additional event data |

#### `favorites` — Device-based wishlist
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| device_id | varchar(64) | Browser fingerprint |
| product_id | uuid → products | Saved product |
| store_id | uuid → stores | Parent store |

#### `email_verifications` — Auth codes
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid → auth.users | Verifying user |
| email | varchar(255) | Email address |
| code | varchar(10) | 6-digit verification code |
| type | varchar(20) | signup/email_change |
| expires_at | timestamptz | 15-minute expiry |
| used | boolean | Already consumed |

#### `password_resets` — Reset tokens
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid → auth.users | Resetting user |
| email | varchar(255) | Email address |
| token | varchar(64) | Reset token |
| expires_at | timestamptz | 1-hour expiry |
| used | boolean | Already consumed |

#### `payments` — Subscription transactions
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| store_id | uuid → stores | Purchasing store |
| user_id | uuid → auth.users | Purchasing user |
| plan | varchar(50) | Plan purchased |
| amount | integer | Amount in kobo |
| currency | varchar(3) | NGN |
| paystack_reference | varchar(255) | Paystack ref (unique) |
| paystack_status | varchar(50) | pending/success/failed |

#### `support_tickets` — Vendor support
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid → auth.users | Ticket creator |
| store_id | uuid → stores | Related store |
| subject | varchar(255) | Ticket subject |
| category | varchar(50) | general/billing/technical/feature_request/bug_report |
| status | varchar(20) | open/in_progress/replied/resolved/closed |
| priority | varchar(10) | low/normal/high/urgent |

#### `support_messages` — Conversation threads
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| ticket_id | uuid → support_tickets | Parent ticket |
| sender_id | uuid → auth.users | Message author |
| sender_role | varchar(10) | vendor/admin |
| message | text | Message content |

#### `admin_notifications` — Platform announcements
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| title | varchar(255) | Notification title |
| body | text | Notification content |
| type | varchar(30) | info/warning/success/error/announcement |
| target | varchar(20) | all/trial/monthly/quarterly/annual |
| sent_by | uuid → auth.users | Admin sender |
| read_by | uuid[] | Read receipts |

#### `platform_settings` — Key-value config
| Column | Type | Purpose |
|--------|------|---------|
| key | varchar(100) | Setting name (PK) |
| value | jsonb | Setting value |
| updated_by | uuid → auth.users | Last editor |
| updated_at | timestamptz | Last modified |

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| stores | slug | Fast URL lookup |
| stores | category | Category browsing |
| stores | plan | Plan-based queries |
| products | store_id | Store product listing |
| products | category | Category filtering |
| products | in_stock | Stock filtering |
| product_variants | product_id | Variant lookup |
| orders | store_id | Vendor order list |
| orders | status | Status filtering |
| orders | created_at | Time ordering |
| orders | customer_id | Customer lookup |
| analytics | store_id | Store analytics |
| analytics | event_type | Event filtering |
| analytics | store_event | Composite lookup |
| reviews | product_id | Product reviews |
| reviews | store_id | Store reviews |
| favorites | device_id | Device wishlist |
| favorites | product_id | Product favorites |
| payments | store_id | Store payments |
| payments | reference | Paystack lookup |
| support_tickets | user_id | Vendor tickets |
| support_tickets | status | Status filtering |
| support_messages | ticket_id | Thread loading |

### Row Level Security (RLS)

| Table | Policy | Rule |
|-------|--------|------|
| stores | Public read | Anyone can view |
| stores | Owner insert | auth.uid() = user_id |
| stores | Owner update | auth.uid() = user_id |
| products | Public read | in_stock = true |
| products | Owner CRUD | Via stores.user_id = auth.uid() |
| product_variants | Public read | Anyone can view |
| product_variants | Owner CRUD | Via products → stores |
| orders | Owner read/update | Via stores.user_id = auth.uid() |
| orders | Public insert | Anyone can create |
| analytics | Public insert | Anyone can track |
| analytics | Owner read | Via stores.user_id = auth.uid() |
| reviews | Public read | Anyone can view |
| reviews | Public insert | Anyone can create |
| reviews | Owner delete | Via stores.user_id = auth.uid() |
| favorites | Public CRUD | Device-based (no auth) |
| payments | Owner read | Via stores.user_id = auth.uid() |
| support_tickets | Vendor read/write | auth.uid() = user_id |
| support_messages | Participant read | Via tickets or sender_id |
| admin_notifications | Public read | Anyone can view |
| platform_settings | Public read | Anyone can view |

---

## 7. Authentication & Authorization

### Auth Methods

| Method | Implementation |
|--------|---------------|
| Email/Password | Supabase Auth with custom verification |
| Email Verification | 6-digit code via Brevo (not magic link) |
| Password Reset | Token-based via Brevo email |
| Session Management | Cookie-based via @supabase/ssr |
| Admin Access | USER_ID env var with comma-separated UUIDs |

### Auth Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Signup     │────▶│  Supabase    │────▶│  Brevo Email    │
│  Form       │     │  Auth API    │     │  (6-digit code) │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Verify     │────▶│  Welcome Email  │
                    │  Email      │     │  via Brevo      │
                    └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Login      │────▶│  Set-Cookie     │
                    │  Form       │     │  Headers        │
                    └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Middleware  │  (every request)
                    │  Refresh    │
                    └──────────────┘
```

### Route Protection

| Route Type | Auth Required | Middleware Behavior |
|------------|--------------|-------------------|
| `/` | No | Public |
| `/explore` | No | Public |
| `/favorites` | No | Public |
| `/account` | No | Public |
| `/offline` | No | Public |
| `/{slug}` | No | Public store page |
| `/{slug}/product/{id}` | No | Public product page |
| `/auth/*` | No | Auth pages |
| `/api/*` | Varies | Per-route check |
| `/dashboard/*` | Yes | Redirect to login |
| `/admin/*` | Yes | Redirect to login |
| `/onboarding` | Yes | Redirect to login |

### Admin Authorization

```
ADMIN_USER_ID=uuid1,uuid2

Runtime: process.env.ADMIN_USER_ID.split(",").map(s => s.trim())

Admin check: isAdmin(userId) → userId matches any admin UUID
```

---

## 8. Features — Complete Inventory

### Vendor Features

| Feature | Status | Description |
|---------|--------|-------------|
| Store Creation | DONE | Multi-step onboarding wizard |
| Product Management | DONE | CRUD with images, variants, categories |
| Image Upload | DONE | Compression, preview, Supabase Storage |
| Product Variants | DONE | Size/color with individual pricing & stock |
| Order Management | DONE | Status updates, vendor notes, timeline |
| Store Customization | DONE | Theme colors, fonts, logo, banner |
| Store Hours | DONE | Per-day open/close times |
| Analytics Dashboard | DONE | Visits, WhatsApp clicks, product views |
| Subscription Management | DONE | Plan upgrade, expiry tracking |
| Support Tickets | DONE | Create tickets, threaded conversations |
| QR Code Sharing | DONE | Auto-generated QR for product links |
| Inventory Alerts | DONE | Low stock email notifications |
| Product Share Links | DONE | Direct links to individual products |

### Customer Features

| Feature | Status | Description |
|---------|--------|-------------|
| Store Browsing | DONE | Explore page, search, categories |
| Product Search | DONE | Debounced autocomplete with dropdown |
| Favorites/Wishlist | DONE | Device-based, no auth required |
| Cart | DONE | LocalStorage-based, persists across sessions |
| WhatsApp Checkout | DONE | Pre-filled order message |
| Order Tracking | DONE | `/order/{id}` with timeline |
| Order Lookup | DONE | `/account` with email-based lookup |
| Reorder | DONE | One-click reorder from order history |
| Reviews & Ratings | DONE | Star rating + comment, anonymous |
| Customer Dashboard | DONE | Orders, favorites, profile, create store CTA |

### Platform Features

| Feature | Status | Description |
|---------|--------|-------------|
| Subscription Bundles | DONE | 4-tier pricing (Trial/Monthly/Quarterly/6-Month) |
| Paystack Integration | DONE | Naira payments, webhook verification |
| Trial Management | DONE | 5-day free trial, expiry reminders |
| Admin Panel | DONE | Overview, stores, users, orders, support |
| Admin Notifications | DONE | Send announcements by plan segment |
| Platform Settings | DONE | Key-value config store |
| Support System | DONE | Vendor tickets, admin replies, email notify |
| Store Search | DONE | Fuzzy search with autocomplete |
| Store Themes | DONE | Custom CSS variables per store |
| Email System | DONE | 8 email types via Brevo API |
| SEO | DONE | Sitemap, robots.txt, structured data, OG tags |
| PWA | DONE | Installable, offline page, manifest |
| Alert System | DONE | Toast notifications + confirmation modals |

### Storefront Features

| Feature | Status | Description |
|---------|--------|-------------|
| Public Store Page | DONE | `/{slug}` with products, about, contact |
| Product Detail | DONE | `/{slug}/product/{id}` with images, reviews |
| Category Filter | DONE | Filter products by category |
| Store Hours Display | DONE | Open/closed status with schedule |
| WhatsApp Contact | DONE | Direct WhatsApp link to vendor |
| Email Contact | DONE | Direct email link |
| Floating Particles | DONE | Ambient visual effect on store pages |
| Glass Card Design | DONE | Frosted glass aesthetic |
| Product Carousel | DONE | Swipe through product images |
| Share Card | DONE | Product sharing with QR code |

### Admin Features

| Feature | Status | Description |
|---------|--------|-------------|
| Overview Dashboard | DONE | Stats, recent orders, quick actions |
| Store Management | DONE | 2-column grid with inline badges (plan, status, days left) |
| User Management | DONE | View/search users |
| Order Management | DONE | View/update order status |
| Subscription Dashboard | DONE | Plan distribution, expiring soon |
| Support Panel | DONE | Filter tickets, reply, status management |
| Notification Composer | DONE | Send to all/plan-segment, drag-and-drop email editor |
| System Settings | DONE | 6-tab config (General, Branding, Email, Payments, AI, Security) |
| Mobile Responsive | DONE | Card-based layouts, responsive padding, hidden columns on mobile |
| Dynamic Branding | DONE | Logo/favicon upload, platform name, public API |

### AI Features

| Feature | Status | Description |
|---------|--------|-------------|
| AI Description Generator | DONE | Product descriptions via configurable OpenAI-compatible API |
| AI Plan Gating | DONE | AI gated to paid plans only |
| AI Multimodal | DONE | Product photos sent to vision models for better descriptions |
| AI Rate Limiting | DONE | 10 requests/user/5min in-memory limiter |
| Onboarding AI | DONE | Description + AI generate button per product in onboarding flow |

### GEO/AEO Features

| Feature | Status | Description |
|---------|--------|-------------|
| GEO Meta Tags | DONE | geo.region, geo.placename, geo.position, ICBM on store pages |
| LocalBusiness Schema | DONE | Store structured data with GeoCoordinates, address, areaServed |
| FAQ Schema | DONE | Homepage (6 FAQs) and /about page (9 FAQs) |
| HowTo Schema | DONE | Step-by-step instructions for AI crawlers |
| BreadcrumbList | DONE | All store and product pages |
| WebPage AEO Summaries | DONE | AI-crawler-optimized summaries on store/product pages |
| Organization/WebSite Schema | DONE | Root layout with SearchAction for AI search |
| SoftwareApplication Schema | DONE | App listing schema in root layout |

---

## 9. Design System — Visual Language

### Design Philosophy

**"Ambient Dark"** — A dark UI that feels alive. Not flat, not skeuomorphic. Depth through glow, not shadows. Movement through particles, not gimmicks.

### Color System

```css
/* Background Layers (darkest to lightest) */
--bg-primary: #06060b      /* Page background */
--bg-secondary: #0e0e16    /* Input backgrounds */
--bg-card: #13131d          /* Card backgrounds */
--bg-card-hover: #1a1a28    /* Card hover state */
--bg-elevated: #1e1e2e      /* Dropdowns, modals */

/* Glow Palette (the "life" in ambient) */
--glow-purple: #a855f7     /* Primary CTA, accents */
--glow-green: #10b981       /* Success, prices, stock */
--glow-cyan: #06b6d4        /* Info, links, categories */
--glow-amber: #f59e0b       /* Warnings, trials */
--glow-red: #ef4444          /* Errors, danger */
--glow-blue: #3b82f6        /* Info badges */

/* Text */
--text-primary: #f1f5f9     /* Headings, primary text */
--text-secondary: #94a3b8   /* Body text, descriptions */
--text-muted: #4b5563        /* Placeholders, captions */
--text-inverse: #06060b      /* Text on light backgrounds */

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06)   /* Default */
--border-medium: rgba(255, 255, 255, 0.1)     /* Emphasis */
--border-glow: rgba(168, 85, 247, 0.25)       /* Active/focus */
```

### Component Patterns

#### Ambient Card
```css
.ambient-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);  /* 0.75rem */
  transition: all 0.4s var(--ease-out);
}
.ambient-card:hover {
  border-color: var(--border-glow);
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.15);
}
```

#### Glass Card
```css
.glass-card {
  background: rgba(19, 19, 29, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
```

#### Glow Button (Primary CTA)
```css
.glow-button {
  background: linear-gradient(135deg, var(--glow-purple), #7c3aed);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  min-height: 44px;  /* Touch target */
}
```

#### Input
```css
.ambient-input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  min-height: 48px;  /* Touch target */
}
.ambient-input:focus {
  border-color: var(--glow-purple);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}
```

### Animations

| Name | Effect | Usage |
|------|--------|-------|
| fadeIn | Opacity + translateY(8px) | Page loads, list items |
| slideUp | Opacity + translateY(16px) | Section reveals |
| scaleIn | Opacity + scale(0.95) | Modals, dialogs |
| shimmer | Background gradient sweep | Loading skeletons |
| pulse-ring | Expanding glow ring | Active indicators |
| float | Gentle vertical bob | Decorative elements |
| gradient-shift | Background position shift | Animated gradients |
| slideInRight | translateX(100% → 0) | Toast notifications |
| shrink | Width 100% → 0% | Toast progress bars |

### Typography

- **Font**: Inter (400, 500, 600, 700, 800)
- **Headings**: 700-800 weight, tight letter-spacing
- **Body**: 400-500 weight, 1.6 line-height
- **Labels**: 600 weight, uppercase, letter-spacing 0.05em
- **Prices**: 700 weight, tabular-nums, green color

### Touch Targets

All interactive elements have `min-height: 44px` (Apple HIG standard) for thumb-friendly mobile use.

### MOST POPULAR Badge Pattern

Used on pricing/plan cards to highlight the recommended plan:
- Card uses `overflow: visible` when popular (not hidden)
- Badge positioned at `top: -0.625rem` with `zIndex: 1` (above card)
- Card gets extra `paddingTop: 1.75rem 1.5rem 1.5rem` to accommodate badge
- Badge: absolute positioned, purple gradient background, white text, uppercase, small font

---

## 10. Page Map — Route Architecture

### Public Pages

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/` | `src/app/page.tsx` | SSG | Homepage with hero, features, pricing, testimonials |
| `/explore` | `src/app/explore/page.tsx` | SSR | Store discovery, search, categories |
| `/favorites` | `src/app/favorites/page.tsx` | CSR | Device-based wishlist |
| `/account` | `src/app/account/page.tsx` | CSR | Customer dashboard, order lookup |
| `/offline` | `src/app/offline/page.tsx` | SSG | Offline fallback page |
| `/{slug}` | `src/app/[slug]/page.tsx` | SSR | Public store page |
| `/{slug}/product/{id}` | `src/app/[slug]/product/[id]/page.tsx` | SSR | Product detail page |

### Auth Pages

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/auth/login` | `src/app/auth/login/page.tsx` | CSR | Email/password login, dynamic branding |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | CSR | Account registration, dynamic branding |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | CSR | Request password reset, dynamic branding |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | CSR | Set new password, dynamic branding |
| `/auth/verify-email` | `src/app/auth/verify-email/page.tsx` | CSR | Enter 6-digit verification code, dynamic branding |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Server | OAuth callback handler |

### Vendor Dashboard Pages

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/dashboard` | `src/app/dashboard/page.tsx` | CSR | Vendor dashboard (analytics, quick actions) |
| `/dashboard/products` | `src/app/dashboard/products/page.tsx` | CSR | Product management list |
| `/dashboard/products/new` | `src/app/dashboard/products/new/page.tsx` | CSR | Create new product |
| `/dashboard/products/[id]` | `src/app/dashboard/products/[id]/page.tsx` | CSR | Edit existing product |
| `/dashboard/customer` | `src/app/dashboard/customer/page.tsx` | CSR | Customer-facing dashboard |
| `/dashboard/support` | `src/app/dashboard/support/page.tsx` | CSR | Support ticket system |
| `/onboarding` | `src/app/onboarding/page.tsx` | CSR | Multi-step store setup wizard |
| `/upgrade` | `src/app/upgrade/page.tsx` | CSR | Subscription plan selection |
| `/order/[id]` | `src/app/order/[id]/page.tsx` | CSR | Order detail + timeline |

### Admin Pages

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/admin` | `src/app/admin/page.tsx` | CSR | Admin overview dashboard |
| `/admin/stores` | `src/app/admin/stores/page.tsx` | CSR | Store management |
| `/admin/users` | `src/app/admin/users/page.tsx` | CSR | User management |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | CSR | Order management |
| `/admin/subscriptions` | `src/app/admin/subscriptions/page.tsx` | CSR | Subscription dashboard |
| `/admin/support` | `src/app/admin/support/page.tsx` | CSR | Support ticket panel |
| `/admin/notifications` | `src/app/admin/notifications/page.tsx` | CSR | Notification composer |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | CSR | Platform settings (6 tabs: General, Branding, Email, Payments, AI, Security) |
| `/admin/system` | `src/app/admin/system/page.tsx` | CSR | System health |

### Static/Utility

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/sitemap.xml` | `src/app/sitemap.ts` | Dynamic | Dynamic sitemap generation |
| `/robots.txt` | `src/app/robots.ts` | Dynamic | Robots.txt generation |
| `/api/og` | `src/app/api/og/route.ts` | Server | OG image generation |

---

## 11. API Map — Endpoint Architecture

### Auth API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Authenticate + set cookies |
| POST | `/api/auth/logout` | Yes | Clear session |
| POST | `/api/auth/verify-email` | No | Verify 6-digit code |
| POST | `/api/auth/send-verification` | No | Resend verification code |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Set new password |

### Store API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/stores` | No | Get store by slug (public) |
| POST | `/api/stores` | Yes | Create new store |
| PATCH | `/api/stores` | Yes | Update store settings |
| GET | `/api/stores/search` | No | Search stores (public) |

### Product API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/products` | No | List products by store |
| POST | `/api/products` | Yes | Create product |
| PATCH | `/api/products/[id]` | Yes | Update product |
| DELETE | `/api/products/[id]` | Yes | Delete product |

### Order API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/orders` | Yes | List vendor's orders |
| POST | `/api/orders` | No | Create order (public) |
| PATCH | `/api/orders/[id]` | Yes | Update order status |
| POST | `/api/orders/lookup` | No | Lookup order by email |

### Review API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/reviews` | No | List reviews for product |
| POST | `/api/reviews` | No | Create review |
| DELETE | `/api/reviews` | Yes | Delete review (owner/author) |
| POST | `/api/reviews/batch` | No | Batch ratings for products |

### Favorites API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/favorites` | No | Get device favorites |
| POST | `/api/favorites` | No | Add favorite |
| DELETE | `/api/favorites` | No | Remove favorite |

### Analytics API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/analytics` | No | Track event |
| GET | `/api/analytics/visitors` | Yes | Get visitor count |

### Payment API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/payments/initialize` | Yes | Start Paystack payment |
| POST | `/api/webhooks/paystack` | No | Paystack webhook (HMAC verified) |

### Support API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/support/tickets` | Yes | List vendor's tickets |
| POST | `/api/support/tickets` | Yes | Create support ticket |
| GET | `/api/support/tickets/[id]` | Yes | Get ticket with messages |
| PATCH | `/api/support/tickets/[id]` | Yes | Update ticket status |
| POST | `/api/support/tickets/[id]/messages` | Yes | Send message in thread |

### Admin API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/admin/stores` | Admin | List all stores |
| PATCH | `/api/admin/stores/[id]` | Admin | Update store (admin) |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/orders` | Admin | List all orders |
| PATCH | `/api/admin/orders` | Admin | Update order status |
| GET | `/api/admin/system` | Admin | System health stats |
| GET | `/api/admin/notifications` | Admin | List notifications |
| POST | `/api/admin/notifications` | Admin | Send notification |
| GET | `/api/admin/settings` | Admin | Get platform settings |
| PATCH | `/api/admin/settings` | Admin | Update platform settings |

### Utility API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/upload` | Yes | Image upload + compression |
| GET | `/api/inventory/check` | Yes | Check low stock items |
| GET | `/api/cron/check-expiry` | Cron | Daily subscription expiry check |

### Branding API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/branding` | No | Get logo_url, favicon_url, platform_name (public, cached) |

---

## 12. Component Map — UI Architecture

### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| Particles | `src/components/Particles.tsx` | Ambient floating particle canvas |
| ProductCard | `src/components/ProductCard.tsx` | Product display with carousel, heart, share |
| ProductGrid | `src/components/ProductGrid.tsx` | Responsive product grid with batch ratings |
| CartDrawer | `src/components/CartDrawer.tsx` | Slide-out cart with checkout flow |
| ReviewList | `src/components/ReviewList.tsx` | Product reviews with auth-aware deletion |
| ReviewForm | `src/components/ReviewForm.tsx` | Star rating + comment form |
| SearchInput | `src/components/SearchInput.tsx` | Debounced search with autocomplete dropdown |
| FilterPills | `src/components/FilterPills.tsx` | Category filter pills |
| ShareCard | `src/components/ShareCard.tsx` | Product sharing with QR code |
| VisitorBadge | `src/components/VisitorBadge.tsx` | Visit counter badge |
| VariantManager | `src/components/VariantManager.tsx` | Product variant CRUD |
| OrderManager | `src/components/OrderManager.tsx` | Order list with status management |
| StoreSettings | `src/components/StoreSettings.tsx` | Store config form |
| ThemeSettings | `src/components/ThemeSettings.tsx` | Theme customization form |
| DynamicBranding | `src/components/DynamicBranding.tsx` | Updates favicon, apple-touch-icon, og:image, document title from branding API |
| HomeStructuredData | `src/components/HomeStructuredData.tsx` | Homepage FAQ + HowTo structured data for AI crawlers |
| EmailEditor | `src/components/email-editor/EmailEditor.tsx` | Drag-and-drop canvas email builder (6 element types, resize, keyboard shortcuts) |

### Dashboard Components

| Component | File | Purpose |
|-----------|------|---------|
| DashboardClient | `src/app/dashboard/DashboardClient.tsx` | Main vendor dashboard |
| DashboardProductGrid | `src/components/DashboardProductGrid.tsx` | Product list in dashboard |
| SupportDashboard | `src/app/dashboard/support/SupportDashboard.tsx` | Support ticket UI |
| CustomerDashboard | `src/app/dashboard/customer/CustomerDashboard.tsx` | Customer account page |

### Admin Components

| Component | File | Purpose |
|-----------|------|---------|
| AdminOverview | `src/app/admin/AdminOverview.tsx` | Admin dashboard stats |
| AdminStores | `src/app/admin/stores/AdminStores.tsx` | Store management — 2-column grid with inline badges |
| AdminUsers | `src/app/admin/users/AdminUsers.tsx` | User management — expandable rows |
| AdminOrders | `src/app/admin/orders/AdminOrders.tsx` | Order management — expandable rows with status update |
| SubscriptionsClient | `src/app/admin/subscriptions/SubscriptionsClient.tsx` | Subscription dashboard — card-based expandable layout |
| AdminSystem | `src/app/admin/system/AdminSystem.tsx` | System health — environment checks, database stats |
| AdminSupport | `src/app/admin/support/page.tsx` | Support panel — 2-column detail view (collapses on mobile) |
| AdminNotifications | `src/app/admin/notifications/page.tsx` | Notification composer with email editor integration |
| AdminSettings | `src/app/admin/settings/page.tsx` | Platform settings — 6 tab components (General, Branding, Email, Payments, AI, Security) |

### Onboarding Components

| Component | File | Purpose |
|-----------|------|---------|
| PlanSelectionStep | `src/components/onboarding/PlanSelectionStep.tsx` | Plan picker |
| StoreDetailsStep | `src/components/onboarding/StoreDetailsStep.tsx` | Store name/desc/number |
| ProductEntryStep | `src/components/onboarding/ProductEntryStep.tsx` | Product setup with description + AI generate button |
| ThemeStep | `src/components/onboarding/ThemeStep.tsx` | Theme customization |
| SetupCompleteStep | `src/components/onboarding/SetupCompleteStep.tsx` | Completion screen |

### UI Components

| Component | File | Purpose |
|-----------|------|---------|
| AlertContext | `src/contexts/AlertContext.tsx` | Toast + confirm dialog system |

---

## 13. Library Map — Business Logic

### Core Libraries

| Library | File | Purpose |
|---------|------|---------|
| Supabase Server | `src/lib/supabase/server.ts` | Cookie-based server client |
| Supabase API | `src/lib/supabase/api.ts` | API route server client |
| Supabase Middleware | `src/lib/supabase/middleware.ts` | Session refresh + auth check |
| Supabase Client | `src/lib/supabase/client.ts` | Browser client |
| Supabase Shared | `src/lib/supabase.ts` | Public queries (getStoreBySlug, etc.) |

### Business Logic

| Library | File | Purpose |
|---------|------|---------|
| Subscription | `src/lib/subscription.ts` | Plan definitions, limits, helpers |
| Paystack | `src/lib/paystack.ts` | Payment init, verify, webhook sig |
| Email | `src/lib/email.ts` | Brevo API, 8 email templates, dynamic platform name |
| WhatsApp | `src/lib/whatsapp.ts` | Order message generation |
| Admin | `src/lib/admin.ts` | Admin verification helper |
| SEO | `src/lib/seo.ts` | GEO/AEO schema generators (StoreWithGeo, ProductWithRatings) |
| Channel | `src/lib/channel.ts` | Multi-channel helpers (WhatsApp, Instagram) |

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| useBranding | `src/hooks/useBranding.ts` | Fetches logo/favicon/platform_name from /api/branding with localStorage caching (5min TTL) |
| useMediaQuery | `src/hooks/useMediaQuery.ts` | Client-side responsive media query |
| useAnalytics | `src/hooks/useAnalytics.ts` | Client-side analytics tracking |

### Subscription Plans

| Plan | Price | Products | Duration | Features |
|------|-------|----------|----------|----------|
| Trial | ₦0 | 10 | 5 days | Basic storefront, WhatsApp checkout |
| Monthly | ₦3,500/mo | 20 | 30 days | + Order tracking, basic analytics |
| Quarterly | ₦7,500/3mo | 50 | 90 days | + Custom colors, advanced analytics |
| 6-Month | ₦12,000/6mo | Unlimited | 180 days | + Verified badge, priority support |

### Email Templates

| Template | Trigger | Recipient |
|----------|---------|-----------|
| Verification | Signup | New user |
| Welcome | Email verified | New user |
| Password Reset | Forgot password | User |
| Trial Expiry | 3 days before / 1 day before | Vendor |
| Subscription Expiry | 3 days before / 1 day before | Vendor |
| Low Stock Alert | Stock below threshold | Vendor |
| Order Notification | New order created | Vendor |
| Status Update | Order status changed | Customer |
| Support Ticket | New ticket created | Admin |
| Support Reply | Admin replies to ticket | Vendor |

---

## 14. Context Map — State Architecture

### AlertContext

```typescript
// src/contexts/AlertContext.tsx
interface AlertContextValue {
  alert: (message, options?) => void;    // General toast
  success: (message, duration?) => void;  // Green toast
  error: (message, duration?) => void;    // Red toast
  info: (message, duration?) => void;     // Cyan toast
  warning: (message, duration?) => void;  // Amber toast
  confirm: (options) => Promise<boolean>; // Modal dialog
}

// Connected to 24 files across auth, dashboard, admin, store pages
```

### Cart State (localStorage)

```typescript
// Managed via React state + localStorage
interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

// Persisted key: "stallhq_cart"
// Device-based: no auth required
```

### Favorites State (localStorage)

```typescript
// Managed via React state + localStorage + Supabase
// Device ID: generated UUID, persisted in localStorage
// Synced to Supabase favorites table
```

### Branding State (useBranding hook)

```typescript
// src/hooks/useBranding.ts
// Fetches logo_url, favicon_url, platform_name from /api/branding
// Cached in module-level variable + localStorage (stallhq_branding) with 5min TTL
// Provides: useBranding() hook, getPlatformNameSync() utility, refresh() method
// DynamicBranding component auto-updates <head> (favicon, apple-touch-icon, og:image, title)
```

---

## 15. Email System — Notification Architecture

### Brevo Integration

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  API Route  │────▶│  email.ts    │────▶│  Brevo REST API │
│  (trigger)  │     │  (template)  │     │  (delivery)     │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Dark HTML  │
                    │  Template   │
                    │  Wrapper    │
                    └─────────────┘
```

### Email Design

All emails use a consistent dark theme wrapper:
- Background: `#06060b`
- Card: `#13131d` with `rgba(255,255,255,0.06)` border
- Accent: Purple gradient for CTAs
- Typography: System font stack, 14-15px body
- Footer: Dynamic platform name via `getPlatformName()` (fetched from platform_settings)

### Email Flow

1. Event triggers (signup, order, support ticket)
2. API route calls email function from `src/lib/email.ts`
3. Function builds HTML using `emailWrapper()` template
4. Sends POST to Brevo API (`https://api.brevo.com/v3/smtp/email`)
5. Returns success/failure (no retry — fire and forget for notifications)

---

## 16. Payment System — Subscription Architecture

### Paystack Integration

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Upgrade    │────▶│  /api/       │────▶│  Paystack API   │
│  Page       │     │  payments/   │     │  (initialize)   │
└─────────────┘     │  initialize  │     └─────────────────┘
                    └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  Redirect   │
                    │  to Paystack│
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐     ┌─────────────────┐
                    │  Paystack   │────▶│  /api/webhooks/ │
                    │  Checkout   │     │  paystack       │
                    └─────────────┘     └────────┬────────┘
                                                 │
                                          ┌──────┴──────┐
                                          │  Verify +   │
                                          │  Update DB  │
                                          └─────────────┘
```

### Payment Flow

1. Vendor clicks "Upgrade" on `/upgrade` page
2. Selects plan → POST `/api/payments/initialize`
3. API creates Paystack transaction (amount in kobo)
4. Returns authorization URL
5. Frontend redirects to Paystack checkout
6. Vendor completes payment
7. Paystack sends webhook to `/api/webhooks/paystack`
8. Webhook verifies HMAC-SHA512 signature
9. Verifies transaction via Paystack API
10. Updates `stores.plan`, `stores.subscription_expires_at`
11. Creates `payments` record
12. Redirects vendor to `/dashboard?payment=success`

### Subscription Enforcement

- **Product count**: Checked on product creation, enforced via `hasReachedProductLimit()`
- **Theme customization**: Only quarterly+ plans via `canCustomizeTheme()`
- **Verified badge**: Only 6-month plan via `getVerifiedBadge()`
- **Trial expiry**: Cron job checks daily at 9am UTC via `/api/cron/check-expiry`
- **Store visibility**: Expired stores hidden from public pages

---

## 17. WhatsApp Integration — Order Flow

### WhatsApp Order Message

```
*New Order from {storeName}*

------

1. {productName}
   {variantName}: {variantValue}
   Qty: {quantity} x ₦{price}
   Subtotal: ₦{subtotal}

------

*TOTAL: ₦{total}*

------

I would like to place this order.
```

### Flow

```
1. Customer adds products to cart (localStorage)
2. Clicks "Order on WhatsApp" in CartDrawer
3. CartDrawer:
   a. Creates order record via POST /api/orders
   b. Generates WhatsApp URL with pre-filled message
   c. Opens WhatsApp via window.open()
   d. Redirects to /order/{orderId}
4. Vendor receives message on WhatsApp
5. Negotiates/confirmes deal on WhatsApp
6. Vendor updates order status in dashboard
7. Customer can track at /order/{orderId}
```

### Follow-Up Message

```
*Follow-up: Order #XXXXXXX from {storeName}*

------

1. {productName}
   Qty: {quantity} x ₦{price}

------

*TOTAL: ₦{total}*

------

Hi, I'm following up on my order above. Thank you!
```

---

## 18. SEO Infrastructure

### Technical SEO

| Feature | Implementation |
|---------|---------------|
| Sitemap | Dynamic `/sitemap.xml` — all stores + products + /about |
| Robots.txt | Dynamic `/robots.txt` — allows all, points to sitemap |
| Structured Data | Product schema (JSON-LD) on product pages |
| Store Schema | Store structured data (address, contact, rating) |
| Meta Tags | Title template, description, OG tags, Twitter cards |
| Canonical URLs | metadataBase set to `https://hqlink.vercel.app` |
| Semantic HTML | Proper heading hierarchy, landmarks |
| Image alt text | Product images with descriptive alt |

### GEO (Geographic) Optimization

| Feature | Implementation |
|---------|---------------|
| geo.region | Meta tag on store pages (default: NG-LA) |
| geo.placename | Meta tag on store pages (default: Lagos) |
| geo.position | Lat/long meta tag from store settings |
| ICBM | Comma-separated lat/long meta tag |
| LocalBusiness Schema | JSON-LD with GeoCoordinates, address, areaServed |

### AEO (Answer Engine) Optimization

| Feature | Implementation |
|---------|---------------|
| Organization Schema | Root layout — company info for AI search |
| WebSite Schema | Root layout with SearchAction for AI search |
| SoftwareApplication Schema | App listing schema in root layout |
| FAQ Schema | Homepage (6 FAQs), /about page (9 FAQs) |
| HowTo Schema | Step-by-step instructions for AI crawlers |
| BreadcrumbList | All store and product pages |
| WebPage Summaries | AI-crawler-optimized summaries on store/product pages |
| /about Page | AI-crawler-optimized with comprehensive FAQ, HowTo, structured data |

### On-Page SEO

| Element | Implementation |
|---------|---------------|
| Title | `{Product Name} | stallHq` template |
| Description | Product/store description or auto-generated |
| OG Image | Auto-generated via `/api/og` |
| Keywords | Defined in root layout metadata |
| Locale | `en_NG` (Nigerian English) |

---

## 19. PWA — Progressive Web App

### Manifest

```json
{
  "name": "StallHq",
  "short_name": "StallHq",
  "description": "Digital storefronts for WhatsApp-based vendors",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#a855f7",
  "orientation": "portrait-primary",
  "categories": ["shopping", "business"]
}
```

### Service Worker

- Registered in root layout via inline script
- Caches static assets for offline access
- Offline page at `/offline` for failed loads

### Installability

- Add to Home Screen on Android/iOS
- Standalone mode (no browser chrome)
- Portrait orientation lock

---

## 20. Admin Panel — Platform Management

### Admin Access

- UUID-based: `ADMIN_USER_ID` env var (comma-separated)
- Email-based redirect: `zerupth@gmail.com` → `/admin` after login
- Service role client for writes to tables without RLS policies

### Admin Pages

| Page | Purpose |
|------|---------|
| Overview | Total stores, users, orders, revenue, recent activity |
| Stores | Search, view, manage all vendor stores — 2-column grid with inline badges (plan, status, days left) |
| Users | Search, view all registered users — expandable rows |
| Orders | Search, update status for any order — expandable rows with notes |
| Subscriptions | Plan distribution, expiring subscriptions — card-based expandable layout |
| Support | Filter tickets, reply, manage status — 2-column detail view (collapses on mobile) |
| Notifications | Compose and send announcements by plan segment, drag-and-drop email editor |
| Settings | 6-tab config: General, Branding (logo/favicon upload), Email, Payments, AI, Security |
| System | System health, database stats, environment checks |

### Admin Mobile Responsive

All admin pages use:
- `padding: clamp(1rem,3vw,1.5rem)` for responsive container padding
- `admin-store-row`, `admin-user-row`, `admin-order-row` CSS classes for mobile row collapse
- `admin-support-detail` for 2-column → 1-column stack on mobile
- `admin-hide-mobile` to hide secondary columns on small screens
- Horizontal scrollable tabs on settings page

### Admin Security

- All admin API routes check `isAdmin(userId)` before proceeding
- Write operations use service role client (bypasses RLS)
- Admin notifications use `admin_notifications` table (service role INSERT)
- Platform settings use `platform_settings` table (service role UPDATE)

---

## 21. Security Model

### Authentication Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | Supabase Auth (bcrypt) |
| Session management | HttpOnly cookies via @supabase/ssr |
| CSRF protection | SameSite=Strict cookies |
| Rate limiting | Supabase built-in |
| Verification codes | `crypto.randomInt()` (not Math.random) |
| Code expiry | 15 minutes for email verification |
| Token expiry | 1 hour for password reset |

### Authorization Security

| Measure | Implementation |
|---------|---------------|
| Row Level Security | Enabled on all tables |
| Owner verification | RLS policies check auth.uid() = user_id |
| Admin bypass | Service role client for admin writes |
| Input validation | Server-side validation on all API routes |
| Status validation | Enum checks on order/ticket status updates |
| Slug validation | Regex check on store slug creation |
| Price validation | Positive number check on product creation |

### API Security

| Measure | Implementation |
|---------|---------------|
| Webhook verification | HMAC-SHA512 signature check (Paystack) |
| Environment variables | Secrets never logged or exposed to client |
| Error messages | Generic messages to client, detailed logs server-side |
| CORS | Next.js default (same origin) |
| Payload size | Next.js default limits |

### Data Security

| Measure | Implementation |
|---------|---------------|
| No PII in logs | Email/cookie logging cleaned from middleware |
| No secrets in code | All secrets in env vars |
| Storage access | Authenticated upload, public read |
| Admin emails | Derived server-side (not from client input) |
| Sender role | Derived from auth (not client-provided) |

---

## 22. Deployment & Infrastructure

### Vercel Configuration

```json
{
  "buildCommand": "npx next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/check-expiry",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Build

- **Command**: `npx next build` (Turbopack)
- **Output**: 63 routes (20 static, 43 dynamic)
- **Build time**: ~19 seconds
- **Platform**: Windows x64

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/check-expiry` | Daily 9am UTC | Check subscription/trial expiry, send reminders |

### Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server only) |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `BREVO_API_KEY` | Brevo email API key |
| `BREVO_SENDER_EMAIL` | Sender email address |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `ADMIN_USER_ID` | Comma-separated admin UUIDs |
| `CRON_SECRET` | Cron job authentication |

---

## 23. File Tree — Complete Structure

```
stallHq/
├── public/
│   ├── icons/
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── [slug]/
│   │   │   ├── page.tsx                    # Public store page
│   │   │   └── product/[id]/page.tsx       # Product detail page
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Admin sidebar + responsive CSS
│   │   │   ├── page.tsx                    # Admin overview
│   │   │   ├── AdminOverview.tsx
│   │   │   ├── stores/page.tsx
│   │   │   ├── stores/AdminStores.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── users/AdminUsers.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/AdminOrders.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── subscriptions/SubscriptionsClient.tsx
│   │   │   ├── system/page.tsx
│   │   │   ├── system/AdminSystem.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── account/
│   │   │   │   └── delete/route.ts              # Delete account (deletes all data)
│   │   │   ├── admin/
│   │   │   │   ├── notifications/route.ts
│   │   │   │   ├── orders/route.ts
│   │   │   │   ├── settings/route.ts
│   │   │   │   ├── stores/route.ts
│   │   │   │   ├── stores/[id]/route.ts
│   │   │   │   ├── system/route.ts
│   │   │   │   └── users/route.ts
│   │   │   ├── analytics/route.ts
│   │   │   ├── analytics/visitors/route.ts
│   │   │   ├── branding/route.ts                # Public branding API (logo, favicon, platform name)
│   │   │   ├── auth/
│   │   │   │   ├── forgot-password/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   ├── send-verification/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── verify-email/route.ts
│   │   │   ├── cron/check-expiry/route.ts
│   │   │   ├── favorites/route.ts
│   │   │   ├── ai/
│   │   │   │   └── generate-description/route.ts # AI product description generator
│   │   │   ├── inventory/check/route.ts
│   │   │   ├── og/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── orders/[id]/route.ts
│   │   │   ├── orders/lookup/route.ts
│   │   │   ├── payments/initialize/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── products/[id]/route.ts
│   │   │   ├── products/recommended/route.ts    # Recommended products (trial store fallback)
│   │   │   ├── reviews/route.ts
│   │   │   ├── reviews/batch/route.ts
│   │   │   ├── stores/route.ts
│   │   │   ├── stores/search/route.ts
│   │   │   ├── support/tickets/route.ts
│   │   │   ├── support/tickets/[id]/route.ts
│   │   │   ├── support/tickets/[id]/messages/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── webhooks/paystack/route.ts
│   │   ├── auth/
│   │   │   ├── callback/route.ts
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── DashboardClient.tsx
│   │   │   ├── customer/page.tsx
│   │   │   ├── customer/CustomerDashboard.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── products/new/page.tsx
│   │   │   ├── products/[id]/page.tsx
│   │   │   └── support/page.tsx
│   │   │   └── support/SupportDashboard.tsx
│   │   ├── about/
│   │   │   └── page.tsx                         # AI-crawler-optimized about page
│   │   ├── account/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── offline/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── order/[id]/page.tsx
│   │   ├── upgrade/page.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── PlanSelectionStep.tsx
│   │   │   ├── StoreDetailsStep.tsx
│   │   │   ├── ProductEntryStep.tsx
│   │   │   ├── ThemeStep.tsx
│   │   │   └── SetupCompleteStep.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── DashboardProductGrid.tsx
│   │   ├── DynamicBranding.tsx                   # Updates <head> from branding API
│   │   ├── HomeStructuredData.tsx                # FAQ + HowTo schemas for homepage
│   │   ├── OrderManager.tsx
│   │   ├── Particles.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewList.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FilterPills.tsx
│   │   ├── ShareCard.tsx
│   │   ├── StorePage.tsx
│   │   ├── StoreSettings.tsx
│   │   ├── ThemeSettings.tsx
│   │   ├── VariantManager.tsx
│   │   ├── VisitorBadge.tsx
│   │   └── email-editor/
│   │       ├── EmailEditor.tsx                   # Drag-and-drop canvas builder
│   │       ├── index.ts
│   │       └── types.ts
│   ├── contexts/
│   │   └── AlertContext.tsx
│   ├── hooks/
│   │   ├── useAnalytics.ts
│   │   ├── useBranding.ts                      # Logo/favicon/platform_name with localStorage cache
│   │   └── useMediaQuery.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── api.ts
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   ├── admin.ts
│   │   ├── channel.ts                           # Multi-channel helpers (WhatsApp, Instagram)
│   │   ├── email.ts
│   │   ├── paystack.ts
│   │   ├── seo.ts                               # GEO/AEO schema generators
│   │   ├── subscription.ts
│   │   ├── supabase.ts
│   │   └── whatsapp.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   ├── admin-setup.sql
│   ├── auth_tables.sql
│   ├── customer-features.sql
│   ├── favorites.sql
│   ├── order-notes.sql
│   ├── payments.sql
│   ├── schema.sql
│   ├── subscriptions.sql
│   ├── support-tickets.sql
│   └── instagram-channel.sql
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── PROJECT.md
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 24. Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Yes | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Public | Yes | App base URL (`https://hqlink.vercel.app`) |
| `BREVO_API_KEY` | Secret | Yes | Brevo SMTP API key |
| `BREVO_SENDER_EMAIL` | Secret | Yes | Brevo sender email |
| `PAYSTACK_SECRET_KEY` | Secret | Yes | Paystack secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Yes | Paystack public key |
| `ADMIN_USER_ID` | Secret | Yes | Comma-separated admin UUIDs |
| `CRON_SECRET` | Secret | Yes | Cron job auth secret |

---

## 25. SQL Migrations — Database Evolution

### Migration Order

| # | File | Purpose |
|---|------|---------|
| 1 | `schema.sql` | Core tables: stores, products, variants, orders, analytics, reviews + RLS + storage |
| 2 | `auth_tables.sql` | email_verifications, password_resets + RLS |
| 3 | `subscriptions.sql` | Add plan, verified, trial_ends_at, subscription_expires_at to stores |
| 4 | `payments.sql` | payments table + RLS |
| 5 | `favorites.sql` | favorites table (device-based) + RLS |
| 6 | `customer-features.sql` | customer_id on orders, low_stock_threshold on stores |
| 7 | `support-tickets.sql` | support_tickets, support_messages, admin_notifications, platform_settings + RLS |
| 8 | `order-notes.sql` | vendor_notes column on orders |
| 9 | `admin-setup.sql` | Documentation for admin user setup |
| 10 | `instagram-channel.sql` | instagram_handle column on stores |

---

## 26. Solutions — Problems Solved

| Problem | Solution |
|---------|----------|
| WhatsApp vendors have no online presence | Public storefronts at `stallhq.link/{slug}` |
| Products hidden in chat history | Searchable, filterable product catalog |
| Manual "price?" responses | Pre-filled WhatsApp order messages |
| No order tracking | `/order/{id}` with status timeline |
| No customer discovery | `/explore` page with search and categories |
| No analytics | Visit, click, view tracking per store |
| No professional appearance | Custom themes, logos, banners |
| Expensive platform alternatives | Zero hosting cost (Vercel + Supabase free tier) |
| Complex onboarding | 5-step wizard, live in minutes |
| No mobile optimization | Mobile-first, 44px touch targets, Opera Mini support |
| No offline support | PWA with service worker |
| No SEO | Sitemap, structured data, OG tags |
| No customer retention | Favorites, reorder, account dashboard |
| No vendor support | Ticket system with threaded conversations |
| No platform monetization | Subscription bundles with Paystack |
| No admin control | Full admin panel with settings |
| Inconsistent error handling | Custom alert/toast/confirm system |
| Native `alert()`/`confirm()` | Professional modal replacements |
| PII in logs | Cleaned middleware and email logs |
| N+1 query problem | Batch ratings endpoint |
| RLS bypass for admin | Service role client for admin writes |
| Multi-admin support | Comma-separated ADMIN_USER_ID parsing |

---

## 27. Parts & Purpose — Every File Explained

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `tsconfig.json` | TypeScript config (paths, strict mode) |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Tailwind CSS config |
| `postcss.config.mjs` | PostCSS with Tailwind plugin |
| `vercel.json` | Vercel deploy config + cron |
| `.env.local` | Environment variables (secrets) |
| `.gitignore` | Git ignore rules |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |

### Source Files

Every file in `src/` has been documented in the Component Map, Library Map, and Page Map sections above. See:
- [Page Map](#10--page-map--route-architecture) — All page routes
- [API Map](#11--api-map--endpoint-architecture) — All API endpoints
- [Component Map](#12--component-map--ui-architecture) — All UI components
- [Library Map](#13--library-map--business-logic) — All business logic

---

## 28. Connection Map — How Everything Links

### Data Flow Connections

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Homepage   │────▶│  /explore    │────▶│  Store Page     │
│  (CTA)     │     │  (search)    │     │  (/{slug})      │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                            ┌──────┴──────┐
                                            │  Product    │
                                            │  Detail     │
                                            └──────┬──────┘
                                                   │
                                            ┌──────┴──────┐
                                            │  Cart       │
                                            │  Drawer     │
                                            └──────┬──────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                    ┌─────────┴─────────┐ ┌────────┴────────┐ ┌─────────┴─────────┐
                    │  WhatsApp Order   │ │  Order Record   │ │  Order Detail     │
                    │  (wa.me link)     │ │  (POST /api)    │ │  (/order/{id})    │
                    └───────────────────┘ └─────────────────┘ └───────────────────┘
```

### Auth Flow Connections

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Signup     │────▶│  Verify      │────▶│  Login          │
│  (/auth/*)  │     │  Email       │     │  (/auth/login)  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                    ┌─────────┴─────────┐ ┌────────┴────────┐ ┌─────────┴─────────┐
                    │  Vendor Dashboard │ │  Customer Dash   │ │  Admin Panel      │
                    │  (/dashboard)     │ │  (/dashboard/    │ │  (/admin)         │
                    │                   │ │   customer)      │ │                   │
                    └─────────┬─────────┘ └─────────────────┘ └─────────┬─────────┘
                              │                                          │
                    ┌─────────┴─────────┐                    ┌─────────┴─────────┐
                    │  Store Management │                    │  Platform Mgmt    │
                    │  Products, Orders │                    │  Users, Stores    │
                    │  Settings, Theme  │                    │  Support, Config  │
                    └───────────────────┘                    └───────────────────┘
```

### Payment Flow Connections

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Upgrade    │────▶│  Initialize  │────▶│  Paystack       │
│  Page       │     │  Payment     │     │  Checkout       │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                            ┌──────┴──────┐
                                            │  Webhook    │
                                            │  (verify)   │
                                            └──────┬──────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                    ┌─────────┴─────────┐ ┌────────┴────────┐ ┌─────────┴─────────┐
                    │  Update Store     │ │  Create Payment │ │  Send Email       │
                    │  Plan + Expiry    │ │  Record         │ │  Notification     │
                    └───────────────────┘ └─────────────────┘ └───────────────────┘
```

---

## 29. Decisions — Technical Rationale

| Decision | Rationale |
|----------|-----------|
| **No on-platform payments** | WhatsApp is the business channel. stallHq is a catalog, not a marketplace. |
| **Cookie-based auth** | SSR support, works with Next.js middleware, secure HttpOnly |
| **Custom email verification** | Supabase auto-confirm disabled for branded 6-digit code flow |
| **Inline styles over Tailwind** | Layout reliability across all pages, consistent with design system |
| **localStorage for cart** | No auth required, instant, persists across sessions |
| **Device-based favorites** | No auth barrier, works for anonymous browsing |
| **Service role for admin writes** | RLS doesn't have admin policies; service role bypasses cleanly |
| **Brevo over SendGrid** | Free tier (300/day), REST API, no SDK dependency |
| **Paystack over Stripe** | Nigeria-native, Naira support, instant settlement |
| **Turbopack** | 10x faster builds than Webpack, default in Next.js 16 |
| **CSS variables over Tailwind theme** | Runtime theming for store customization, consistent design system |
| **`crypto.randomInt()`** | Cryptographically secure verification codes |
| **Batch ratings endpoint** | Eliminates N+1 query problem in ProductGrid |
| **Server-derived sender_role** | Prevents client-side spoofing of admin/vendor messages |
| **Ticket ownership verification** | Prevents unauthorized access to support conversations |
| **Comma-separated admin IDs** | Supports multiple admins without code changes |
| **Dynamic hostname in dashboard** | Avoids hardcoded URLs, works across environments |
| **Fire-and-forget emails** | Notification emails shouldn't block user operations |

---

## 30. Future Roadmap

### Phase 5 — Launch & Growth

- [ ] Vendor onboarding email sequence
- [ ] Customer referral program
- [ ] Store analytics dashboard enhancements
- [ ] Product comparison feature
- [ ] Bulk product import (CSV)
- [ ] Multi-language support (Yoruba, Igbo, Hausa)
- [ ] Vendor mobile app (React Native)
- [ ] Customer mobile app
- [ ] WhatsApp Business API integration (official)
- [ ] Automated order confirmations via WhatsApp
- [ ] Vendor subscription invoicing
- [ ] Tax calculation
- [ ] Shipping integration (GIG, Kwik)
- [ ] Customer reviews with photos
- [ ] Vendor ratings and rankings
- [ ] Marketplace discovery (top vendors, trending products)
- [ ] API for third-party integrations
- [ ] Webhook system for external integrations

### Phase 6 — Scale

- [ ] Multi-vendor marketplace mode
- [ ] Escrow payment system
- [ ] Dispute resolution
- [ ] Vendor analytics (conversion funnel)
- [ ] Customer segmentation
- [ ] A/B testing for storefronts
- [ ] CDN for product images
- [ ] Real-time inventory sync
- [ ] Multi-currency support
- [ ] International expansion (Ghana, Kenya, South Africa)

---

*Last updated: June 2026*
*Version: 0.1.0*
*Status: MVP Complete — Launching*

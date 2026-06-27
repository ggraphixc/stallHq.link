# stallHq

Digital storefronts for WhatsApp & Instagram vendors across Nigeria and Africa.

Turn your WhatsApp or Instagram into a full online store. Customers browse products, place orders, and you get notified instantly — no app needed.

**Live:** [hqlink.vercel.app](https://hqlink.vercel.app)

## Features

- **Custom Store URL** — stallhq.link/yourstore
- **WhatsApp & Instagram Integration** — orders land in your DMs
- **Order Management Dashboard** — track pending, confirmed, delivered
- **QR Code Generation** — for offline sales
- **AI Product Descriptions** — auto-generate with AI
- **Verified Vendor Badge** — build customer trust
- **Theme Customization** — 6 preset themes, custom fonts
- **Analytics** — track visits, clicks, product views
- **Batch Product Upload** — add multiple products at once
- **Email Notifications** — order alerts, status updates, marketing sequences
- **Favorites** — customers can save products (device-based, no auth needed)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth (cookie-based via `@supabase/ssr`)
- **Payments:** Paystack
- **Email:** Brevo (Sendinblue) API
- **UI:** Radix UI, Lucide Icons
- **Styling:** CSS Variables ("Ambient Dark" design system)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `BREVO_SENDER_EMAIL` | Sender email address |
| `NEXT_PUBLIC_APP_URL` | Production URL (default: https://hqlink.vercel.app) |
| `ADMIN_USER_ID` | Comma-separated user IDs for admin access |
| `CRON_SECRET` | Secret for cron job authentication |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook signature secret |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [slug]/             # Public storefront pages
│   ├── admin/              # Admin panel
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Vendor dashboard
│   ├── explore/            # Public store explorer
│   └── onboarding/         # Store setup wizard
├── components/             # React components
│   ├── onboarding/         # Onboarding wizard steps
│   ├── email-editor/       # Email template editor
│   └── ui/                 # Reusable UI components
├── contexts/               # React contexts (AlertProvider)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client configs
│   ├── email.ts            # Brevo email integration
│   ├── paystack.ts         # Paystack payment integration
│   ├── subscription.ts     # Plan definitions & limit checks
│   └── seo.ts              # SEO structured data generators
└── types/                  # TypeScript type definitions
```

## Routes

- `/` — Marketing homepage
- `/[slug]` — Public storefront
- `/[slug]/product/[id]` — Product detail page
- `/explore` — Browse all stores
- `/onboarding` — Store setup wizard
- `/dashboard` — Vendor dashboard
- `/admin` — Admin panel
- `/auth/login`, `/auth/signup` — Authentication
- `/upgrade` — Subscription management

## API Routes

- `POST /api/stores` — Create/update store
- `GET /api/stores` — Get user's store
- `POST /api/products` — Create product
- `POST /api/orders` — Create order
- `GET /api/orders` — List orders for store
- `POST /api/analytics` — Track analytics event
- `GET /api/analytics` — Get store analytics
- `POST /api/payments/initialize` — Start Paystack checkout
- `GET /api/payments/verify` — Verify payment
- `POST /api/webhooks/paystack` — Paystack webhook handler
- `GET /api/cron/check-expiry` — Daily trial/subscription expiry check
- `GET /api/cron/marketing` — Daily marketing email sequences

## Deployment

Deployed on Vercel. Push to `main` branch to trigger automatic deployment.

```bash
npm run build  # Build for production
```

## License

Private — All rights reserved.

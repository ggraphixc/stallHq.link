# stallHq Mobile App

React Native (Expo) app for stallHq — digital storefronts for WhatsApp & Instagram vendors.

## Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development
npx expo start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

## Project Structure

```
app/
├── index.tsx              # Root redirect (auth → vendor, guest → role select)
├── _layout.tsx            # Root layout with auth provider
├── (auth)/
│   ├── select-role.tsx    # Choose vendor or customer
│   ├── login.tsx          # Email/password login
│   └── signup.tsx         # Vendor registration
├── (vendor)/
│   ├── _layout.tsx        # Vendor stack
│   ├── (tabs)/
│   │   ├── index.tsx      # Dashboard home (stats, recent orders)
│   │   ├── products.tsx   # Product management
│   │   ├── orders.tsx     # Order management with filters
│   │   └── analytics.tsx  # Analytics with charts
│   ├── orders/[id].tsx    # Order detail + status update
│   └── products/new.tsx   # Add new product
└── (customer)/
    ├── _layout.tsx        # Customer stack
    ├── (tabs)/
    │   ├── index.tsx      # Explore stores
    │   ├── favorites.tsx  # Saved stores
    │   └── profile.tsx    # Profile + settings
    └── store/[slug].tsx   # Store detail + WhatsApp order
lib/
├── supabase.ts            # Supabase client + types
├── auth.tsx               # Auth context provider
└── theme.ts               # Colors, spacing, typography
```

## Features

### Vendor Side
- 📊 Dashboard with stats (products, orders, revenue)
- 📦 Product management (add, toggle availability, delete)
- 🛒 Order management with status filters and updates
- 📈 Analytics with conversion funnel, best day, bar chart
- 🔍 Pull-to-refresh on all screens

### Customer Side
- 🔍 Browse and search active stores
- 🏪 Store detail with products and pricing
- 💬 Order via WhatsApp (pre-filled message)
- ❤️ Save favorite stores
- 👤 Profile with settings

## Building

```bash
# Android APK
npx expo build:android

# iOS (requires Mac)
npx expo build:ios

# EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
```

## Push Notifications (Coming Soon)

Will use Expo Push Notifications + Supabase for real-time order alerts.

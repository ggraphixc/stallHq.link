import { Store, SubscriptionPlan } from "@/types";

/* ── Plan Definitions ───────────────────────────── */

export interface PlanInfo {
  name: string;
  tagline: string;
  price: number;
  billingLabel: string;
  monthlyBreakdown: number;
  productLimit: number;
  features: string[];
  savings?: string;
  popular?: boolean;
  color: string;
  icon: string;
}

export const PLANS: Record<SubscriptionPlan, PlanInfo> = {
  trial: {
    name: "Free Trial",
    tagline: "Test the waters — no card needed",
    price: 0,
    billingLabel: "5-day free trial",
    monthlyBreakdown: 0,
    productLimit: 10,
    color: "var(--text-muted)",
    icon: "trial",
    features: [
      "Up to 10 products",
      "WhatsApp checkout",
      "Custom store URL",
      "Basic storefront",
    ],
  },
  monthly: {
    name: "Monthly",
    tagline: "Perfect for getting started",
    price: 3500,
    billingLabel: "billed monthly",
    monthlyBreakdown: 3500,
    productLimit: 20,
    color: "var(--glow-purple)",
    icon: "monthly",
    features: [
      "Up to 20 products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
      "Basic analytics",
    ],
  },
  quarterly: {
    name: "Quarterly",
    tagline: "Best value for growing stores",
    price: 7500,
    billingLabel: "billed every 3 months",
    monthlyBreakdown: 2500,
    productLimit: 50,
    savings: "Save ₦3,000 vs monthly",
    popular: true,
    color: "var(--glow-green)",
    icon: "quarterly",
    features: [
      "Up to 50 products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
      "Advanced analytics",
      "Custom brand colors",
    ],
  },
  annual: {
    name: "6-Month",
    tagline: "For serious sellers scaling up",
    price: 12000,
    billingLabel: "billed every 6 months",
    monthlyBreakdown: 2000,
    productLimit: 0,
    savings: "Save ₦9,000 vs monthly",
    color: "var(--glow-cyan)",
    icon: "annual",
    features: [
      "Unlimited products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
      "Advanced analytics",
      "Custom brand colors",
      "Verified vendor badge",
      "Priority support",
    ],
  },
};

/* ── Feature Comparison Matrix ──────────────────── */

export interface ComparisonFeature {
  name: string;
  trial: string | boolean;
  monthly: string | boolean;
  quarterly: string | boolean;
  annual: string | boolean;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { name: "Products", trial: "10", monthly: "20", quarterly: "50", annual: "Unlimited" },
  { name: "WhatsApp checkout", trial: true, monthly: true, quarterly: true, annual: true },
  { name: "Custom store URL", trial: true, monthly: true, quarterly: true, annual: true },
  { name: "Order tracking", trial: false, monthly: true, quarterly: true, annual: true },
  { name: "Analytics dashboard", trial: false, monthly: "Basic", quarterly: "Advanced", annual: "Advanced" },
  { name: "Custom brand colors", trial: false, monthly: false, quarterly: true, annual: true },
  { name: "Verified badge", trial: false, monthly: false, quarterly: false, annual: true },
  { name: "Priority support", trial: false, monthly: false, quarterly: false, annual: true },
];

/* ── Helper Functions ───────────────────────────── */

export function isSubscriptionActive(store: Store): boolean {
  const now = new Date();
  if (store.plan === "trial") {
    return store.trial_ends_at ? new Date(store.trial_ends_at) > now : false;
  }
  if (store.subscription_expires_at) {
    return new Date(store.subscription_expires_at) > now;
  }
  return true;
}

export function isTrial(store: Store): boolean {
  return store.plan === "trial";
}

export function isTrialExpired(store: Store): boolean {
  if (store.plan !== "trial") return false;
  if (!store.trial_ends_at) return true;
  return new Date(store.trial_ends_at) <= new Date();
}

export function getProductLimit(store: Store): number {
  return PLANS[store.plan].productLimit;
}

export function hasReachedProductLimit(store: Store, currentProductCount: number): boolean {
  const limit = getProductLimit(store);
  if (limit === 0) return false;
  return currentProductCount >= limit;
}

export function getRemainingProducts(store: Store, currentProductCount: number): number {
  const limit = getProductLimit(store);
  if (limit === 0) return Infinity;
  return Math.max(0, limit - currentProductCount);
}

export function canCustomizeTheme(store: Store): boolean {
  return store.plan === "annual" || store.plan === "quarterly";
}

export function getVerifiedBadge(store: Store): boolean {
  return store.verified;
}

export function getDaysRemaining(store: Store): number | null {
  const expiry = store.plan === "trial" ? store.trial_ends_at : store.subscription_expires_at;
  if (!expiry) return null;
  const now = new Date();
  const end = new Date(expiry);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getPlanName(plan: SubscriptionPlan): string {
  return PLANS[plan].name;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export function getNextPlan(current: SubscriptionPlan): SubscriptionPlan | null {
  if (current === "trial") return "monthly";
  if (current === "monthly") return "quarterly";
  if (current === "quarterly") return "annual";
  return null;
}

/** Get plan progress percentage (0-100) for product usage */
export function getPlanUsagePercent(store: Store, productCount: number): number {
  const limit = getProductLimit(store);
  if (limit === 0) return 0; // unlimited
  if (limit === -1) return 0;
  return Math.min(100, Math.round((productCount / limit) * 100));
}

import { Store, SubscriptionPlan } from "@/types";

/* ── Plan Definitions ───────────────────────────── */

export interface PlanInfo {
  name: string;
  tagline: string;
  price: number;           // ₦ — one-time or per-month
  billingLabel: string;    // e.g. "billed monthly", "upfront"
  monthlyBreakdown: number; // effective ₦/month
  productLimit: number;    // 0 = unlimited
  features: string[];
  savings?: string;        // e.g. "Saves ₦3,000"
  popular?: boolean;       // highlight as best value
}

export const PLANS: Record<SubscriptionPlan, PlanInfo> = {
  trial: {
    name: "Free Trial",
    tagline: "Test the waters with zero risk",
    price: 0,
    billingLabel: "5-day free trial",
    monthlyBreakdown: 0,
    productLimit: 10,
    features: [
      "Up to 10 products",
      "WhatsApp checkout",
      "Basic storefront",
    ],
  },
  monthly: {
    name: "Monthly Standard",
    tagline: "Test the waters with zero risk",
    price: 3500,
    billingLabel: "billed monthly",
    monthlyBreakdown: 3500,
    productLimit: 20,
    features: [
      "Up to 20 products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
    ],
  },
  quarterly: {
    name: "3-Month Growth",
    tagline: "One full stock season completely sorted",
    price: 7500,
    billingLabel: "upfront",
    monthlyBreakdown: 2500,
    productLimit: 50,
    savings: "Saves ₦3,000",
    popular: true,
    features: [
      "Up to 50 products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
      "Basic analytics",
    ],
  },
  annual: {
    name: "6-Month Premium",
    tagline: "Set it, forget it, and scale your brand",
    price: 12000,
    billingLabel: "upfront",
    monthlyBreakdown: 2000,
    productLimit: 0, // unlimited
    savings: "Saves ₦9,000",
    features: [
      "Unlimited products",
      "WhatsApp checkout",
      "Custom store URL",
      "Order tracking",
      "Advanced analytics",
      "Custom brand colors",
      "Verified vendor badge",
    ],
  },
};

/* ── Helper Functions ───────────────────────────── */

/** Whether the user's subscription is currently active (paid plan not expired, or trial not expired) */
export function isSubscriptionActive(store: Store): boolean {
  const now = new Date();

  if (store.plan === "trial") {
    return store.trial_ends_at ? new Date(store.trial_ends_at) > now : false;
  }

  // Paid plans
  if (store.subscription_expires_at) {
    return new Date(store.subscription_expires_at) > now;
  }

  // No expiry set — treat as active (shouldn't happen after payment flow)
  return true;
}

/** Whether the store is in trial period (hasn't started paying yet) */
export function isTrial(store: Store): boolean {
  return store.plan === "trial";
}

/** Whether the trial has expired */
export function isTrialExpired(store: Store): boolean {
  if (store.plan !== "trial") return false;
  if (!store.trial_ends_at) return true;
  return new Date(store.trial_ends_at) <= new Date();
}

/** Product limit for the plan. 0 = unlimited */
export function getProductLimit(store: Store): number {
  return PLANS[store.plan].productLimit;
}

/** Whether the store has reached its product limit */
export function hasReachedProductLimit(store: Store, currentProductCount: number): boolean {
  const limit = getProductLimit(store);
  if (limit === 0) return false; // unlimited
  return currentProductCount >= limit;
}

/** Remaining products allowed */
export function getRemainingProducts(store: Store, currentProductCount: number): number {
  const limit = getProductLimit(store);
  if (limit === 0) return Infinity;
  return Math.max(0, limit - currentProductCount);
}

/** Whether the plan allows custom theme colors */
export function canCustomizeTheme(store: Store): boolean {
  return store.plan === "annual" || store.plan === "quarterly";
}

/** Whether the store gets the verified badge */
export function getVerifiedBadge(store: Store): boolean {
  return store.verified;
}

/** Days remaining in trial or subscription */
export function getDaysRemaining(store: Store): number | null {
  const expiry = store.plan === "trial" ? store.trial_ends_at : store.subscription_expires_at;
  if (!expiry) return null;
  const now = new Date();
  const end = new Date(expiry);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Human-readable plan name */
export function getPlanName(plan: SubscriptionPlan): string {
  return PLANS[plan].name;
}

/** Format price in Naira */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/** Upgrade path — which plan to suggest next */
export function getNextPlan(current: SubscriptionPlan): SubscriptionPlan | null {
  if (current === "trial") return "monthly";
  if (current === "monthly") return "quarterly";
  if (current === "quarterly") return "annual";
  return null; // already on top tier
}

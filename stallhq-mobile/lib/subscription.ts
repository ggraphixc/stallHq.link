import { Store, SubscriptionPlan } from "./supabase";

// Plan metadata — mirrors src/lib/subscription.ts on the web
export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  trial: "Trial",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "6-Month",
};

export const PLAN_PRODUCT_LIMITS: Record<SubscriptionPlan, number> = {
  trial: 10,
  monthly: 20,
  quarterly: 50,
  annual: 0, // 0 = unlimited
};

export function isTrial(store: Store): boolean {
  return store.plan === "trial";
}

/** Days until trial (trial plans) or subscription (paid plans) expires. Null if no expiry set. */
export function getDaysRemaining(store: Store): number | null {
  const expiry =
    store.plan === "trial" ? store.trial_ends_at : store.subscription_expires_at;
  if (!expiry) return null;
  const diffMs = new Date(expiry).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getPlanName(store: Store): string {
  return PLAN_NAMES[store.plan];
}

export function getProductLimit(store: Store): number {
  return PLAN_PRODUCT_LIMITS[store.plan];
}

export function getPlanUsagePercent(store: Store, productCount: number): number {
  const limit = getProductLimit(store);
  if (limit === 0) return 0; // unlimited
  return Math.min(100, Math.round((productCount / limit) * 100));
}

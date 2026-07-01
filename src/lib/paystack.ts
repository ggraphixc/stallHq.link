import crypto from "crypto";
import { SubscriptionPlan } from "@/types";
import { PLANS } from "@/lib/subscription";

/* ── Paystack API Helpers ───────────────────────── */

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = "https://api.paystack.co";

/** Convert Naira to kobo */
export function nairaToKobo(naira: number): number {
  return naira * 100;
}

/** Get amount in kobo for a plan */
export function getPlanAmountKobo(plan: SubscriptionPlan): number {
  return nairaToKobo(PLANS[plan].price);
}

/** Compute subscription expiry date based on plan */
export function getSubscriptionExpiry(plan: SubscriptionPlan): Date {
  const now = new Date();
  switch (plan) {
    case "monthly":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "quarterly":
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case "annual":
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      return now;
  }
}

/** Generate a unique payment reference */
export function generateReference(prefix: string = "stallhq"): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}

/* ── Paystack API Calls ─────────────────────────── */

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string | null;
    status: string; // "abandoned", "failed", "success"
    reference: string;
    message: string | null;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
  };
}

/** Initialize a Paystack transaction */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
  const body = {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    currency: "NGN",
    callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    metadata: params.metadata || {},
  };

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to initialize payment");
  }

  return res.json();
}

/** Verify a Paystack transaction */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to verify payment");
  }

  return res.json();
}

/** Verify Paystack webhook signature */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = PAYSTACK_SECRET
): boolean {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

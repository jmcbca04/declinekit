export const PLANS = {
  starter: { name: "Starter", price: 29, limit: "Up to $10k MRR", env: "STRIPE_PRICE_STARTER" },
  growth: { name: "Growth", price: 79, limit: "Up to $50k MRR", env: "STRIPE_PRICE_GROWTH" },
  scale: { name: "Scale", price: 149, limit: "Up to $250k MRR", env: "STRIPE_PRICE_SCALE" },
} as const;
export type PlanId = keyof typeof PLANS;

// The free offer: DeclineKit is free until it has recovered this much for the account,
// or for this many days after signup, whichever comes first.
export const FREE_RECOVERY_CENTS = 100_00;
export const FREE_DAYS = 60;
export const FREE_OFFER = "Free until we recover your first $100";
export const FREE_OFFER_LONG = "Free until we recover your first $100 or for 60 days, whichever comes first. No card needed.";

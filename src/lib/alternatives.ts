// Honest comparison pages. Prices checked October 2026; keep the "checked" note on the page in sync.
export type Alternative = {
  slug: string;
  name: string;
  pricing: string;
  focus: string;
  summary: string;
  theyDoBetter: string[];
  pickUsIf: string[];
  switchNote: string;
};

export const PRICES_CHECKED = "October 2026";

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "churnkey",
    name: "Churnkey",
    pricing: "From $250/month billed yearly, or $300/month billed monthly (Starter)",
    focus: "Retention suite: cancel flows, payment recovery, analytics",
    summary:
      "Churnkey is a full retention suite: cancel flows, payment recovery and churn analytics in one product, built for teams with real churn volume.",
    theyDoBetter: [
      "Cancel flows with offers and pauses, which DeclineKit doesn’t do",
      "Retention analytics across voluntary and involuntary churn",
      "Support for billing systems beyond Stripe",
    ],
    pickUsIf: [
      "Your problem is declined cards, not customers clicking cancel",
      "You’re under $250k MRR and $250/month is more than recovery is worth to you yet",
      "You want to see it recover real money before you pay anything: it's free until it recovers your first $100",
    ],
    switchNote: "Churnkey's cancel flows can stay. If you move only payment recovery to DeclineKit, turn off Churnkey's failed-payment emails first so customers don't get two emails about the same invoice.",
  },
  {
    slug: "churn-buster",
    name: "Churn Buster",
    pricing: "Dunning from $269/month, set by your MRR tier",
    focus: "Failed-payment campaigns plus cancel flows",
    summary:
      "Churn Buster is a long-running failed-payment recovery tool with campaign builders, cancel flows and a team that has tuned dunning for years.",
    theyDoBetter: [
      "Highly configurable email campaigns and branching",
      "Cancel flows alongside payment recovery",
      "Years of recovery data behind their defaults",
    ],
    pickUsIf: [
      "You want a sensible sequence that works out of the box, not a campaign builder",
      "You’re a small team on Stripe and want flat pricing from $29/month",
      "You want every email to read like a note from the founder",
      "You'd rather try it free until it recovers your first $100 than start on a paid plan",
    ],
    switchNote: "Pause your Churn Buster failed-payment campaign before you switch on DeclineKit's emails, so nobody gets two sequences at once. Invoices that are already failing are picked up when you connect.",
  },
  {
    slug: "baremetrics-recover",
    name: "Baremetrics Recover",
    pricing: "+$129/month add-on to a Baremetrics plan",
    focus: "Subscription analytics, with recovery as an add-on",
    summary:
      "Recover is the failed-payment add-on to Baremetrics, the subscription analytics product. It makes the most sense if you already pay for Baremetrics.",
    theyDoBetter: [
      "Recovery sits next to full subscription analytics: MRR, churn, LTV, forecasting",
      "In-app reminders and paywalls for customers with failed payments",
    ],
    pickUsIf: [
      "You don’t need a metrics dashboard, just the money back",
      "You don’t want to pay for an analytics plan to get dunning",
      "You want flat pricing that starts at $29/month",
      "You want to try it free until it recovers your first $100",
    ],
    switchNote: "You can keep Baremetrics for analytics and still use DeclineKit for recovery. Just turn off Recover's dunning emails first so customers only hear from one of you.",
  },
];

export const findAlternative = (slug: string) => ALTERNATIVES.find((a) => a.slug === slug);

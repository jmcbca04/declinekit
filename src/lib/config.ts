// DeclineKit Cloud (declinekit.com) and self-hosted installs run the same code.
// Cloud turns on the parts that only make sense for the hosted service: the marketing site and
// public stats, plans and billing, the founder's welcome email, and site analytics.
// Self-hosted installs leave DECLINEKIT_CLOUD unset: no billing, no limits, just the app.
export const CLOUD = process.env.DECLINEKIT_CLOUD === "true";

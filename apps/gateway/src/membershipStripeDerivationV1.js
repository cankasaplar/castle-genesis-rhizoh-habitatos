/**
 * Pure derivation of membership fields from a Stripe Subscription object (REST shape).
 * Used only by the gateway webhook — keep in sync with client `membershipCoreV1.js` plan rules.
 */

/** @param {Set<string>} premiumPriceIdSet */
export function deriveMembershipFieldsFromStripeSubscription(subscription, premiumPriceIdSet) {
  const status = String(subscription?.status || "incomplete");
  const priceIds = (subscription?.items?.data || [])
    .map((x) => x?.price?.id)
    .filter(Boolean);
  const matchesPremium = priceIds.some((id) => premiumPriceIdSet.has(String(id)));
  const entitled = matchesPremium && (status === "active" || status === "trialing");
  return {
    plan: entitled ? "premium" : "free",
    subscriptionStatus: status,
    stripeCustomerId: subscription?.customer ? String(subscription.customer) : null,
    stripeSubscriptionId: subscription?.id ? String(subscription.id) : null,
    currentPeriodEndSec: typeof subscription?.current_period_end === "number" ? subscription.current_period_end : null
  };
}

export function premiumPriceIdSetFromEnv() {
  const raw = String(process.env.STRIPE_PREMIUM_PRICE_ID || "").trim();
  const set = new Set();
  if (raw) set.add(raw);
  const multi = String(process.env.STRIPE_PREMIUM_PRICE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of multi) set.add(id);
  return set;
}

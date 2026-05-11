/**
 * vNext-Membership-Core (client): read-only view of Firestore `memberships/{uid}` + Rhizoh access map.
 * Authoritative writes: Stripe webhook → gateway Admin SDK only.
 */

export const MEMBERSHIP_SCHEMA_VERSION = 1;

/** @typedef {{ schemaVersion?: number, membershipPlan?: string, subscriptionStatus?: string, currentPeriodEndSec?: number | null }} MembershipDocLike */

/**
 * Normalizes raw Firestore membership doc for UI / gates.
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function normalizeMembershipDoc(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      schemaVersion: MEMBERSHIP_SCHEMA_VERSION,
      membershipPlan: "free",
      subscriptionStatus: "none",
      currentPeriodEndSec: null
    };
  }
  const plan = String(raw.membershipPlan || raw.plan || "free").toLowerCase();
  const status = String(raw.subscriptionStatus || "none").toLowerCase();
  const sec = raw.currentPeriodEndSec;
  return {
    schemaVersion: Number(raw.schemaVersion) || MEMBERSHIP_SCHEMA_VERSION,
    membershipPlan: plan === "premium" ? "premium" : "free",
    subscriptionStatus: status,
    currentPeriodEndSec: typeof sec === "number" && Number.isFinite(sec) ? sec : null
  };
}

/**
 * Premium entitlement: paid plan flag for access control (not "economy").
 * @param {ReturnType<typeof normalizeMembershipDoc>} m
 */
export function isPremiumEntitlement(m) {
  if (!m) return false;
  if (m.membershipPlan !== "premium") return false;
  const s = m.subscriptionStatus;
  return s === "active" || s === "trialing";
}

/**
 * Maps membership → Rhizoh capability flags (YouTube/broadcast stays output-only; these gate *influence*).
 * @param {Record<string, unknown> | null | undefined} membershipRaw
 */
export function buildRhizohAccessLayer(membershipRaw) {
  const m = normalizeMembershipDoc(membershipRaw);
  const premium = isPremiumEntitlement(m);
  return {
    schemaVersion: 1,
    membershipPlan: m.membershipPlan,
    subscriptionStatus: m.subscriptionStatus,
    ghostEvolutionStageCap: premium ? 4 : 2,
    civicMemoryStrataDepth: premium ? 6 : 2,
    liveStreamParticipation: premium ? "influence" : "observe",
    presenceInfluenceWeight: premium ? 1 : 0.35,
    broadcastPresenceHook: premium
  };
}

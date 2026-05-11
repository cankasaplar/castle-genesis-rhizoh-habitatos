/**
 * R7 — Constitutional policy governance — R6 önerilerinin yaşam döngüsü, shadow karşılaştırma, rollback sinyali.
 * Saf fonksiyonlar; kalıcı mağaza gateway / operasyon katmanında tutulur.
 */

import { RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1 } from "./constitutionalDecisionLayerV1.js";

export const RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION = "1.0.0";

/** @typedef {"draft"|"approved"|"active"|"rejected"|"rolled_back"} RhizohConstitutionalPolicyLifecycleStatus */

/**
 * @typedef {{
 *   policyVersion: string,
 *   status: RhizohConstitutionalPolicyLifecycleStatus,
 *   thresholds?: Partial<typeof RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1>,
 *   policyId?: string,
 *   approvedBy?: string | null,
 *   approvedAt?: number | null,
 *   rejectedBy?: string | null,
 *   rejectedAt?: number | null,
 *   rejectionReason?: string | null,
 *   parentVersion?: string | null,
 *   notes?: string | null
 * }} RhizohConstitutionalPolicyPackage
 */

const THRESHOLD_KEYS = new Set(Object.keys(RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1));

/**
 * @param {unknown} raw
 * @returns {RhizohConstitutionalPolicyPackage | null}
 */
export function normalizeRhizohConstitutionalPolicyPackage(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const policyVersion = String(o.policyVersion || "").trim();
  if (!policyVersion) return null;
  const status = String(o.status || "draft");
  const allowed = new Set(["draft", "approved", "active", "rejected", "rolled_back"]);
  if (!allowed.has(status)) return null;

  /** @type {Record<string, number>} */
  const thresholds = {};
  const tIn = o.thresholds && typeof o.thresholds === "object" ? /** @type {Record<string, unknown>} */ (o.thresholds) : {};
  for (const [k, v] of Object.entries(tIn)) {
    if (!THRESHOLD_KEYS.has(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) thresholds[k] = n;
  }

  return {
    policyVersion,
    status: /** @type {RhizohConstitutionalPolicyLifecycleStatus} */ (status),
    thresholds: Object.keys(thresholds).length ? thresholds : undefined,
    policyId: o.policyId != null ? String(o.policyId) : undefined,
    approvedBy: o.approvedBy != null ? String(o.approvedBy) : null,
    approvedAt: o.approvedAt != null ? Number(o.approvedAt) : null,
    rejectedBy: o.rejectedBy != null ? String(o.rejectedBy) : null,
    rejectedAt: o.rejectedAt != null ? Number(o.rejectedAt) : null,
    rejectionReason: o.rejectionReason != null ? String(o.rejectionReason) : null,
    parentVersion: o.parentVersion != null ? String(o.parentVersion) : null,
    notes: o.notes != null ? String(o.notes) : null
  };
}

/**
 * @param {RhizohConstitutionalPolicyPackage} draft
 * @param {string} approver
 */
export function approveRhizohConstitutionalPolicyDraft(draft, approver) {
  return {
    ...draft,
    status: "approved",
    approvedBy: String(approver || "unknown"),
    approvedAt: Date.now(),
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null
  };
}

/**
 * @param {RhizohConstitutionalPolicyPackage} draft
 * @param {string} actor
 * @param {string} reason
 */
export function rejectRhizohConstitutionalPolicyDraft(draft, actor, reason) {
  return {
    ...draft,
    status: "rejected",
    rejectedBy: String(actor || "unknown"),
    rejectedAt: Date.now(),
    rejectionReason: String(reason || "unspecified")
  };
}

/**
 * Aktif paketi baseline ile birleştirir (yalnız bilinen anahtarlar).
 * @param {RhizohConstitutionalPolicyPackage | null} pkg
 */
export function mergeRhizohConstitutionalGovernanceThresholds(pkg) {
  const base = { ...RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1 };
  const th = pkg?.thresholds && typeof pkg.thresholds === "object" ? pkg.thresholds : {};
  for (const [k, v] of Object.entries(th)) {
    if (!THRESHOLD_KEYS.has(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) /** @type {Record<string, number>} */ (base)[k] = n;
  }
  return base;
}

/**
 * @param {Record<string, unknown>} primary
 * @param {Record<string, unknown>} shadow
 */
export function compareRhizohConstitutionalShadowDecisions(primary, shadow) {
  const pa = String(primary?.action ?? "");
  const sa = String(shadow?.action ?? "");
  const diverged = pa !== sa;
  const deltaConfidence =
    primary?.confidence != null && shadow?.confidence != null
      ? Math.round((Number(primary.confidence) - Number(shadow.confidence)) * 1000) / 1000
      : null;

  return {
    governanceVersion: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    diverged,
    primaryAction: pa,
    shadowAction: sa,
    deltaConfidence,
    primarySeverity: primary?.severityRank ?? null,
    shadowSeverity: shadow?.severityRank ?? null
  };
}

/**
 * Rolling aggregate üzerinde otomatik rollback **adayı** (kesin değil — insan/onay önerilir).
 * @param {Partial<{
 *   sampleCount: number,
 *   rejectRate: number,
 *   throttleRate: number,
 *   recoveryRate: number,
 *   latencyOkRate: number | null,
 *   negativeOutcomeRate: number | null
 * }>} m
 */
export function evaluateRhizohConstitutionalRollbackTriggers(m = {}) {
  const n = Math.max(0, Math.floor(Number(m.sampleCount ?? 0)));
  const rejectRate = Number(m.rejectRate ?? 0);
  const throttleRate = Number(m.throttleRate ?? 0);
  const recoveryRate = Number(m.recoveryRate ?? 0);
  const latencyOkRate = m.latencyOkRate != null ? Number(m.latencyOkRate) : null;
  const negativeOutcomeRate = m.negativeOutcomeRate != null ? Number(m.negativeOutcomeRate) : null;

  /** @type {{ triggerId: string, fired: boolean, detail: string }[]} */
  const triggers = [];

  const push = (triggerId, fired, detail) => triggers.push({ triggerId, fired, detail });

  push(
    "R7-R01_reject_spiral",
    n >= 120 && rejectRate > 0.14,
    `n=${n},rejectRate=${rejectRate}`
  );

  push(
    "R7-R02_throttle_despite_latency",
    n >= 120 && throttleRate > 0.32 && latencyOkRate != null && latencyOkRate > 0.9,
    `throttleRate=${throttleRate},latencyOkRate=${latencyOkRate}`
  );

  push(
    "R7-R03_recovery_fatigue",
    n >= 120 && recoveryRate > 0.22,
    `recoveryRate=${recoveryRate}`
  );

  push(
    "R7-R04_user_negative",
    n >= 60 && negativeOutcomeRate != null && negativeOutcomeRate > 0.35,
    `negativeOutcomeRate=${negativeOutcomeRate}`
  );

  const shouldSuggestRollback = triggers.some((t) => t.fired);

  return {
    governanceVersion: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    shouldSuggestRollback,
    triggers,
    evaluatedAt: Date.now()
  };
}

/**
 * Deterministik örnekleme — A/B veya canary (`pct` ∈ [0,100]).
 * @param {string} traceId
 * @param {number} pct
 */
export function rhizohConstitutionalStableBucketUnderPct(traceId, pct) {
  const p = Math.max(0, Math.min(100, Number(pct)));
  if (p <= 0) return false;
  if (p >= 100) return true;
  const s = String(traceId || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const bucket = h % 100;
  return bucket < p;
}

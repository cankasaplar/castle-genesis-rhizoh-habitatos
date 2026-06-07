/**
 * Regime distance metric v0 — RESEARCH-ONLY.
 * Measures regime shift intensity between checkpoints, NOT baseline drift magnitude.
 * @see docs/academic/regime-checkpoints/REGIME_DISTANCE_METRIC_V0.md
 */

export const REGIME_DISTANCE_SCHEMA_V0 = "castle.regime_distance.v0";

export const LAST_REGIME_CHECKPOINT_REF_V0 =
  "docs/academic/regime-checkpoints/sprint-e/companion-observation-sprint-e-regime-verified-checkpoint-v0.json";

/** Runtime anchor — mirrors archived sprint-e closure checkpoint (not a baseline). */
export const LAST_REGIME_CHECKPOINT_V0 = Object.freeze({
  ledByState: "mixed",
  softInboxCoupling: true,
  passiveCoupling: false,
  inboxTransitionVerified: true,
  explorationIntegrityAtClosure: Object.freeze({
    explorationIntegrityScore: 0.701
  }),
  topologyOwnership: Object.freeze({
    writeCount: 42,
    agentWriteAttempts: 0,
    invariantHeld: true
  }),
  observationInbox: Object.freeze([{}, {}])
});

const LED_BY_ORDINAL_V0 = Object.freeze({ octo: 1, mixed: 0.5, rhizoh: 0 });

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string | undefined} ledBy
 */
function resolveLedByOrdinalV0(ledBy) {
  const key = String(ledBy || "mixed").toLowerCase();
  return LED_BY_ORDINAL_V0[key] ?? 0.5;
}

/**
 * @param {{ inboxTransitionVerified?: boolean, inboxLifecycle?: { closure?: string }, observationInbox?: unknown[] }} cp
 */
function resolveInboxPhaseOrdinalV0(cp) {
  if (cp?.inboxTransitionVerified) return 1;
  const inboxLen = Array.isArray(cp?.observationInbox) ? cp.observationInbox.length : 0;
  if (inboxLen > 0) return 0.85;
  if (cp?.inboxLifecycle?.closure) return 1;
  return 0.35;
}

/**
 * @param {Record<string, unknown>} checkpoint
 */
function readIntegrityV0(checkpoint) {
  const nested = checkpoint?.explorationIntegrityAtClosure ?? checkpoint?.explorationIntegrity;
  if (nested && typeof nested === "object") {
    return clamp01(/** @type {{ explorationIntegrityScore?: number }} */ (nested).explorationIntegrityScore ?? 0);
  }
  return clamp01(checkpoint?.explorationIntegrityScore ?? 0);
}

/**
 * @param {Record<string, unknown>} [a]
 * @param {Record<string, unknown>} [b]
 */
export function computeRegimeDistanceMetricV0(a = {}, b = {}) {
  const ledByA = resolveLedByOrdinalV0(
    /** @type {string | undefined} */ (a.ledByState ?? a.ledBy)
  );
  const ledByB = resolveLedByOrdinalV0(
    /** @type {string | undefined} */ (b.ledByState ?? b.ledBy)
  );
  const ledByShift = clamp01(Math.abs(ledByA - ledByB));

  const integrityGap = clamp01(Math.abs(readIntegrityV0(a) - readIntegrityV0(b)));

  const inboxPhaseGap = clamp01(
    Math.abs(resolveInboxPhaseOrdinalV0(a) - resolveInboxPhaseOrdinalV0(b))
  );

  const couplingA = a.softInboxCoupling === true ? 1 : 0;
  const couplingB = b.softInboxCoupling === true ? 1 : 0;
  const couplingRegimeGap = clamp01(Math.abs(couplingA - couplingB));

  const writesA = Number(
    /** @type {{ writeCount?: number }} */ (a.topologyOwnership ?? a).writeCount ?? 0
  );
  const writesB = Number(
    /** @type {{ writeCount?: number }} */ (b.topologyOwnership ?? b).writeCount ?? 0
  );
  const agentA = Number(
    /** @type {{ agentWriteAttempts?: number }} */ (a.topologyOwnership ?? a).agentWriteAttempts ?? 0
  );
  const agentB = Number(
    /** @type {{ agentWriteAttempts?: number }} */ (b.topologyOwnership ?? b).agentWriteAttempts ?? 0
  );
  const writeStress = clamp01(Math.abs(writesA - writesB) / 48);
  const agentStress = clamp01((agentA + agentB) / 4);
  const invariantStressGap = clamp01(writeStress * 0.7 + agentStress * 0.3);

  const components = Object.freeze({
    ledByShift,
    integrityGap,
    inboxPhaseGap,
    couplingRegimeGap,
    invariantStressGap
  });

  const distance = clamp01(
    ledByShift * 0.28 +
      integrityGap * 0.22 +
      inboxPhaseGap * 0.22 +
      couplingRegimeGap * 0.14 +
      invariantStressGap * 0.14
  );

  const intensity = distance >= 0.55 ? "high" : distance >= 0.28 ? "medium" : "low";

  return Object.freeze({
    schema: REGIME_DISTANCE_SCHEMA_V0,
    distance,
    intensity,
    components,
    interpretation: "regime_shift_intensity — not drift magnitude"
  });
}

/**
 * Live observability slice comparable to archived regime checkpoints.
 * @param {{
 *   explorationIntegrity?: { ledBy?: string, explorationIntegrityScore?: number },
 *   softInboxCoupling?: boolean,
 *   passiveCoupling?: boolean,
 *   topologyOwnership?: { writeCount?: number, agentWriteAttempts?: number, invariantHeld?: boolean } | null,
 *   observationInbox?: unknown[],
 *   unacknowledgedPatterns?: unknown[]
 * }} live
 */
export function buildLiveRegimeCheckpointSliceV0(live = {}) {
  const inboxLen = Array.isArray(live.observationInbox) ? live.observationInbox.length : 0;
  const unackLen = Array.isArray(live.unacknowledgedPatterns) ? live.unacknowledgedPatterns.length : 0;
  const inboxTransitionVerified = inboxLen > 0 && unackLen === 0;

  return Object.freeze({
    ledByState: live.explorationIntegrity?.ledBy ?? "mixed",
    softInboxCoupling: live.softInboxCoupling === true,
    passiveCoupling: live.passiveCoupling === true,
    inboxTransitionVerified,
    explorationIntegrityAtClosure: Object.freeze({
      explorationIntegrityScore: clamp01(live.explorationIntegrity?.explorationIntegrityScore ?? 0)
    }),
    topologyOwnership: Object.freeze({
      writeCount: live.topologyOwnership?.writeCount ?? 0,
      agentWriteAttempts: live.topologyOwnership?.agentWriteAttempts ?? 0,
      invariantHeld: live.topologyOwnership?.invariantHeld !== false
    }),
    observationInbox: live.observationInbox ?? []
  });
}

/**
 * Distance from live session to last archived regime checkpoint.
 * @param {Parameters<typeof buildLiveRegimeCheckpointSliceV0>[0]} live
 * @param {Record<string, unknown>} [lastCheckpoint]
 */
export function computeRegimeDistanceFromLastCheckpointV0(
  live = {},
  lastCheckpoint = LAST_REGIME_CHECKPOINT_V0
) {
  const liveSlice = buildLiveRegimeCheckpointSliceV0(live);
  const metric = computeRegimeDistanceMetricV0(lastCheckpoint, liveSlice);
  return Object.freeze({
    ...metric,
    checkpointRef: LAST_REGIME_CHECKPOINT_REF_V0,
    liveSlice
  });
}

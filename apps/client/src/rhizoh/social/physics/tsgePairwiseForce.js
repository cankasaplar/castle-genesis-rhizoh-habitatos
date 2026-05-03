/**
 * TSGE — pairwise (N-body) interaction kernel.
 * Grid / field theory stays atmospheric; identity recall injects only into edge-level F_ij.
 * F_raw = F_base + α·ΔIdentity_i + β·√ρ_j (sqrt pre-softcap on neighbor density), then saturation.
 */

import { isRecallClosureActive, closureTrustFamSum } from "../../memory/identityPhysicsClosure.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Signed saturation: F / (1 + γ|F|) — preserves sign, caps runaway gravity.
 * @param {number} F
 * @param {number} [gamma]
 */
export function saturateSignedPairwiseForce(F, gamma = 0.62) {
  const x = Number(F) || 0;
  const g = Math.max(0.05, gamma);
  return x / (1 + g * Math.abs(x));
}

/** @param {number} count */
function basePairwiseForce(count) {
  const c = Math.max(1, Number(count) || 1);
  return Math.min(1.22, 0.065 * Math.min(c, 28) + Math.log1p(c) * 0.11);
}

const ALPHA_IDENTITY = 2.75;
const BETA_PHASE_IMPRINT = 0.38;

/**
 * One co-presence edge step (N-body layer).
 * @param {{
 *   prev: Record<string, unknown>,
 *   count: number,
 *   entityA: string,
 *   entityB: string,
 *   operatorId: string,
 *   relA: unknown,
 *   relB: unknown,
 *   closure: unknown,
 *   now: number,
 *   phantomAdditive?: number
 * }} p
 */
export function computeTsgeEdgeStep(p) {
  const prev = p.prev && typeof p.prev === "object" ? p.prev : {};
  const now = Number(p.now) || Date.now();
  const count = Math.max(1, Number(p.count) || 1);
  const op = String(p.operatorId || "").trim();
  const a = String(p.entityA || "").trim();
  const b = String(p.entityB || "").trim();

  const F_base = basePairwiseForce(count);
  const closure = p.closure && typeof p.closure === "object" ? p.closure : null;
  const touchesOperator = op && (a === op || b === op);

  let dIdentity = 0;
  let dPhase = 0;
  if (touchesOperator && isRecallClosureActive(closure, now)) {
    dIdentity = ALPHA_IDENTITY * closureTrustFamSum(closure);
    const relOther = a === op ? p.relB : p.relA;
    const row = relOther && typeof relOther === "object" ? relOther : null;
    if (row) {
      const rho = clamp01(Number(row.trust) || 0) * 0.48 + clamp01(Number(row.familiarity) || 0) * 0.52;
      dPhase = BETA_PHASE_IMPRINT * Math.sqrt(rho) * 0.14;
    }
  }

  const phantom = Math.max(0, Number(p.phantomAdditive) || 0);
  const F_raw = F_base + dIdentity + dPhase + phantom;
  const F_sat = saturateSignedPairwiseForce(F_raw, 0.62);

  return {
    count,
    lastSeenAt: now,
    pairwiseForceRaw: Math.round(F_raw * 1000) / 1000,
    pairwiseSaturatedForce: Math.round(F_sat * 1000) / 1000,
    lastClosureInjectAt: dIdentity !== 0 || dPhase !== 0 ? now : prev.lastClosureInjectAt ?? null,
    lastPhantomShadow: phantom > 0 ? Math.round(phantom * 1000) / 1000 : prev.lastPhantomShadow ?? null
  };
}

/**
 * Max |F_raw| on edges incident to entity (N-body local load proxy).
 * @param {Record<string, unknown>} coPresenceGraph
 * @param {string} entityId
 */
export function maxAbsRawForceForEntity(coPresenceGraph, entityId) {
  const id = String(entityId || "").trim();
  if (!id) return 0;
  const cp = coPresenceGraph && typeof coPresenceGraph === "object" ? coPresenceGraph : {};
  let m = 0;
  for (const k of Object.keys(cp)) {
    const parts = String(k).split("|");
    if (parts.length !== 2 || (parts[0] !== id && parts[1] !== id)) continue;
    const e = cp[k];
    if (!e || typeof e !== "object") continue;
    const r = Math.abs(Number(e.pairwiseForceRaw) || 0);
    if (r > m) m = r;
  }
  return m;
}

/**
 * Variance of |F_sat| across edges — low variance + high streak ⇒ stable attractor (not transient burst).
 * @param {Record<string, unknown>} coPresenceGraph
 */
export function attentionCurvatureVarianceFromGraph(coPresenceGraph) {
  const cp = coPresenceGraph && typeof coPresenceGraph === "object" ? coPresenceGraph : {};
  const vals = [];
  for (const k of Object.keys(cp)) {
    const e = cp[k];
    if (!e || typeof e !== "object") continue;
    const f = Math.abs(Number(e.pairwiseSaturatedForce) || 0);
    if (Number.isFinite(f)) vals.push(f);
  }
  if (vals.length < 2) return { variance: 1, edgeCount: vals.length };
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const v = vals.reduce((a, x) => a + (x - m) * (x - m), 0) / vals.length;
  return { variance: v, edgeCount: vals.length };
}

/**
 * Diagnostics for attention singularity — saturation first; SPAWN hint is rare secondary.
 * @param {Record<string, unknown>} coPresenceGraph
 * @param {Record<string, unknown> | null | undefined} prevTsge
 * @param {number} now
 */
export function stepTsgeSingularityDiagnostics(coPresenceGraph, prevTsge, now) {
  const cp = coPresenceGraph && typeof coPresenceGraph === "object" ? coPresenceGraph : {};
  let maxRaw = 0;
  for (const k of Object.keys(cp)) {
    const e = cp[k];
    if (!e || typeof e !== "object") continue;
    const r = Math.abs(Number(e.pairwiseForceRaw) || 0);
    if (r > maxRaw) maxRaw = r;
  }
  const prev = prevTsge && typeof prevTsge === "object" ? prevTsge : {};
  const THRESH = 1.58;
  const saturated = maxRaw > THRESH;
  const streak = saturated ? Number(prev.saturationStreak || 0) + 1 : 0;
  const SPAWN_AFTER = 16;
  const { variance: attentionCurvatureVariance, edgeCount } = attentionCurvatureVarianceFromGraph(cp);
  const VAR_ATTRACTOR = 0.032;
  const STREAK_ATTRACTOR_MIN = 12;
  const stableAttractorHint =
    streak >= STREAK_ATTRACTOR_MIN && edgeCount >= 2 && attentionCurvatureVariance < VAR_ATTRACTOR;

  return {
    saturationStreak: streak,
    lastMaxRawPairwiseForce: Math.round(maxRaw * 1000) / 1000,
    spawnMitosisHint: streak >= SPAWN_AFTER,
    attentionCurvatureVariance: Math.round(attentionCurvatureVariance * 1_000_000) / 1_000_000,
    stableAttractorHint,
    tsgeEdgeCount: edgeCount,
    updatedAt: now
  };
}

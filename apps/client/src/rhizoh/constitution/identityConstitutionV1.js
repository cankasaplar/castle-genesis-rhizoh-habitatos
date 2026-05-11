/**
 * RHIZOH Identity Constitution v1 — third column of the membrane: who becomes trusted, at what cost,
 * decay, stake, invite topology, revocation / recovery. Complements ActionPolicyMatrix + ClaimContract.
 * Pure primitives; persistence and enforcement live in gateway / stores.
 */

import { RHIZOH_IDENTITY_FLOOR_RANK } from "./actionPolicyMatrixV1.js";

/** @typedef {'ghost' | 'trusted' | 'verified' | 'sovereign_verified'} RhizohIdentityFloor */

/**
 * @typedef {{
 *   invitedBy: string | null,
 *   at: number,
 *   edgeId?: string
 * }} RhizohInviteEdge
 */

/**
 * @typedef {Record<string, RhizohInviteEdge>} RhizohInviteGraph
 */

/**
 * @typedef {{
 *   t: number,
 *   kind: string
 * }} RhizohVelocityEvent
 */

/**
 * @typedef {'none' | 'consent' | 'agents' | 'memory' | 'trace' | 'economic' | 'full'} RhizohRevocationScope
 */

/**
 * @typedef {{
 *   trust: number,
 *   stake: number,
 *   risk: number,
 *   lastActiveAt: number,
 *   firstAnchoredAt: number,
 *   challengeFailures: number,
 *   velocityStrikes: number
 * }} RhizohIdentityConstitutionSnapshot
 */

export const RHIZOH_IDENTITY_CONSTITUTION_VERSION = "1.0.0";

/** Tunable defaults (env wrappers can override in caller). */
export const RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1 = Object.freeze({
  trustDecayHalfLifeMs: 14 * 24 * 60 * 60 * 1000,
  trustAccrueCap: 0.995,
  stakeAccrueCap: 0.995,
  influenceTimeScaleMs: 30 * 24 * 60 * 60 * 1000,
  velocityWindowMs: 60 * 60 * 1000,
  maxTrustLikeEventsPerWindow: 14,
  inviteDepthSybilPenaltyPerHop: 0.12,
  maxInviteDepthConsidered: 8
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Exponential decay of trust toward 0.5 (neutral) over time since last activity.
 * @param {number} trust
 * @param {number} lastActiveAt
 * @param {number} now
 * @param {number} [halfLifeMs]
 */
export function decayRhizohIdentityTrust(trust, lastActiveAt, now, halfLifeMs) {
  const half = halfLifeMs ?? RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.trustDecayHalfLifeMs;
  const t0 = clamp01(trust);
  const dt = Math.max(0, Number(now) - Number(lastActiveAt));
  if (half <= 0 || dt <= 0) return Math.round(t0 * 1000) / 1000;
  const neutral = 0.5;
  const delta = t0 - neutral;
  const factor = Math.pow(0.5, dt / half);
  const t1 = neutral + delta * factor;
  return Math.round(clamp01(t1) * 1000) / 1000;
}

/**
 * @param {number} prevTrust
 * @param {number} delta typically in [-0.2, 0.2]
 * @param {{ cap?: number }} [opts]
 */
export function accrueRhizohIdentityTrust(prevTrust, delta, opts = {}) {
  const cap = opts.cap ?? RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.trustAccrueCap;
  const next = clamp01(Number(prevTrust) + Number(delta));
  return Math.round(Math.min(next, cap) * 1000) / 1000;
}

/**
 * Challenge / verification outcome adjusts trust.
 * @param {number} prevTrust
 * @param {{ passed: boolean, severity?: number }} outcome severity 0..1 (harsh fail)
 */
export function applyRhizohIdentityChallengeToTrust(prevTrust, outcome) {
  const sev = clamp01(outcome.severity ?? 0.55);
  if (outcome.passed) {
    return accrueRhizohIdentityTrust(prevTrust, 0.04 + 0.06 * (1 - sev));
  }
  return accrueRhizohIdentityTrust(prevTrust, -(0.08 + 0.2 * sev));
}

/**
 * Abstract economic / attention cost to mint or elevate identity stratum (normalized [0,1]).
 * Cheap invite depth → higher cost floor Sybil resistance.
 * @param {RhizohIdentityFloor | string} fromFloor
 * @param {RhizohIdentityFloor | string} toFloor
 * @param {number} inviteDepth
 */
export function computeRhizohIdentityCreationCost(fromFloor, toFloor, inviteDepth) {
  const from = String(fromFloor || "ghost");
  const to = String(toFloor || "ghost");
  const fr = RHIZOH_IDENTITY_FLOOR_RANK[/** @type {RhizohIdentityFloor} */ (from)] ?? 0;
  const tr = RHIZOH_IDENTITY_FLOOR_RANK[/** @type {RhizohIdentityFloor} */ (to)] ?? 0;
  const steps = Math.max(0, tr - fr);
  const depth = Math.max(0, Number(inviteDepth) || 0);
  const depthPenalty = clamp01(0.06 * depth);
  const base = [0, 0.12, 0.38, 0.72][Math.min(steps, 3)] ?? 0.72;
  const cost = clamp01(base + depthPenalty + (steps >= 2 ? 0.08 : 0));
  return Math.round(cost * 1000) / 1000;
}

/**
 * @param {ReadonlyArray<RhizohVelocityEvent>} events sorted or unsorted
 * @param {number} now
 * @param {string} kind filter
 * @param {number} [windowMs]
 * @param {number} [maxInWindow]
 */
export function evaluateRhizohIdentityVelocityLimit(events, now, kind, windowMs, maxInWindow) {
  const w = windowMs ?? RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.velocityWindowMs;
  const max = maxInWindow ?? RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.maxTrustLikeEventsPerWindow;
  const tNow = Number(now);
  const cutoff = tNow - w;
  const n = (events || []).filter((e) => e && e.kind === kind && e.t >= cutoff).length;
  return {
    ok: n < max,
    count: n,
    limit: max,
    windowMs: w
  };
}

/**
 * @param {RhizohInviteGraph} graph
 * @param {string} inviteeId
 * @param {string | null} inviterId
 * @param {number} at
 * @returns {RhizohInviteGraph}
 */
export function addRhizohInviteEdge(graph, inviteeId, inviterId, at) {
  const g = { ...(graph || {}) };
  const id = String(inviteeId || "").trim();
  if (!id) return g;
  g[id] = {
    invitedBy: inviterId != null && String(inviterId).trim() ? String(inviterId).trim() : null,
    at: Number(at) || Date.now()
  };
  return g;
}

/**
 * BFS depth from root (invitedBy === null) or -1 if cycle / unknown.
 * @param {RhizohInviteGraph} graph
 * @param {string} identityId
 */
export function getRhizohInviteDepth(graph, identityId) {
  const g = graph || {};
  let id = String(identityId || "").trim();
  let depth = 0;
  const seen = new Set();
  const max = RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.maxInviteDepthConsidered + 2;
  while (id && depth < max) {
    if (seen.has(id)) return -1;
    seen.add(id);
    const e = g[id];
    if (!e || e.invitedBy == null) return depth;
    id = String(e.invitedBy).trim();
    depth += 1;
  }
  return depth;
}

/**
 * Multiplicative trust discount for pyramid depth (Sybil resistance).
 * @param {number} depth
 */
export function computeRhizohInviteDepthTrustDiscount(depth) {
  const d = Math.max(0, Number(depth) || 0);
  const per = RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.inviteDepthSybilPenaltyPerHop;
  const factor = Math.pow(1 - per, Math.min(d, RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.maxInviteDepthConsidered));
  return Math.round(clamp01(factor) * 1000) / 1000;
}

/**
 * Stake ∈ [0,1] from deposits, tenure, verifications, slashes.
 * @param {{
 *   lockedUnits?: number,
 *   tenureDays?: number,
 *   successfulVerifications?: number,
 *   slash01?: number
 * }} p
 */
export function computeRhizohReputationStake(p) {
  const lock = clamp01((Number(p.lockedUnits) || 0) / 10000);
  const tenure = clamp01((Number(p.tenureDays) || 0) / 365);
  const ver = clamp01((Number(p.successfulVerifications) || 0) / 24);
  const raw = 0.45 * lock + 0.35 * tenure + 0.2 * ver;
  const slash = clamp01(p.slash01 ?? 0);
  const st = clamp01(raw * (1 - 0.85 * slash));
  const cap = RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.stakeAccrueCap;
  return Math.round(Math.min(st, cap) * 1000) / 1000;
}

/**
 * Risk ∈ [0,1]; high → clamp membrane / lattice.
 * @param {{
 *   velocityHits?: number,
 *   inviteDepth?: number,
 *   deviceReuseScore?: number,
 *   chargebackSignal?: number,
 *   concurrentSessionScore?: number
 * }} s
 */
export function computeRhizohIdentityRiskScore(s) {
  const v = clamp01((Number(s.velocityHits) || 0) / 6);
  const d = clamp01((Number(s.inviteDepth) || 0) / 6);
  const dev = clamp01(s.deviceReuseScore ?? 0);
  const ch = clamp01(s.chargebackSignal ?? 0);
  const conc = clamp01(s.concurrentSessionScore ?? 0);
  const r = 0.28 * v + 0.22 * d + 0.18 * dev + 0.18 * ch + 0.14 * conc;
  return Math.round(clamp01(r) * 1000) / 1000;
}

/**
 * Influence = Trust × Stake × TimeFactor(anchored age). Cheap new clones → low time term.
 * @param {{
 *   trust: number,
 *   stake: number,
 *   anchoredAt: number,
 *   now?: number,
 *   timeScaleMs?: number
 * }} p
 */
export function computeRhizohInfluence(p) {
  const trust = clamp01(p.trust);
  const stake = clamp01(p.stake);
  const t0 = Number(p.anchoredAt);
  const now = Number(p.now != null ? p.now : Date.now());
  const scale = p.timeScaleMs ?? RHIZOH_IDENTITY_CONSTITUTION_DEFAULTS_V1.influenceTimeScaleMs;
  const age = Math.max(0, now - t0);
  const timeFactor = scale > 0 ? clamp01(1 - Math.exp(-age / scale)) : 0;
  const inf = trust * stake * timeFactor;
  return {
    influence: Math.round(clamp01(inf) * 1000) / 1000,
    timeFactor: Math.round(timeFactor * 1000) / 1000
  };
}

/**
 * Map continuous constitution signals → membrane floor suggestion (caller may override).
 * High risk or tiny influence → ghost; else ladder by trust+stake.
 * @param {{
 *   trust: number,
 *   stake: number,
 *   risk: number,
 *   anchoredAt: number,
 *   now?: number,
 *   minInfluence?: number
 * }} p
 */
export function suggestRhizohMembraneFloorFromConstitution(p) {
  const risk = clamp01(p.risk);
  const { influence, timeFactor } = computeRhizohInfluence({
    trust: p.trust,
    stake: p.stake,
    anchoredAt: p.anchoredAt,
    now: p.now,
    timeScaleMs: p.timeScaleMs
  });
  const minInf = p.minInfluence != null ? clamp01(p.minInfluence) : 0.08;
  if (risk > 0.72 || influence < minInf * 0.35) {
    return {
      floor: /** @type {RhizohIdentityFloor} */ ("ghost"),
      influence,
      timeFactor,
      reason: risk > 0.72 ? "risk_high" : "influence_too_low"
    };
  }
  const trust = clamp01(p.trust);
  const stake = clamp01(p.stake);
  if (trust >= 0.88 && stake >= 0.72 && risk < 0.22 && influence >= minInf * 1.2) {
    return { floor: "sovereign_verified", influence, timeFactor, reason: "trust_stake_influence_ok" };
  }
  if (trust >= 0.62 && stake >= 0.38 && risk < 0.42 && influence >= minInf) {
    return { floor: "verified", influence, timeFactor, reason: "moderate_trust" };
  }
  if (trust >= 0.35 && risk < 0.55) {
    return { floor: "trusted", influence, timeFactor, reason: "baseline_trust" };
  }
  return { floor: "ghost", influence, timeFactor, reason: "default_ghost" };
}

/**
 * Revocation plan primitive (Exit Rights hook). Scope ordering for downstream executors.
 */
export const RHIZOH_REVOCATION_SCOPE_ORDER_V1 = Object.freeze(
  /** @type {readonly RhizohRevocationScope[]} */ ([
    "consent",
    "agents",
    "trace",
    "memory",
    "economic",
    "full"
  ])
);

/** Exit Rights executor hooks (protocol labels; implement in gateway / services). */
export const RHIZOH_EXIT_RIGHTS_PRIMITIVE_MAP_V1 = Object.freeze({
  consent: Object.freeze(["consent_revoke"]),
  agents: Object.freeze(["agent_revoke"]),
  trace: Object.freeze(["trace_fade"]),
  memory: Object.freeze(["memory_export"]),
  economic: Object.freeze(["economic_settle", "cryptographic_receipt"])
});

/** identity_export applies to any scope that touches durable profile (memory/full). */
export const RHIZOH_EXIT_RIGHTS_IDENTITY_EXPORT_SCOPES_V1 = Object.freeze(["memory", "economic", "full"]);

/**
 * @param {RhizohRevocationScope} scope
 * @returns {{ scopes: RhizohRevocationScope[], requiresReceipt: boolean, cooldownMs: number }}
 */
export function expandRhizohRevocationScopes(scope) {
  const s = String(scope || "consent");
  /** @type {RhizohRevocationScope[]} */
  const scopes = [];
  if (s === "full") {
    scopes.push("consent", "agents", "trace", "memory", "economic");
  } else if (s === "economic") {
    scopes.push("consent", "agents", "trace", "economic");
  } else if (s === "memory") {
    scopes.push("consent", "agents", "trace", "memory");
  } else if (s === "trace") {
    scopes.push("consent", "agents", "trace");
  } else if (s === "agents") {
    scopes.push("consent", "agents");
  } else {
    scopes.push("consent");
  }
  return {
    scopes,
    requiresReceipt: scopes.includes("economic") || s === "full",
    cooldownMs: s === "full" ? 86_400_000 : 3_600_000
  };
}

/**
 * @param {{ revokedAt: number, now?: number, proofLevel?: number, cooldownMs?: number }} p
 * proofLevel 0..1 strength of recovery proof
 */
export function evaluateRhizohIdentityRecoveryEligibility(p) {
  const now = Number(p.now != null ? p.now : Date.now());
  const revokedAt = Number(p.revokedAt);
  const cd = Number(p.cooldownMs ?? 86_400_000);
  const elapsed = now - revokedAt;
  const proof = clamp01(p.proofLevel ?? 0);
  const cooldownOk = elapsed >= cd;
  const eligible = cooldownOk && proof >= 0.55;
  return {
    eligible,
    cooldownOk,
    elapsedMs: Math.max(0, elapsed),
    proofSufficient: proof >= 0.55
  };
}

/**
 * Single-roll snapshot update for stores (optional convenience).
 * @param {RhizohIdentityConstitutionSnapshot} snap
 * @param {{ now: number, active?: boolean, deltaTrust?: number }} tick
 */
export function tickRhizohIdentityConstitutionSnapshot(snap, tick) {
  const now = Number(tick.now);
  let trust = decayRhizohIdentityTrust(snap.trust, snap.lastActiveAt, now);
  if (typeof tick.deltaTrust === "number") trust = accrueRhizohIdentityTrust(trust, tick.deltaTrust);
  const lastActiveAt = tick.active ? now : snap.lastActiveAt;
  const { influence } = computeRhizohInfluence({
    trust,
    stake: snap.stake,
    anchoredAt: snap.firstAnchoredAt,
    now
  });
  const suggestion = suggestRhizohMembraneFloorFromConstitution({
    trust,
    stake: snap.stake,
    risk: snap.risk,
    anchoredAt: snap.firstAnchoredAt,
    now
  });
  return {
    ...snap,
    trust,
    lastActiveAt,
    influenceHint: influence,
    membraneFloorHint: suggestion.floor
  };
}

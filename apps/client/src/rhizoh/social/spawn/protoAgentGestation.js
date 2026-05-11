/**
 * PGL — Proto-Agent Gestation Layer (womb): local edges → role DNA, grid → temperament only.
 * Phantom gravity = shadow force η·m·F_sat (cap Σ ηm ≤ 12%). Tether κ(1−m). No clone spawn.
 */

import { RHIZOH_INTENT } from "../../router/intentTypes.js";
import { ENTITY_CLASS } from "../csil/identityResolution.js";

const MAX_QUEUE = 8;
const MAX_GESTATING_PROTOS = 3;
export const PROTO_AGENT_DEFAULT_TTL_MS = 180_000;
const PHANTOM_ETA = 0.12;
const MAX_PHANTOM_MASS = 0.12;

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function shortProtoId(seedEntityId, now) {
  const s = String(seedEntityId || "seed").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  return `proto_${s}_${Math.round(now / 1000)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {unknown[]} protoQueue
 * @returns {number} scale ∈ (0,1] so Σ η·m ≤ MAX_PHANTOM_MASS
 */
export function computePhantomMassScale(protoQueue) {
  const list = Array.isArray(protoQueue) ? protoQueue : [];
  let sum = 0;
  for (const p of list) {
    if (!p || p.status !== "gestating") continue;
    sum += PHANTOM_ETA * clamp01(p.mitosisConfidence ?? 0);
  }
  if (sum <= MAX_PHANTOM_MASS || sum < 1e-9) return 1;
  return MAX_PHANTOM_MASS / sum;
}

/**
 * F_phantom = η · scale · m · |F_sat(prev)| on edges touching seed (shadow only; blended in TSGE raw).
 */
export function phantomShadowAdditive(entityA, entityB, prevEdge, protoQueue, massScale) {
  const a = String(entityA || "").trim();
  const b = String(entityB || "").trim();
  const list = Array.isArray(protoQueue) ? protoQueue : [];
  const scale = Number(massScale) || 1;
  let add = 0;
  for (const p of list) {
    if (!p || p.status !== "gestating") continue;
    const sid = String(p.seedEntityId || "").trim();
    if (!sid || (a !== sid && b !== sid)) continue;
    const m = clamp01(p.mitosisConfidence ?? 0);
    const fsat = Math.abs(Number(prevEdge.pairwiseSaturatedForce) || 0);
    const tetherFactor = 0.2 + 0.8 * m;
    add += PHANTOM_ETA * scale * m * fsat * tetherFactor;
  }
  return add;
}

/**
 * @param {unknown[]} events
 * @param {string} currentIntent
 */
export function extractIntentMixFromTimeline(events, currentIntent) {
  const mix = { BUILD: 0, CRISIS: 0, PLAY: 0, OBSERVE: 0 };
  const ev = Array.isArray(events) ? events.slice(-16) : [];
  for (const e of ev) {
    if (!e || typeof e !== "object") continue;
    const it = String(e.intent || "").trim().toUpperCase();
    if (it === RHIZOH_INTENT.BUILD) mix.BUILD += 1;
    else if (it === RHIZOH_INTENT.CRISIS) mix.CRISIS += 1;
    else if (it === RHIZOH_INTENT.PLAY) mix.PLAY += 1;
    else mix.OBSERVE += 1;
  }
  const cur = String(currentIntent || RHIZOH_INTENT.CHAT).trim().toUpperCase();
  const wBoost = 2.4;
  if (cur === RHIZOH_INTENT.BUILD) mix.BUILD += wBoost;
  else if (cur === RHIZOH_INTENT.CRISIS) mix.CRISIS += wBoost;
  else if (cur === RHIZOH_INTENT.PLAY) mix.PLAY += wBoost;
  else if (cur === RHIZOH_INTENT.REFLECT) mix.OBSERVE += wBoost * 0.9;
  else mix.OBSERVE += wBoost * 0.75;

  const s = mix.BUILD + mix.CRISIS + mix.PLAY + mix.OBSERVE;
  if (s < 1e-9) {
    mix.OBSERVE = 1;
    return normalizeIntentMixObj(mix);
  }
  return normalizeIntentMixObj(mix);
}

function normalizeIntentMixObj(mix) {
  const s = mix.BUILD + mix.CRISIS + mix.PLAY + mix.OBSERVE;
  const n = Math.max(1e-9, s);
  return {
    BUILD: Math.round((mix.BUILD / n) * 1000) / 1000,
    CRISIS: Math.round((mix.CRISIS / n) * 1000) / 1000,
    PLAY: Math.round((mix.PLAY / n) * 1000) / 1000,
    OBSERVE: Math.round((mix.OBSERVE / n) * 1000) / 1000
  };
}

/** Role scores from local intent mix only (grid does not select species). */
export function roleScoresFromMix(mix, tsge) {
  const t = tsge && typeof tsge === "object" ? tsge : {};
  const attractor = !!t.stableAttractorHint;
  const weights = {
    listener: mix.BUILD * 0.52 + mix.OBSERVE * 0.42 + mix.PLAY * 0.12,
    mediator: mix.CRISIS * 0.62 + mix.BUILD * 0.14 + mix.OBSERVE * 0.2,
    scout: mix.PLAY * 0.58 + mix.BUILD * 0.28 + mix.OBSERVE * 0.18,
    counterweight: mix.CRISIS * 0.22 + mix.BUILD * 0.18 + (attractor ? 0.38 : 0.12)
  };
  if (attractor) weights.counterweight += 0.28;
  return weights;
}

function intentMixL1(a, b) {
  const x = a && typeof a === "object" ? a : {};
  const y = b && typeof b === "object" ? b : {};
  return (
    Math.abs(Number(x.BUILD) - Number(y.BUILD)) +
    Math.abs(Number(x.CRISIS) - Number(y.CRISIS)) +
    Math.abs(Number(x.PLAY) - Number(y.PLAY)) +
    Math.abs(Number(x.OBSERVE) - Number(y.OBSERVE))
  );
}

/**
 * Skip roles that failed under similar intent DNA (evolutionary heuristic).
 */
export function pickSemanticRoleAvoidingImprints(weights, imprints, mix, seedEntityClass) {
  const roles = ["listener", "mediator", "scout", "counterweight"];
  const sorted = roles.slice().sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
  const list = Array.isArray(imprints) ? imprints : [];
  for (const r of sorted) {
    const blocked = list.some((im) => {
      if (!im || typeof im !== "object") return false;
      if (String(im.failedRole || "") !== r) return false;
      const snap = im.sourceIntentMixSnapshot && typeof im.sourceIntentMixSnapshot === "object" ? im.sourceIntentMixSnapshot : null;
      if (!snap) return false;
      return intentMixL1(mix, snap) < 0.42;
    });
    if (!blocked) return applyComplementaryRolePolicy(r, seedEntityClass, mix);
  }
  return applyComplementaryRolePolicy(sorted[sorted.length - 1], seedEntityClass, mix);
}

/** Argmax_k Σ w_i · support(role_k | intent_i) — local edges only. */
export function deriveLocalSemanticRoleFromMix(mix, tsge) {
  const weights = roleScoresFromMix(mix, tsge);
  let best = "listener";
  let bestS = -1;
  for (const r of Object.keys(weights)) {
    const sc = weights[r];
    if (sc > bestS) {
      bestS = sc;
      best = r;
    }
  }
  return best;
}

/**
 * Grid tints temperament only — not species selection.
 * @param {Record<string, unknown> | null | undefined} socialPhysics
 * @param {Record<string, unknown> | null | undefined} fieldTheory
 */
export function deriveTemperamentBiasFromGrid(socialPhysics, fieldTheory) {
  const sp = socialPhysics && typeof socialPhysics === "object" ? socialPhysics : {};
  const sft = fieldTheory && typeof fieldTheory === "object" ? fieldTheory : {};
  const drift = Number(sp.driftScore) || 0;
  const recon = Number(sp.reconciliationNeed) || 0;
  const stab = Number(sp.stabilityScore) || 0.5;
  const interf = sft.interference && typeof sft.interference === "object" ? sft.interference : {};
  const contrast = Number(interf.contrast) || 0.5;

  if (recon > 0.56 || drift > 0.56) return "urgent";
  if (stab > 0.7 && contrast > 0.62) return "curious";
  if (stab > 0.68) return "soft";
  return "neutral";
}

function seedCoarseSemanticTag(seedEntityClass) {
  const c = String(seedEntityClass || ENTITY_CLASS.UNKNOWN);
  if (c === ENTITY_CLASS.AI_AGENT) return "visionary";
  if (c === ENTITY_CLASS.HUMAN_USER || c === ENTITY_CLASS.HUMAN_GUEST) return "operator_anchor";
  if (c === ENTITY_CLASS.GHOST_PET) return "playful_anchor";
  return "generic";
}

/**
 * Prefer complementary organ — never clone seed “persona” as same strategic role.
 */
export function applyComplementaryRolePolicy(localRole, seedEntityClass, mix) {
  const tag = seedCoarseSemanticTag(seedEntityClass);
  let r = localRole;
  if (tag === "visionary") {
    if (r === "scout") r = "counterweight";
    else if (r === "listener" && mix.CRISIS > 0.38) r = "mediator";
  }
  if (tag === "operator_anchor" && mix.CRISIS > 0.42 && r === "scout") r = "mediator";
  if (tag === "playful_anchor" && r === "counterweight") r = "listener";
  return r;
}

function intentFitScore(role, routerIntent) {
  const i = String(routerIntent || "").toUpperCase();
  const map = {
    listener: { BUILD: 0.45, CRISIS: 0.15, PLAY: 0.2, CHAT: 0.35, REFLECT: 0.4 },
    mediator: { CRISIS: 0.55, BUILD: 0.2, CHAT: 0.25 },
    scout: { PLAY: 0.55, BUILD: 0.35, CHAT: 0.2 },
    counterweight: { CRISIS: 0.35, BUILD: 0.25, CHAT: 0.3 }
  };
  const row = map[role] || {};
  const hit = row[i] ?? row.CHAT ?? 0.22;
  return hit * 2 - 1;
}

function pushFailureImprint(timeline, imprint) {
  if (!timeline || typeof timeline !== "object") return;
  const arr = Array.isArray(timeline.pglFailureImprints) ? timeline.pglFailureImprints : [];
  timeline.pglFailureImprints = [...arr, { ...imprint, at: Date.now() }].slice(-28);
}

function envelopeKey(e) {
  return String(e?.id || `${e?.seedEntityId || "x"}_${e?.createdAt || 0}`);
}

function capGestating(queue, timeline, now) {
  const t = Number(now) || Date.now();
  const g = queue.filter((e) => e && e.status === "gestating");
  if (g.length <= MAX_GESTATING_PROTOS) return queue;
  const byAge = g.slice().sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
  const victims = byAge.slice(0, g.length - MAX_GESTATING_PROTOS);
  const drop = new Set(victims.map(envelopeKey));
  for (const v of victims) {
    pushFailureImprint(timeline, {
      failedRole: v.semanticRoleHint,
      mismatchReason: "proto_cap_evicted",
      ttlSurvivedMs: Math.max(0, t - Number(v.createdAt)),
      curvatureImpact: 0,
      seedEntityId: v.seedEntityId,
      sourceIntentMixSnapshot:
        v.sourceIntentMix && typeof v.sourceIntentMix === "object" ? { ...v.sourceIntentMix } : null
    });
  }
  return queue.filter((e) => !drop.has(envelopeKey(e)));
}

function synthesizeNewEnvelope({
  seedEntityId,
  seedEntityClass,
  sourceIntentMix,
  semanticRoleHint,
  temperamentBias,
  localCurvature,
  tsge,
  maxRaw,
  now
}) {
  const mitosisConfidence = 0.12;
  const loadSharePotential = Math.min(1, maxRaw / 2.15);
  return {
    id: shortProtoId(seedEntityId, now),
    seedEntityId,
    seedNodeId: seedEntityId,
    semanticRoleHint,
    temperamentBias,
    sourceIntentMix: { ...sourceIntentMix },
    localCurvature: Math.round(Number(localCurvature) * 1_000_000) / 1_000_000,
    mitosisConfidence: Math.round(mitosisConfidence * 1000) / 1000,
    decayTTL: PROTO_AGENT_DEFAULT_TTL_MS,
    loadSharePotential: Math.round(loadSharePotential * 1000) / 1000,
    createdAt: now,
    status: "gestating",
    attentionLoadSnapshot: Math.round(maxRaw * 1000) / 1000,
    seedMaxRawSnapshot: Math.round(maxRaw * 1000) / 1000,
    tetherKappa: Math.round(0.08 * (1 - mitosisConfidence) * 1000) / 1000,
    phantomEtaEffective: PHANTOM_ETA,
    _prevVariance: Number(tsge.attentionCurvatureVariance) || 0,
    domainHint: "attention_ecology"
  };
}

/**
 * @returns {unknown[]}
 */
export function createInitialSpawnEnvelopeQueue() {
  return [];
}

/**
 * @param {unknown[]} prevQueue
 * @param {{
 *   now: number,
 *   seedEntityId: string,
 *   seedEntityClass?: string,
 *   tsge?: Record<string, unknown> | null,
 *   lastMaxRawPairwiseForce?: number,
 *   seedMaxRaw?: number,
 *   routerIntent?: string,
 *   contextEvents?: unknown[],
 *   gridClimate?: Record<string, unknown> | null,
 *   fieldTheorySnapshot?: Record<string, unknown> | null,
 *   contextTimeline?: Record<string, unknown> | null
 * }} opts
 */
export function stepProtoAgentGestationQueue(prevQueue, opts) {
  const now = Number(opts.now) || Date.now();
  const raw = Array.isArray(prevQueue) ? prevQueue : [];
  const seedEntityId = String(opts.seedEntityId || "").trim();
  const tsge = opts.tsge && typeof opts.tsge === "object" ? opts.tsge : {};
  const maxRaw =
    Number(opts.lastMaxRawPairwiseForce ?? tsge.lastMaxRawPairwiseForce) || 0;
  const seedMaxRaw =
    opts.seedMaxRaw != null && Number.isFinite(Number(opts.seedMaxRaw))
      ? Number(opts.seedMaxRaw)
      : maxRaw;
  const variance = Number(tsge.attentionCurvatureVariance);
  const streak = Number(tsge.saturationStreak) || 0;
  const spawnHint = !!tsge.spawnMitosisHint;
  const attractor = !!tsge.stableAttractorHint;
  const routerIntent = String(opts.routerIntent || RHIZOH_INTENT.CHAT);
  const events =
    Array.isArray(opts.contextEvents) ? opts.contextEvents : opts.contextTimeline?.events;
  const gridClimate = opts.gridClimate && typeof opts.gridClimate === "object" ? opts.gridClimate : {};
  const fieldTheorySnapshot =
    opts.fieldTheorySnapshot && typeof opts.fieldTheorySnapshot === "object"
      ? opts.fieldTheorySnapshot
      : {};

  const removedForImprint = [];

  let next = raw
    .filter((e) => e && typeof e === "object")
    .map((e) => ({ ...e }))
    .filter((e) => {
      const alive = now - Number(e.createdAt || 0) < Number(e.decayTTL || PROTO_AGENT_DEFAULT_TTL_MS);
      if (!alive) removedForImprint.push({ e, reason: "ttl_expired" });
      return alive;
    })
    .filter((e) => {
      if (e.status === "gestating" && maxRaw < 1.04 && now - Number(e.createdAt) > 45_000) {
        removedForImprint.push({ e, reason: "load_reabsorb" });
        return false;
      }
      return true;
    });

  for (const { e, reason } of removedForImprint) {
    const tl = opts.contextTimeline;
    if (tl && typeof tl === "object") {
      pushFailureImprint(tl, {
        failedRole: e.semanticRoleHint,
        mismatchReason: reason,
        ttlSurvivedMs: Math.max(0, now - Number(e.createdAt)),
        curvatureImpact: -Math.min(0.08, Number(e.localCurvature) || 0),
        seedEntityId: e.seedEntityId,
        sourceIntentMixSnapshot:
          e.sourceIntentMix && typeof e.sourceIntentMix === "object" ? { ...e.sourceIntentMix } : null
      });
    }
  }

  for (const env of next) {
    if (env.status !== "gestating") continue;
    const prevLoad = Number(env.attentionLoadSnapshot ?? env.seedMaxRawSnapshot ?? 0);
    const deltaLoad = prevLoad - seedMaxRaw;
    const prevVar = Number(env._prevVariance ?? variance);
    const deltaVar = Number.isFinite(prevVar) && Number.isFinite(variance) ? prevVar - variance : 0;
    env._prevVariance = variance;

    let dm =
      0.055 * clamp01((deltaLoad + 0.15) / 1.2) +
      0.042 * clamp01((deltaVar + 0.02) / 0.08) +
      0.048 * intentFitScore(String(env.semanticRoleHint), routerIntent);
    dm -= 0.024;
    if (maxRaw > 1.55) dm += 0.018;

    env.mitosisConfidence = clamp01(Number(env.mitosisConfidence ?? 0) + dm);
    env.mitosisConfidence = Math.round(env.mitosisConfidence * 1000) / 1000;
    env.attentionLoadSnapshot = Math.round(seedMaxRaw * 1000) / 1000;
    const mNow = env.mitosisConfidence;
    env.tetherKappa = Math.round(0.08 * (1 - mNow) * 1000) / 1000;
    env.tetherForceNominal = Math.round(0.08 * (1 - mNow) * 1000) / 1000;
    env.phantomEtaEffective = PHANTOM_ETA;
  }

  const shouldEnvelope = spawnHint && attractor && !!seedEntityId;
  if (shouldEnvelope) {
    const recent = next.some(
      (e) => e.seedEntityId === seedEntityId && now - Number(e.createdAt) < 90_000
    );
    if (!recent) {
      const mix = extractIntentMixFromTimeline(events, routerIntent);
      const seedClass = String(opts.seedEntityClass || ENTITY_CLASS.UNKNOWN);
      const imprints = Array.isArray(opts.contextTimeline?.pglFailureImprints)
        ? opts.contextTimeline.pglFailureImprints
        : [];
      const weights = roleScoresFromMix(mix, tsge);
      const role = pickSemanticRoleAvoidingImprints(weights, imprints, mix, seedClass);
      const temperament = deriveTemperamentBiasFromGrid(gridClimate, fieldTheorySnapshot);
      const localCurv = Number.isFinite(variance) ? variance : 0;

      next.push(
        synthesizeNewEnvelope({
          seedEntityId,
          seedEntityClass: seedClass,
          sourceIntentMix: mix,
          semanticRoleHint: role,
          temperamentBias: temperament,
          localCurvature: localCurv,
          tsge,
          maxRaw,
          now
        })
      );
    }
  }

  next = capGestating(next, opts.contextTimeline, now);
  if (next.length > MAX_QUEUE) next = next.slice(-MAX_QUEUE);
  return next;
}

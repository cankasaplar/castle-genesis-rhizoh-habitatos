/**
 * Guarded learned policy — effectiveness “supporting” ile LS patch; finalize ile karara merge.
 */

import { loadRhizohProductSession } from "./rhizohProductSessionPersistenceV1.js";
import {
  externalTruthBlocksPromotion,
  getRhizohExternalGroundTruthCachedSync
} from "./rhizohExternalGroundTruthV1.js";
import { getRhizohExternalLossLearningRateMultiplier, getRhizohExternalLossPromotionGate } from "./rhizohExternalLossFunctionV1.js";

export const RHIZOH_PRODUCT_POLICY_STORE_VERSION = "1.2.0";

export const CASTLE_PRODUCT_POLICY_UPDATED_EVENT = "castle:product-policy-updated";

const LS_KEY = "rhizoh.product.policy.v1";

const MAX_AUDIT = 36;

const MIN_PROMOTE_SCORE01 = 0.52;

/** Yerel “cotarı” proxy — sunucu kohortu gelene kadar sessionId bucket. */
const DEFAULT_HOLDOUT_PCT = 15;

const PROMOTE_WINDOW_MS = 86_400_000;
const MAX_PROMOTES_PER_WINDOW = 3;
const MIN_PROMOTE_GAP_MS = 4 * 60 * 60 * 1000;
/** Aynı episod yüzeyinin kısa sürede tekrar promote edilmesini frenler (kapalı döngü amplification azaltır). */
const PROMOTE_DECORRELATION_MS = 6 * 60 * 60 * 1000;

const LS_HOLDOUT_PCT = "rhizoh.policy.holdout_pct.v1";
const LS_SHADOW_PROMOTE = "rhizoh.policy.shadow_mode.v1";
const LS_SHADOW_FINALIZE = "rhizoh.policy.shadow_finalize.v1";
/** LS "1" → 5 dk içinde promote denemesi üst sınırı (velocity cap). */
const LS_STABILITY_SHORT_WINDOW = "rhizoh.policy.stability_budget_short_window.v1";

/** Kısa pencere — “iyi sistemi bir anda bozan” aşırı patch hızına tavan. */
const STABILITY_VELOCITY_WINDOW_MS = 5 * 60 * 1000;
const MAX_PROMOTE_ACTIONS_STABILITY_WINDOW = 2;

/** @returns {{ schemaVersion: string, updatedAt: number, patch: object, audit: object[] }} */
export function createEmptyRhizohProductPolicyState() {
  const now = Date.now();
  return {
    schemaVersion: RHIZOH_PRODUCT_POLICY_STORE_VERSION,
    updatedAt: now,
    patch: {
      ux: {},
      phaseTuning: {},
      capabilityGates: {}
    },
    audit: [],
    promoteMeta: {
      windowStartMs: now,
      count: 0,
      lastPromoteAt: 0,
      lastEpisodeFingerprint: "",
      lastEpisodeFingerprintAt: 0
    }
  };
}

/** Öğrenilmiş patch güncellemesi: cur → target doğrusal interp (lr ∈ [0,1]). */
function blendPolicyScalar(cur, target, lr) {
  const lambda = Math.max(0, Math.min(1, Number(lr)));
  const c = Number(cur);
  const t = Number(target);
  if (!Number.isFinite(t)) return null;
  if (!Number.isFinite(c)) return t;
  return c + lambda * (t - c);
}

export function guardClosureBannerMs(ms) {
  const n = Math.round(Number(ms));
  if (!Number.isFinite(n)) return 12_000;
  return Math.max(8000, Math.min(24_000, n));
}

export function guardTrustBondForNormal(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0.22, Math.min(0.42, n));
}

export function guardTrustTurnsForNormal(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(8, Math.min(16, n));
}

export function guardIntroTurnsForTrust(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(4, Math.min(10, n));
}

export function guardIntroSeenTurnsForTrust(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(2, Math.min(8, n));
}

export function guardGovernanceGateBond01(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0.35, Math.min(0.55, n));
}

function normalizeState(raw) {
  const e = createEmptyRhizohProductPolicyState();
  if (!raw || typeof raw !== "object") return e;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const patch = r.patch && typeof r.patch === "object" ? r.patch : {};
  const ux = patch.ux && typeof patch.ux === "object" ? patch.ux : {};
  const pt = patch.phaseTuning && typeof patch.phaseTuning === "object" ? patch.phaseTuning : {};
  const cg = patch.capabilityGates && typeof patch.capabilityGates === "object" ? patch.capabilityGates : {};
  e.patch = {
    ux: { ...ux },
    phaseTuning: { ...pt },
    capabilityGates: { ...cg }
  };
  e.audit = Array.isArray(r.audit) ? r.audit.slice(-MAX_AUDIT) : [];
  e.updatedAt = Number(r.updatedAt) || Date.now();
  const pm = r.promoteMeta && typeof r.promoteMeta === "object" ? r.promoteMeta : {};
  const now = Date.now();
  e.promoteMeta = {
    windowStartMs: Number.isFinite(Number(pm.windowStartMs)) ? Number(pm.windowStartMs) : now,
    count: Math.max(0, Math.floor(Number(pm.count) || 0)),
    lastPromoteAt: Number.isFinite(Number(pm.lastPromoteAt)) ? Number(pm.lastPromoteAt) : 0,
    lastEpisodeFingerprint: typeof pm.lastEpisodeFingerprint === "string" ? pm.lastEpisodeFingerprint : "",
    lastEpisodeFingerprintAt: Number.isFinite(Number(pm.lastEpisodeFingerprintAt))
      ? Number(pm.lastEpisodeFingerprintAt)
      : 0
  };
  return e;
}

export function loadRhizohProductPolicyState() {
  try {
    if (typeof window === "undefined") return createEmptyRhizohProductPolicyState();
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return createEmptyRhizohProductPolicyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return createEmptyRhizohProductPolicyState();
  }
}

export function saveRhizohProductPolicyState(state) {
  try {
    if (typeof window === "undefined") return;
    const next = { ...state, updatedAt: Date.now(), schemaVersion: RHIZOH_PRODUCT_POLICY_STORE_VERSION };
    window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

export function hasLearnedRhizohProductPatch(state) {
  const p = state?.patch || {};
  const uxKeys = p.ux && typeof p.ux === "object" ? Object.keys(p.ux).filter((k) => p.ux[k] != null) : [];
  const ptKeys =
    p.phaseTuning && typeof p.phaseTuning === "object"
      ? Object.keys(p.phaseTuning).filter((k) => p.phaseTuning[k] != null)
      : [];
  const cg = p.capabilityGates || {};
  const cgKeys = Object.keys(cg).filter((k) => cg[k] != null);
  return uxKeys.length + ptKeys.length + cgKeys.length > 0;
}

function pushAudit(state, entry) {
  state.audit = [...(state.audit || []).slice(-(MAX_AUDIT - 1)), entry];
}

function contraryForDimension(scores, dimension) {
  return scores.some((s) => s && s.dimension === dimension && s.verdict === "contrary");
}

function supportingEligible(scores, dimension) {
  return scores.filter(
    (s) =>
      s &&
      s.dimension === dimension &&
      s.verdict === "supporting" &&
      Number(s.score01) >= MIN_PROMOTE_SCORE01
  );
}

function effectivenessEpisodeLearningFingerprint(episode) {
  const r = Array.isArray(episode?.rationale) ? [...episode.rationale].sort().join("|") : "";
  const ux = episode?.ux && typeof episode.ux === "object" ? episode.ux : {};
  const pt = episode?.phaseTuning && typeof episode.phaseTuning === "object" ? episode.phaseTuning : {};
  const cg = episode?.capabilityGates && typeof episode.capabilityGates === "object" ? episode.capabilityGates : {};
  return `${r}::${JSON.stringify(ux)}::${JSON.stringify(pt)}::${JSON.stringify(cg)}`;
}

export function hashStringToBucket01(str, modulo = 100) {
  const s = String(str || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) % modulo;
}

export function getRhizohPolicyHoldoutPercent() {
  try {
    if (typeof window === "undefined") return DEFAULT_HOLDOUT_PCT;
    const raw = window.localStorage.getItem(LS_HOLDOUT_PCT);
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return DEFAULT_HOLDOUT_PCT;
    return Math.max(0, Math.min(40, n));
  } catch {
    return DEFAULT_HOLDOUT_PCT;
  }
}

/** Promote yazılmaz; ölçüm / karşılaştırma için (LS patch durur). */
export function readRhizohPolicyLearningShadowMode() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_SHADOW_PROMOTE) === "1";
  } catch {
    return false;
  }
}

/** finalize sırasında öğrenilmiş patch merge edilmez — saf reactive “truth-lite” görünümü. */
export function readRhizohPolicyShadowFinalize() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_SHADOW_FINALIZE) === "1";
  } catch {
    return false;
  }
}

export function readRhizohPolicyStabilityBudgetShortWindow() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_STABILITY_SHORT_WINDOW) === "1";
  } catch {
    return false;
  }
}

function countPromoteAuditsSince(state, sinceMs) {
  const list = Array.isArray(state.audit) ? state.audit : [];
  return list.filter(
    (e) =>
      e &&
      typeof e.ts === "number" &&
      e.ts >= sinceMs &&
      typeof e.action === "string" &&
      e.action.startsWith("promote_")
  ).length;
}

/** 5 dk içinde çok fazla promote audit → istikrar freni (LS ile açılır). */
export function getRhizohPolicyStabilityVelocityBlockReason(state, now = Date.now()) {
  if (!readRhizohPolicyStabilityBudgetShortWindow()) return null;
  const n = countPromoteAuditsSince(state, now - STABILITY_VELOCITY_WINDOW_MS);
  if (n >= MAX_PROMOTE_ACTIONS_STABILITY_WINDOW) return "stability_velocity_cap";
  return null;
}

/**
 * Holdout / kohort ataması — **tercihen** sunucu veya auth’tan gelen stabil özne anahtarı.
 * Yoksa `sessionId` (aynı kullanıcı farklı oturumlarda farklı bucket alabilir → population proxy zayıf).
 * @param {Record<string, unknown> | null | undefined} continuityMeta
 */
export function resolveRhizohPolicyHoldoutSubjectKey(continuityMeta) {
  const m = continuityMeta && typeof continuityMeta === "object" ? continuityMeta : {};
  const candidates = [
    m.analystStableKey,
    m.populationSubjectKey,
    m.firebaseUid,
    m.userId,
    m.subjectKey
  ];
  for (const c of candidates) {
    const s = typeof c === "string" ? c.trim() : "";
    if (s) return s.slice(0, 128);
  }
  const snap = loadRhizohProductSession(continuityMeta);
  return String(snap.sessionId || "anon").slice(0, 128);
}

/**
 * @param {Record<string, unknown> | undefined} continuityMeta — opsiyonel; verilmezse ürün LS oturumu kullanılır.
 */
export function isRhizohPolicyLearningHoldout(continuityMeta) {
  const pct = getRhizohPolicyHoldoutPercent();
  if (pct <= 0) return false;
  const sid = resolveRhizohPolicyHoldoutSubjectKey(continuityMeta);
  return hashStringToBucket01(sid, 100) < pct;
}

function peekPromoteMetaForDisplay(rawState, now = Date.now()) {
  const pm = rawState?.promoteMeta && typeof rawState.promoteMeta === "object" ? rawState.promoteMeta : {};
  let windowStartMs = Number.isFinite(Number(pm.windowStartMs)) ? Number(pm.windowStartMs) : now;
  let count = Math.max(0, Math.floor(Number(pm.count) || 0));
  const lastPromoteAt = Number.isFinite(Number(pm.lastPromoteAt)) ? Number(pm.lastPromoteAt) : 0;
  if (now - windowStartMs > PROMOTE_WINDOW_MS) {
    windowStartMs = now;
    count = 0;
  }
  let block = null;
  if (count >= MAX_PROMOTES_PER_WINDOW) block = "promote_quota";
  else if (lastPromoteAt > 0 && now - lastPromoteAt < MIN_PROMOTE_GAP_MS) block = "promote_cooldown";
  return { windowStartMs, count, lastPromoteAt, block };
}

function ensurePromoteMetaMutable(state) {
  if (!state.promoteMeta || typeof state.promoteMeta !== "object") {
    state.promoteMeta = {
      windowStartMs: Date.now(),
      count: 0,
      lastPromoteAt: 0,
      lastEpisodeFingerprint: "",
      lastEpisodeFingerprintAt: 0
    };
  }
  const pm = state.promoteMeta;
  if (typeof pm.lastEpisodeFingerprint !== "string") pm.lastEpisodeFingerprint = "";
  if (!Number.isFinite(Number(pm.lastEpisodeFingerprintAt))) pm.lastEpisodeFingerprintAt = 0;
  return pm;
}

function refreshPromoteQuotaWindowMutable(state, now = Date.now()) {
  const meta = ensurePromoteMetaMutable(state);
  if (now - meta.windowStartMs > PROMOTE_WINDOW_MS) {
    meta.windowStartMs = now;
    meta.count = 0;
  }
  return meta;
}

export function getRhizohPolicyPromoteBlockReason(state, now = Date.now()) {
  const meta = refreshPromoteQuotaWindowMutable(state, now);
  if (meta.count >= MAX_PROMOTES_PER_WINDOW) return "promote_quota";
  if (meta.lastPromoteAt > 0 && now - meta.lastPromoteAt < MIN_PROMOTE_GAP_MS) return "promote_cooldown";
  return null;
}

export function promoteQuotaAllows(state, now = Date.now()) {
  return getRhizohPolicyPromoteBlockReason(state, now) === null;
}

function bumpPromoteQuotaOnPromote(state, now = Date.now()) {
  const meta = refreshPromoteQuotaWindowMutable(state, now);
  meta.count += 1;
  meta.lastPromoteAt = now;
}

/**
 * Contrary skorları gelen boyutta LS patch alanlarını siler (truth-lite düzeltme).
 * @returns {{ touched: boolean, dimensions: string[] }}
 */
export function applyContraryPolicyRollbacks(state, scores) {
  if (!state?.patch || !Array.isArray(scores)) return { touched: false, dimensions: [] };
  const contraryDims = new Set(
    scores.filter((s) => s && s.verdict === "contrary" && s.dimension).map((s) => s.dimension)
  );
  const dimensions = [];
  let touched = false;
  const ts = Date.now();

  if (contraryDims.has("closure_engagement") && state.patch.ux?.closureBannerMs != null) {
    const nu = { ...(state.patch.ux || {}) };
    delete nu.closureBannerMs;
    state.patch.ux = nu;
    touched = true;
    dimensions.push("closure_engagement");
    pushAudit(state, { ts, action: "rollback_closure_banner_ms", reason: "contrary_effectiveness" });
  }

  if (contraryDims.has("trust_advance")) {
    const pt = { ...(state.patch.phaseTuning || {}) };
    let ch = false;
    if ("trustBondForNormal" in pt) {
      delete pt.trustBondForNormal;
      ch = true;
    }
    if ("trustTurnsForNormal" in pt) {
      delete pt.trustTurnsForNormal;
      ch = true;
    }
    if (ch) {
      state.patch.phaseTuning = pt;
      touched = true;
      dimensions.push("trust_advance");
      pushAudit(state, { ts, action: "rollback_trust_gate", reason: "contrary_effectiveness" });
    }
  }

  if (contraryDims.has("depth_under_gate") && Object.prototype.hasOwnProperty.call(state.patch.capabilityGates || {}, "suppressGovernanceOpsBadgeUnlessBond01")) {
    const cg = { ...(state.patch.capabilityGates || {}) };
    delete cg.suppressGovernanceOpsBadgeUnlessBond01;
    state.patch.capabilityGates = cg;
    touched = true;
    dimensions.push("depth_under_gate");
    pushAudit(state, { ts, action: "rollback_governance_gate", reason: "contrary_effectiveness" });
  }

  if (contraryDims.has("intro_pacing_depth")) {
    const pt = { ...(state.patch.phaseTuning || {}) };
    let ch = false;
    if ("introTurnsForTrust" in pt) {
      delete pt.introTurnsForTrust;
      ch = true;
    }
    if ("introSeenTurnsForTrust" in pt) {
      delete pt.introSeenTurnsForTrust;
      ch = true;
    }
    if (ch) {
      state.patch.phaseTuning = pt;
      touched = true;
      dimensions.push("intro_pacing_depth");
      pushAudit(state, { ts, action: "rollback_intro_pacing", reason: "contrary_effectiveness" });
    }
  }

  return { touched, dimensions };
}

export function getRhizohPolicyLearningGuardSummary() {
  if (typeof window === "undefined") {
    return {
      holdout: false,
      holdoutPct: DEFAULT_HOLDOUT_PCT,
      shadowPromote: false,
      shadowFinalize: false,
      promoteBlock: null,
      promotePeek: null
    };
  }
  const state = loadRhizohProductPolicyState();
  const now = Date.now();
  const promotePeek = peekPromoteMetaForDisplay(state, now);
  return {
    holdout: isRhizohPolicyLearningHoldout(undefined),
    holdoutPct: getRhizohPolicyHoldoutPercent(),
    shadowPromote: readRhizohPolicyLearningShadowMode(),
    shadowFinalize: readRhizohPolicyShadowFinalize(),
    promoteBlock: promotePeek.block,
    promotePeek: {
      count: promotePeek.count,
      lastPromoteAt: promotePeek.lastPromoteAt,
      windowStartMs: promotePeek.windowStartMs
    }
  };
}

export function emitRhizohProductPolicyUpdatedSignal(detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CASTLE_PRODUCT_POLICY_UPDATED_EVENT, { detail }));
  } catch {
    /* noop */
  }
}

/**
 * Tek episod + skorlar üzerinden guardrail’li policy patch yazar (rollback → kota/holdout/shadow → promote).
 * @returns {{ promoted: boolean, rollbackOnly?: boolean, skippedReason?: string, detail?: object }}
 */
export function promoteGuardedPolicyFromEffectivenessEpisode(episode, scores) {
  if (
    typeof window === "undefined" ||
    !episode ||
    !Array.isArray(scores) ||
    scores.length === 0
  ) {
    return { promoted: false };
  }

  const state = loadRhizohProductPolicyState();
  const now = Date.now();
  const metaBeforeStr = JSON.stringify(state.promoteMeta || {});

  const rb = applyContraryPolicyRollbacks(state, scores);

  refreshPromoteQuotaWindowMutable(state, now);
  const metaRolled = JSON.stringify(state.promoteMeta || {}) !== metaBeforeStr;

  const shadow = readRhizohPolicyLearningShadowMode();
  const holdout = isRhizohPolicyLearningHoldout(undefined);
  const quotaReason = getRhizohPolicyPromoteBlockReason(state, now);

  const extSnap = getRhizohExternalGroundTruthCachedSync();
  const extPromo = externalTruthBlocksPromotion(extSnap);
  const lossGate = getRhizohExternalLossPromotionGate();
  const extLrPack = getRhizohExternalLossLearningRateMultiplier();
  const lr = extLrPack.multiplier01;

  const stabilityReason = getRhizohPolicyStabilityVelocityBlockReason(state, now);

  let skippedReason = null;
  if (shadow) skippedReason = "shadow_mode";
  else if (holdout) skippedReason = "holdout";
  else if (quotaReason) skippedReason = quotaReason;
  else if (stabilityReason) skippedReason = stabilityReason;
  else if (extPromo.blocked) skippedReason = extPromo.reason;
  else if (lossGate.blocked) skippedReason = lossGate.reason;

  let skipPromote = skippedReason !== null;

  if (!skipPromote) {
    const fp = effectivenessEpisodeLearningFingerprint(episode);
    const pm = refreshPromoteQuotaWindowMutable(state, now);
    const lastFp = String(pm.lastEpisodeFingerprint || "");
    const lastAt = Number(pm.lastEpisodeFingerprintAt) || 0;
    if (lastFp && fp === lastFp && lastAt > 0 && now - lastAt < PROMOTE_DECORRELATION_MS) {
      skipPromote = true;
      skippedReason = "promote_decorrelation";
    }
  }

  let promotedWrites = false;
  /** @type {object[]} */
  const promotions = [];

  const epUx = episode.ux && typeof episode.ux === "object" ? episode.ux : {};
  const epPt = episode.phaseTuning && typeof episode.phaseTuning === "object" ? episode.phaseTuning : {};
  const epCg = episode.capabilityGates && typeof episode.capabilityGates === "object" ? episode.capabilityGates : {};

  if (!skipPromote) {
    const dimClosure = "closure_engagement";
    if (!contraryForDimension(scores, dimClosure) && supportingEligible(scores, dimClosure).length > 0) {
      if (episode.rationale?.some((r) => typeof r === "string" && r.includes("closure_timeout"))) {
        const msTarget = guardClosureBannerMs(epUx.closureBannerMs);
        const blendedRaw = blendPolicyScalar(state.patch.ux?.closureBannerMs, msTarget, lr);
        const ms = guardClosureBannerMs(blendedRaw ?? msTarget);
        state.patch.ux = { ...state.patch.ux, closureBannerMs: ms };
        promotedWrites = true;
        promotions.push({ dimension: dimClosure, closureBannerMs: ms });
        pushAudit(state, {
          ts: Date.now(),
          action: "promote_closure_banner_ms",
          closureBannerMs: ms,
          episodeId: episode.id
        });
      }
    }

    const dimTrust = "trust_advance";
    if (!contraryForDimension(scores, dimTrust) && supportingEligible(scores, dimTrust).length > 0) {
      if (episode.rationale?.some((r) => typeof r === "string" && r.includes("trust_build_stall"))) {
        const tbTarget = guardTrustBondForNormal(epPt.trustBondForNormal);
        const ttTarget = guardTrustTurnsForNormal(epPt.trustTurnsForNormal);
        const tbBlended =
          tbTarget != null
            ? guardTrustBondForNormal(blendPolicyScalar(state.patch.phaseTuning?.trustBondForNormal, tbTarget, lr) ?? tbTarget)
            : null;
        const ttBlendedRaw = blendPolicyScalar(state.patch.phaseTuning?.trustTurnsForNormal, ttTarget, lr);
        const tt =
          ttTarget != null
            ? guardTrustTurnsForNormal(ttBlendedRaw != null ? Math.round(ttBlendedRaw) : ttTarget)
            : null;
        const tb = tbBlended;
        if (tb != null) {
          state.patch.phaseTuning = { ...state.patch.phaseTuning, trustBondForNormal: tb };
          promotedWrites = true;
        }
        if (tt != null) {
          state.patch.phaseTuning = { ...state.patch.phaseTuning, trustTurnsForNormal: tt };
          promotedWrites = true;
        }
        if (tb != null || tt != null) {
          promotions.push({ dimension: dimTrust, trustBondForNormal: tb, trustTurnsForNormal: tt });
          pushAudit(state, {
            ts: Date.now(),
            action: "promote_trust_gate",
            trustBondForNormal: tb,
            trustTurnsForNormal: tt,
            episodeId: episode.id
          });
        }
      }
    }

    const dimGate = "depth_under_gate";
    if (!contraryForDimension(scores, dimGate) && supportingEligible(scores, dimGate).length > 0) {
      if (episode.rationale?.some((r) => typeof r === "string" && r.includes("governance_noise"))) {
        const gTarget = guardGovernanceGateBond01(epCg.suppressGovernanceOpsBadgeUnlessBond01);
        const g =
          gTarget != null
            ? guardGovernanceGateBond01(
                blendPolicyScalar(state.patch.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01, gTarget, lr) ?? gTarget
              )
            : null;
        if (g != null) {
          state.patch.capabilityGates = {
            ...state.patch.capabilityGates,
            suppressGovernanceOpsBadgeUnlessBond01: g
          };
          promotedWrites = true;
          promotions.push({ dimension: dimGate, suppressGovernanceOpsBadgeUnlessBond01: g });
          pushAudit(state, {
            ts: Date.now(),
            action: "promote_governance_gate",
            suppressGovernanceOpsBadgeUnlessBond01: g,
            episodeId: episode.id
          });
        }
      }
    }

    const dimIntro = "intro_pacing_depth";
    if (!contraryForDimension(scores, dimIntro) && supportingEligible(scores, dimIntro).length > 0) {
      if (episode.rationale?.some((r) => typeof r === "string" && r.includes("shallow_intro"))) {
        const itTarget = guardIntroTurnsForTrust(epPt.introTurnsForTrust);
        const istTarget = guardIntroSeenTurnsForTrust(epPt.introSeenTurnsForTrust);
        const itRaw = blendPolicyScalar(state.patch.phaseTuning?.introTurnsForTrust, itTarget, lr);
        const istRaw = blendPolicyScalar(state.patch.phaseTuning?.introSeenTurnsForTrust, istTarget, lr);
        const it = itTarget != null ? guardIntroTurnsForTrust(itRaw != null ? Math.round(itRaw) : itTarget) : null;
        const ist =
          istTarget != null ? guardIntroSeenTurnsForTrust(istRaw != null ? Math.round(istRaw) : istTarget) : null;
        if (it != null) {
          state.patch.phaseTuning = { ...state.patch.phaseTuning, introTurnsForTrust: it };
          promotedWrites = true;
        }
        if (ist != null) {
          state.patch.phaseTuning = { ...state.patch.phaseTuning, introSeenTurnsForTrust: ist };
          promotedWrites = true;
        }
        if (it != null || ist != null) {
          promotions.push({ dimension: dimIntro, introTurnsForTrust: it, introSeenTurnsForTrust: ist });
          pushAudit(state, {
            ts: Date.now(),
            action: "promote_intro_pacing",
            introTurnsForTrust: it,
            introSeenTurnsForTrust: ist,
            episodeId: episode.id
          });
        }
      }
    }
  }

  if (promotedWrites) {
    const fp = effectivenessEpisodeLearningFingerprint(episode);
    const meta = refreshPromoteQuotaWindowMutable(state, now);
    meta.lastEpisodeFingerprint = fp;
    meta.lastEpisodeFingerprintAt = now;
    bumpPromoteQuotaOnPromote(state, now);
  }

  const shouldSave = rb.touched || promotedWrites || metaRolled;

  if (!shouldSave) {
    return {
      promoted: false,
      rollbackOnly: false,
      ...(skipPromote ? { skippedReason } : {})
    };
  }

  saveRhizohProductPolicyState(state);

  const detail = {
    schemaVersion: "1.2.0",
    policyVersion: RHIZOH_PRODUCT_POLICY_STORE_VERSION,
    ts: Date.now(),
    promotions,
    rollbacks: rb.dimensions,
    skippedPromoteReason: skipPromote ? skippedReason : null,
    promoteMeta: { ...state.promoteMeta },
    auditTail: state.audit.slice(-4),
    externalLossLearningRate: extLrPack
  };
  emitRhizohProductPolicyUpdatedSignal(detail);

  return {
    promoted: promotedWrites,
    rollbackOnly: rb.touched && !promotedWrites,
    ...(skipPromote ? { skippedReason } : {}),
    detail
  };
}

/** Panel / debug */
export function getRhizohProductPolicyAuditTail(n = 8) {
  const s = loadRhizohProductPolicyState();
  return (s.audit || []).slice(-n).reverse();
}

export function resetRhizohLearnedProductPolicy() {
  saveRhizohProductPolicyState(createEmptyRhizohProductPolicyState());
}

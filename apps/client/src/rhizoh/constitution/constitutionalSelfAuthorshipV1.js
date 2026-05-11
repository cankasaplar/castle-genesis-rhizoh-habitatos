/**
 * RHIZOH constitutional self-authorship — sınırlı, denetlenebilir parametre yaması (tam kod rewrite değil).
 * Üretimde üst katman: meta-graf düğümü + insan mührü / çoklu-imza önerilir.
 */

export const RHIZOH_CONSTITUTIONAL_SELF_AUTHORSHIP_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Güvenli anahtar beyaz listesi — yalnızca sayısal kalibrasyon (adaptasyon / eşik ölçekleri).
 */
export const RHIZOH_SELF_AUTHORSHIP_ALLOWED_NUMERIC_KEYS_V1 = Object.freeze([
  "adaptation.alpha",
  "adaptation.targetStress",
  "adaptation.thetaMin",
  "adaptation.thetaMax",
  "adaptation.thresholdShiftScale",
  "adaptation.cooloffGamma",
  "adaptation.claimStrictnessEta",
  "organism.throttleStressMin",
  "organism.cooloffStressMin",
  "organism.amputationStressMin",
  "organism.quarantineStressMin"
]);

/**
 * @param {Record<string, unknown>} obj
 * @param {string} path "a.b.c"
 */
function getAtPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = /** @type {Record<string, unknown>} */ (cur)[p];
  }
  return cur;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} path
 * @param {unknown} value
 */
function setAtPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = /** @type {Record<string, unknown>} */ (cur[p]);
  }
  cur[parts[parts.length - 1]] = value;
}

function finalizeSelfAuthorshipNumeric(key, newVal) {
  if (key === "adaptation.alpha") return Math.max(0.001, Math.min(0.2, newVal));
  if (key === "adaptation.thresholdShiftScale") return Math.max(0.25, Math.min(2.5, newVal));
  if (key === "adaptation.cooloffGamma") return Math.max(0, Math.min(2.5, newVal));
  if (key === "adaptation.claimStrictnessEta") return clamp01(newVal);
  if (key === "adaptation.targetStress" || key.endsWith("thetaMin") || key.endsWith("thetaMax")) {
    return clamp01(newVal);
  }
  if (key.startsWith("organism.")) return clamp01(newVal);
  return newVal;
}

/**
 * @param {{
 *   knobs: Record<string, unknown>,
 *   patch: Record<string, number>,
 *   allowedKeys?: ReadonlyArray<string>,
 *   maxAbsDeltaPerKey?: number,
 *   maxKeysApplied?: number,
 *   frozenKeys?: ReadonlyArray<string>,
 *   trust?: number,
 *   minTrustToAuthor?: number
 * }} input
 */
export function applyRhizohConstitutionalSelfAuthorshipPatch(input) {
  const allowed = input.allowedKeys?.length ? [...input.allowedKeys] : [...RHIZOH_SELF_AUTHORSHIP_ALLOWED_NUMERIC_KEYS_V1];
  const allowedSet = new Set(allowed);
  const maxAbs =
    input.maxAbsDeltaPerKey != null ? Math.max(0, Number(input.maxAbsDeltaPerKey)) : 0.035;
  const maxKeys = Math.max(1, Math.floor(input.maxKeysApplied ?? 6));
  const frozen = new Set(input.frozenKeys || []);
  const trust = input.trust != null ? clamp01(input.trust) : 1;
  const minTrust = input.minTrustToAuthor != null ? clamp01(input.minTrustToAuthor) : 0.35;

  const next = JSON.parse(JSON.stringify(input.knobs || {}));
  /** @type {Record<string, number>} */
  const applied = {};
  /** @type {{ key: string, reason: string }[]} */
  const rejected = [];

  if (trust < minTrust) {
    return {
      knobsNext: next,
      applied: {},
      rejected: [{ key: "*", reason: "trust_below_self_authorship_floor" }],
      requiresHumanSeal: true,
      sealed: false
    };
  }

  let appliedCount = 0;
  const entries = Object.entries(input.patch || {}).sort(([a], [b]) => a.localeCompare(b));

  for (const [key, rawDelta] of entries) {
    if (appliedCount >= maxKeys) {
      rejected.push({ key, reason: "max_keys_per_tick" });
      continue;
    }
    if (!allowedSet.has(key)) {
      rejected.push({ key, reason: "not_allowlisted" });
      continue;
    }
    if (frozen.has(key)) {
      rejected.push({ key, reason: "frozen_key" });
      continue;
    }
    const delta = Number(rawDelta);
    if (!Number.isFinite(delta)) {
      rejected.push({ key, reason: "non_finite_delta" });
      continue;
    }
    const clampedDelta = Math.max(-maxAbs, Math.min(maxAbs, delta));
    const prev = getAtPath(next, key);
    const prevNum = Number(prev);
    if (!Number.isFinite(prevNum)) {
      rejected.push({ key, reason: "missing_numeric_base" });
      continue;
    }
    const newVal = finalizeSelfAuthorshipNumeric(key, prevNum + clampedDelta);
    setAtPath(next, key, Math.round(newVal * 100000) / 100000);
    applied[key] = clampedDelta;
    appliedCount += 1;
  }

  return {
    knobsNext: next,
    applied,
    rejected,
    requiresHumanSeal: Object.keys(applied).length > 0,
    sealed: false
  };
}

/**
 * Öz-yazım risk özeti (yüksek = daha fazla denetim öner).
 * @param {{
 *   patchKeyCount?: number,
 *   meanAbsDelta?: number,
 *   trust?: number,
 *   stake?: number
 * }} metrics
 */
export function scoreRhizohConstitutionalSelfAuthorshipRisk(metrics = {}) {
  const kc = Math.min(1, (metrics.patchKeyCount ?? 0) / 10);
  const md = clamp01(metrics.meanAbsDelta ?? 0);
  const trust = clamp01(metrics.trust ?? 0.5);
  const stake = clamp01(metrics.stake ?? 0.5);
  const risk = clamp01(0.35 * kc + 0.3 * md + 0.2 * (1 - trust) + 0.15 * (1 - stake));
  return {
    riskScore: Math.round(risk * 1000) / 1000,
    recommendHumanSeal: risk > 0.38,
    recommendRollbackPointer: risk > 0.22
  };
}

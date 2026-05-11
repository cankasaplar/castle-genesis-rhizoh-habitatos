/**
 * Ground Truth Bridge — sistem dışı outcome ingest (policy’den bağımsız).
 *
 * Sprint 2 (Cohort Kernel): canonical cohortProfile resolver, embedding hash anahtarı,
 * cohort confidence ile ağırlıklandırılmış agregasyon.
 */

import crypto from "node:crypto";

/** @type {Map<string, any>} */
const aggregateByKey = new Map();

/** Ham olaylar (debug / denetim) */
const recentEvents = [];
const MAX_RECENT = 128;

const LOW_TRUST_THRESHOLD = 0.35;
const OSCILLATION_TRUST_MAX = 0.45;

const SOURCE_TRUST_CEILING = Object.freeze({
  crm: 0.95,
  support: 0.85,
  task_completion: 0.8,
  task: 0.8,
  manual: 0.5,
  manual_report: 0.4,
  anonymous: 0.1,
  unknown: 0.35
});

const COHORT_PROFILE_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function entropy01(p) {
  const x = Math.max(1e-6, Math.min(1 - 1e-6, clamp01(p)));
  const h = -(x * Math.log2(x) + (1 - x) * Math.log2(1 - x));
  return Math.max(0, Math.min(1, h));
}

function normalizeSourceKey(raw) {
  const s = String(raw || "manual")
    .trim()
    .toLowerCase()
    .slice(0, 48);
  if (!s) return "manual";
  if (s === "manual report" || s === "manual-report") return "manual_report";
  return s;
}

function trustCeilingForSource(sourceNorm) {
  const c = SOURCE_TRUST_CEILING[sourceNorm];
  if (Number.isFinite(c)) return c;
  return SOURCE_TRUST_CEILING.unknown;
}

export function resolveOutcomeTrustWeight(sourceNorm, bodyTrustWeight) {
  const ceiling = trustCeilingForSource(sourceNorm);
  const requested = bodyTrustWeight != null ? clamp01(bodyTrustWeight) : ceiling;
  const applied = Math.min(requested, ceiling);
  const trustCapped = requested > applied + 1e-6;
  return { applied, trustCapped, ceiling };
}

function normalizeOutcome(raw) {
  const o = String(raw || "").trim().toLowerCase();
  if (o === "success" || o === "complete" || o === "completed") return "success";
  if (o === "fail" || o === "failure" || o === "failed") return "fail";
  if (o === "neutral" || o === "unknown") return "neutral";
  return "";
}

function defaultScoreForOutcome(outcomeNorm) {
  if (outcomeNorm === "success") return 1;
  if (outcomeNorm === "fail") return 0;
  return 0.5;
}

function aggKey(cohortHash, fingerprint) {
  return `${String(cohortHash).slice(0, 48)}|${String(fingerprint).slice(0, 512)}`;
}

function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a || "").trim(), "utf8");
    const bb = Buffer.from(String(b || "").trim(), "utf8");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function timingSafeEqualUtf8(a, b) {
  try {
    const ba = Buffer.from(String(a || ""), "utf8");
    const bb = Buffer.from(String(b || ""), "utf8");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function parseSourceTokensFromEnv() {
  const raw = String(process.env.RHIZOH_PRODUCT_OUTCOME_SOURCE_TOKENS_JSON || "").trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const out = {};
    for (const k of Object.keys(o)) {
      const nk = normalizeSourceKey(k);
      out[nk] = String(o[k] ?? "").trim();
    }
    return out;
  } catch {
    return null;
  }
}

export function verifyRhizohOutcomeHmac(rawUtf8, signatureHeader) {
  const secret = String(process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET || "").trim();
  if (!secret) return { ok: true, skipped: true };
  const hdr = String(signatureHeader || "").trim();
  let hex = hdr;
  const m = /^v1=([a-f0-9]+)$/i.exec(hdr);
  if (m) hex = m[1];
  if (!/^[a-f0-9]{64}$/i.test(hex)) return { ok: false, error: "outcome_hmac_malformed" };
  const expected = crypto.createHmac("sha256", secret).update(rawUtf8, "utf8").digest("hex");
  if (!timingSafeEqualHex(hex.toLowerCase(), expected.toLowerCase())) {
    return { ok: false, error: "outcome_hmac_invalid" };
  }
  return { ok: true, skipped: false };
}

export function verifyRhizohOutcomeSourceToken(rawSource, tokenHeader) {
  const sourceNorm = normalizeSourceKey(rawSource);
  const map = parseSourceTokensFromEnv();
  if (!map) return { ok: true, skipped: true };
  const need = map[sourceNorm];
  if (!need) return { ok: true, skipped: true };
  const tok = String(tokenHeader || "").trim();
  if (!tok) return { ok: false, error: "outcome_source_token_required" };
  if (!timingSafeEqualUtf8(tok, need)) return { ok: false, error: "outcome_source_token_invalid" };
  return { ok: true, skipped: false };
}

function stableProfileId(labels) {
  const keys = Array.from(new Set(labels.filter(Boolean))).sort();
  return keys.length ? keys.join("_") : "default";
}

function readFeature01(body, key, fallback = 0.5) {
  const v = Number(body[key]);
  return Number.isFinite(v) ? clamp01(v) : fallback;
}

export function resolveRhizohOutcomeCohortProfile(event) {
  const b = event && typeof event === "object" ? event : {};
  const sessionAgeMs = Math.max(0, Number(b.sessionAgeMs) || 0);
  const ageDays = sessionAgeMs / 86_400_000;
  const tenure = clamp01(1 - Math.exp(-ageDays / 14));
  const depth = clamp01((Number(b.avgTurnDepth) || Number(b.turnDepth) || 2) / 8);
  const returning7d = readFeature01(b, "return7d", 0);
  const powerMode = readFeature01(b, "powerMode", 0);
  const enterpriseSignal = readFeature01(b, "enterpriseSignal01", 0);
  const correctionRatio = readFeature01(b, "correctionRatio01", 0.2);
  const satisfaction = readFeature01(b, "satisfactionProxy01", 0.5);
  const engagement = clamp01(0.45 * returning7d + 0.3 * powerMode + 0.25 * satisfaction);
  const trust = clamp01(0.55 * (1 - correctionRatio) + 0.45 * satisfaction);
  const enterpriseAffinity = enterpriseSignal;

  const axes = {
    tenure: Math.round(tenure * 1000) / 1000,
    engagement: Math.round(engagement * 1000) / 1000,
    depth: Math.round(depth * 1000) / 1000,
    trust: Math.round(trust * 1000) / 1000,
    enterpriseAffinity: Math.round(enterpriseAffinity * 1000) / 1000
  };

  const labels = [];
  if (tenure < 0.25) labels.push("new_user");
  else if (tenure > 0.65) labels.push("returning");
  if (engagement > 0.75 || powerMode > 0.7) labels.push("power_user");
  if (returning7d > 0.7) labels.push("returning_7d");
  if (enterpriseAffinity > 0.65) labels.push("enterprise");
  if (String(b.source || "").toLowerCase() === "support" || correctionRatio > 0.45) labels.push("support_case");
  if (labels.length === 0) labels.push("general");

  const axisVals = Object.values(axes);
  const avgEntropy = axisVals.reduce((a, v) => a + entropy01(v), 0) / axisVals.length;
  const entropyConfidence = 1 - avgEntropy;
  const mean = axisVals.reduce((a, v) => a + v, 0) / axisVals.length;
  const variance = axisVals.reduce((a, v) => a + (v - mean) ** 2, 0) / axisVals.length;
  const varianceStability = 1 - Math.min(1, variance / 0.12);
  const sampleN = Math.max(1, Math.floor(Number(b.cohortSampleN) || (2 + ageDays * 0.8 + returning7d * 8)));
  const sampleStability = sampleN / (sampleN + 12);
  const confidence01 = Math.round(
    clamp01(0.45 * entropyConfidence + 0.3 * sampleStability + 0.25 * varianceStability) * 1000
  ) / 1000;

  const cohortId = stableProfileId(labels);
  return {
    cohortId,
    profileVersion: COHORT_PROFILE_VERSION,
    axes,
    confidence01,
    sampleN,
    labels
  };
}

export function hashRhizohCohortProfile(profile) {
  const p = profile && typeof profile === "object" ? profile : {};
  const axes = p.axes && typeof p.axes === "object" ? p.axes : {};
  const canon = JSON.stringify({
    cohortId: String(p.cohortId || "default"),
    profileVersion: String(p.profileVersion || COHORT_PROFILE_VERSION),
    axes: {
      tenure: clamp01(axes.tenure),
      engagement: clamp01(axes.engagement),
      depth: clamp01(axes.depth),
      trust: clamp01(axes.trust),
      enterpriseAffinity: clamp01(axes.enterpriseAffinity)
    },
    labels: Array.isArray(p.labels) ? p.labels.map(String).sort() : []
  });
  return crypto.createHash("sha256").update(canon, "utf8").digest("hex").slice(0, 20);
}

function migratePrevAggregate(prev) {
  if (!prev) {
    return {
      sumTrustWeight: 0,
      sumWeightedScore01: 0,
      sampleN: 0,
      lowTrustSampleCount: 0,
      flipLowTrustCount: 0,
      lastOutcomeNorm: "",
      lastTrust: null,
      lastCohortConfidence01: 0.5
    };
  }
  if (prev.sumTrustWeight != null && Number.isFinite(prev.sumTrustWeight)) {
    return {
      sumTrustWeight: prev.sumTrustWeight,
      sumWeightedScore01: prev.sumWeightedScore01 != null ? prev.sumWeightedScore01 : 0,
      sampleN: prev.sampleN || 0,
      lowTrustSampleCount: prev.lowTrustSampleCount || 0,
      flipLowTrustCount: prev.flipLowTrustCount || 0,
      lastOutcomeNorm: prev.lastOutcomeNorm || "",
      lastTrust: prev.lastTrust != null ? prev.lastTrust : null,
      lastCohortConfidence01: prev.lastCohortConfidence01 != null ? prev.lastCohortConfidence01 : 0.5
    };
  }
  const n = Number(prev.sampleN) || 0;
  const legacySum = prev.sumScore01 != null ? Number(prev.sumScore01) : Number(prev.outcomeRate || 0) * n;
  return {
    sumTrustWeight: n,
    sumWeightedScore01: Number.isFinite(legacySum) ? legacySum : 0,
    sampleN: n,
    lowTrustSampleCount: prev.lowTrustSampleCount || 0,
    flipLowTrustCount: prev.flipLowTrustCount || 0,
    lastOutcomeNorm: prev.lastOutcomeNorm || "",
    lastTrust: prev.lastTrust != null ? prev.lastTrust : null,
    lastCohortConfidence01: prev.lastCohortConfidence01 != null ? prev.lastCohortConfidence01 : 0.5
  };
}

function contradicts(a, b) {
  if (a === "success" && b === "fail") return true;
  if (a === "fail" && b === "success") return true;
  return false;
}

export function ingestRhizohProductOutcomeHttp(body, meta = {}) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = body;
  if (String(b.schemaVersion || "") !== "1.0.0") return { ok: false, error: "schema_version" };

  const subjectKey = String(b.subjectKey || "").trim().slice(0, 128);
  const sessionId = String(b.sessionId || "").trim().slice(0, 128);
  const decisionFingerprint = String(b.decisionFingerprint || "").trim().slice(0, 2048);
  const outcomeNorm = normalizeOutcome(b.outcome);
  if (!subjectKey) return { ok: false, error: "subject_key_required" };
  if (!sessionId) return { ok: false, error: "session_id_required" };
  if (!decisionFingerprint) return { ok: false, error: "decision_fingerprint_required" };
  if (!outcomeNorm) return { ok: false, error: "bad_outcome" };

  const ts = Number(b.ts);
  if (!Number.isFinite(ts) || ts <= 0) return { ok: false, error: "bad_ts" };

  const sourceNorm = normalizeSourceKey(b.source);
  const cohortProfile = resolveRhizohOutcomeCohortProfile(b);
  const cohortHash = hashRhizohCohortProfile(cohortProfile);
  const cohortId = cohortProfile.cohortId;

  const { applied: trustWeight, trustCapped } = resolveOutcomeTrustWeight(
    sourceNorm,
    b.trustWeight != null ? b.trustWeight : null
  );
  const effectiveWeight = Math.round(trustWeight * cohortProfile.confidence01 * 1000) / 1000;
  const score01 = b.score01 != null ? clamp01(b.score01) : defaultScoreForOutcome(outcomeNorm);
  const weightedIncrement = score01 * effectiveWeight;

  const key = aggKey(cohortHash, decisionFingerprint);
  const prev = aggregateByKey.get(key);
  const m = migratePrevAggregate(prev);

  const sampleN = m.sampleN + 1;
  const sumTrustWeight = m.sumTrustWeight + effectiveWeight;
  const sumWeightedScore01 = m.sumWeightedScore01 + weightedIncrement;
  const outcomeRate = sumTrustWeight > 0 ? Math.round((sumWeightedScore01 / sumTrustWeight) * 1000) / 1000 : 0.5;
  const updatedAt = Math.max(ts, prev?.updatedAt || 0, Date.now());

  let lowTrustSampleCount = m.lowTrustSampleCount + (trustWeight < LOW_TRUST_THRESHOLD ? 1 : 0);
  let flipLowTrustCount = m.flipLowTrustCount;
  let lastOutcomeNorm = m.lastOutcomeNorm;
  let lastTrust = m.lastTrust;

  if (
    lastOutcomeNorm &&
    contradicts(lastOutcomeNorm, outcomeNorm) &&
    trustWeight < OSCILLATION_TRUST_MAX &&
    (lastTrust == null || lastTrust < OSCILLATION_TRUST_MAX)
  ) {
    flipLowTrustCount += 1;
  }
  lastOutcomeNorm = outcomeNorm;
  lastTrust = trustWeight;

  const lowTrustFraction = sampleN > 0 ? Math.round((lowTrustSampleCount / sampleN) * 1000) / 1000 : 0;
  const flags = [];
  if (trustCapped) flags.push("trust_capped");
  if (flipLowTrustCount >= 2) flags.push("low_trust_outcome_oscillation");
  if (lowTrustFraction >= 0.55) flags.push("high_low_trust_fraction");
  if (cohortProfile.confidence01 < 0.35) flags.push("low_cohort_confidence");

  const row = {
    cohortId,
    cohortHash,
    cohortProfile,
    decisionFingerprint,
    outcomeRate,
    sampleN,
    sumTrustWeight: Math.round(sumTrustWeight * 1000) / 1000,
    sumWeightedScore01: Math.round(sumWeightedScore01 * 1000) / 1000,
    lastCohortConfidence01: cohortProfile.confidence01,
    updatedAt,
    lowTrustSampleCount,
    flipLowTrustCount,
    lastOutcomeNorm,
    lastTrust,
    integrity: {
      schemaVersion: "1.1.0",
      lowTrustFraction,
      flags,
      trustWeightApplied: trustWeight,
      effectiveWeight,
      source: sourceNorm,
      trustCapped
    }
  };
  aggregateByKey.set(key, row);

  recentEvents.push({
    receivedAtMs: Date.now(),
    ip: String(meta.ip || "").slice(0, 80),
    subjectKey,
    sessionId,
    decisionFingerprint: decisionFingerprint.slice(0, 256),
    outcome: outcomeNorm,
    score01,
    trustWeight,
    effectiveWeight,
    trustCapped,
    source: sourceNorm,
    ts,
    cohortId,
    cohortHash,
    cohortProfile,
    expectedTruthLagMs: Number.isFinite(Number(b.expectedTruthLagMs)) ? Number(b.expectedTruthLagMs) : null
  });
  while (recentEvents.length > MAX_RECENT) recentEvents.shift();

  return {
    ok: true,
    recorded: true,
    aggregate: row,
    integrity: {
      trustWeightApplied: trustWeight,
      effectiveWeight,
      cohortConfidence01: cohortProfile.confidence01,
      source: sourceNorm,
      trustCapped,
      flags
    }
  };
}

export function listRhizohProductOutcomeAggregates(q = {}) {
  const cohortFilter = q.cohortId != null ? String(q.cohortId).trim() : "";
  const fpFilter = q.decisionFingerprint != null ? String(q.decisionFingerprint).trim() : "";
  const limit = Math.max(1, Math.min(200, Number(q.limit) || 50));
  let rows = [...aggregateByKey.values()].map((r) => {
    const base = { ...r };
    if (!base.integrity && base.sampleN != null) {
      base.integrity = {
        schemaVersion: "1.1.0",
        lowTrustFraction:
          base.sampleN > 0 ? Math.round(((base.lowTrustSampleCount || 0) / base.sampleN) * 1000) / 1000 : 0,
        flags: [],
        trustWeightApplied: null,
        effectiveWeight: null,
        source: null,
        trustCapped: false
      };
    }
    return base;
  });
  if (cohortFilter) rows = rows.filter((r) => r.cohortId === cohortFilter);
  if (fpFilter) rows = rows.filter((r) => r.decisionFingerprint === fpFilter);
  rows.sort((a, b) => b.updatedAt - a.updatedAt);
  return rows.slice(0, limit);
}

export function getRhizohProductOutcomeIngestRecent(n = 16) {
  return recentEvents.slice(-Math.max(1, Math.min(64, n)));
}

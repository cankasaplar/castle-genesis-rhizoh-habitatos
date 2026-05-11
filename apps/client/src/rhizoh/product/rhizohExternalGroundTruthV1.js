/**
 * External ground truth — gateway nüfus kohortu + istemci önbelleği.
 *
 * Bu katman **yerel truth_anchor.v1** veya effectiveness skorlarının yerine geçmez:
 * dışsal sonuçlar (ör. churn, görev tamamlama, moderasyon) henüz bağlanmadıysa stub döner.
 */

import { loadRhizohProductSession } from "./rhizohProductSessionPersistenceV1.js";

export const RHIZOH_EXTERNAL_GROUND_TRUTH_SCHEMA_VERSION = "1.0.0";

const LS_CACHE = "rhizoh.external_truth.bundle.cache.v1";
const LS_REQUIRE_EXTERNAL = "rhizoh.policy.require_external_truth.v1";

/** Yerel LS anchor’un aksine bu katmanı zorunlu say (yoksa promote/merge blok). */
export function readRhizohPolicyRequireExternalTruth() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_REQUIRE_EXTERNAL) === "1";
  } catch {
    return false;
  }
}

function gatewayHttpOriginBestEffort() {
  try {
    const gh = typeof globalThis !== "undefined" ? globalThis.__RHIZOH_TEST_GATEWAY_HTTP__ : "";
    const gv = gh != null ? String(gh).trim() : "";
    if (gv) {
      try {
        const u = new URL(gv, typeof window !== "undefined" ? window.location.origin : "http://localhost");
        return u.origin;
      } catch {
        return gv.replace(/\/+$/, "");
      }
    }
  } catch {
    /* noop */
  }
  const explicit = String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_EXTERNAL_TRUTH_HTTP || "" : "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const llm = String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_HTTP || import.meta.env?.VITE_RHIZOH_LLM_HTTP || "" : "").trim();
  if (!llm) return "";
  try {
    const u = new URL(llm, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return u.origin;
  } catch {
    return "";
  }
}

export function resolveRhizohExternalGroundTruthUrl() {
  const base = gatewayHttpOriginBestEffort();
  if (!base) return "";
  return `${base}/rhizoh/product/external-truth`;
}

/**
 * @param {unknown} raw
 * @returns {object | null}
 */
export function normalizeExternalGroundTruthBundle(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (String(r.schemaVersion || "") !== "1.0.0") return null;
  const issuedAtMs = Number(r.issuedAtMs);
  const ttlMs = Number(r.ttlMs);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(ttlMs)) return null;
  const populationCohort = String(r.populationCohort || "");
  if (!populationCohort) return null;
  return {
    schemaVersion: "1.0.0",
    truthLayerVersion: String(r.truthLayerVersion || ""),
    source: String(r.source || ""),
    issuedAtMs,
    ttlMs,
    populationCohort,
    promotionEligible: Boolean(r.promotionEligible),
    learningMergeEligible: r.learningMergeEligible !== undefined ? Boolean(r.learningMergeEligible) : Boolean(r.promotionEligible),
    serverHoldoutPct: Number.isFinite(Number(r.serverHoldoutPct)) ? Number(r.serverHoldoutPct) : null,
    cohortDigest: typeof r.cohortDigest === "string" ? r.cohortDigest : null,
    cautions: Array.isArray(r.cautions) ? r.cautions.map(String).slice(0, 8) : []
  };
}

/**
 * @returns {{ status: "absent"|"fresh"|"stale"|"invalid", bundle: object|null, cachedAtMs: number|null, ageMs: number|null }}
 */
export function getRhizohExternalGroundTruthCachedSync() {
  if (typeof window === "undefined") {
    return { status: "absent", bundle: null, cachedAtMs: null, ageMs: null };
  }
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(LS_CACHE);
    if (!raw) return { status: "absent", bundle: null, cachedAtMs: null, ageMs: null };
    const wrap = JSON.parse(raw);
    const cachedAtMs = Number(wrap?.cachedAtMs);
    const bundle = normalizeExternalGroundTruthBundle(wrap?.bundle);
    if (!Number.isFinite(cachedAtMs) || !bundle) return { status: "invalid", bundle: null, cachedAtMs: null, ageMs: null };
    const ageMs = now - cachedAtMs;
    const bundleAge = now - bundle.issuedAtMs;
    const stale = bundleAge > bundle.ttlMs + 15_000;
    return {
      status: stale ? "stale" : "fresh",
      bundle,
      cachedAtMs,
      ageMs,
      bundleAgeMs: bundleAge
    };
  } catch {
    return { status: "invalid", bundle: null, cachedAtMs: null, ageMs: null };
  }
}

function readGatewayTokenBestEffort() {
  try {
    return String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_TOKEN || "" : "").trim();
  } catch {
    return "";
  }
}

/**
 * Effectiveness tick öncesi çağırın (promote kararı güncel nüfus kohortunu görür).
 * @param {string} [sessionIdHint]
 */
export async function refreshRhizohExternalGroundTruthBestEffort(sessionIdHint) {
  if (typeof window === "undefined") return getRhizohExternalGroundTruthCachedSync();
  const url = resolveRhizohExternalGroundTruthUrl();
  if (!url) return getRhizohExternalGroundTruthCachedSync();

  const sid =
    sessionIdHint ||
    (() => {
      try {
        return String(loadRhizohProductSession(undefined).sessionId || "");
      } catch {
        return "";
      }
    })();

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctrl ? window.setTimeout(() => ctrl.abort(), 2800) : 0;

  try {
    const tok = readGatewayTokenBestEffort();
    const headers = { Accept: "application/json" };
    if (sid) headers["x-castle-device"] = sid.slice(0, 128);
    if (tok) headers.Authorization = `Bearer ${tok}`;
    const res = await fetch(url, { method: "GET", signal: ctrl?.signal, headers });
    if (!res.ok) return getRhizohExternalGroundTruthCachedSync();
    const raw = await res.json();
    const bundle = normalizeExternalGroundTruthBundle(raw);
    if (!bundle) return getRhizohExternalGroundTruthCachedSync();
    const wrap = { schemaVersion: "1.0.0", cachedAtMs: Date.now(), bundle };
    window.localStorage.setItem(LS_CACHE, JSON.stringify(wrap));
    return getRhizohExternalGroundTruthCachedSync();
  } catch {
    return getRhizohExternalGroundTruthCachedSync();
  } finally {
    if (t) window.clearTimeout(t);
  }
}

export function externalTruthBlocksPromotion(extSnapshot) {
  const snap = extSnapshot || getRhizohExternalGroundTruthCachedSync();
  const requireTruth = readRhizohPolicyRequireExternalTruth();

  if (requireTruth) {
    if (snap.status !== "fresh" || !snap.bundle) {
      const reason = snap.status === "stale" ? "external_truth_stale" : "external_truth_required";
      return { blocked: true, reason };
    }
  }

  const trusted = snap.status === "fresh" && snap.bundle;
  if (!trusted) return { blocked: false, reason: null };

  if (snap.bundle.promotionEligible === false) return { blocked: true, reason: "external_truth_holdout" };
  return { blocked: false, reason: null };
}

export function externalTruthBlocksLearningMerge(extSnapshot) {
  const snap = extSnapshot || getRhizohExternalGroundTruthCachedSync();
  const requireTruth = readRhizohPolicyRequireExternalTruth();

  if (requireTruth) {
    if (snap.status !== "fresh" || !snap.bundle) {
      const reason = snap.status === "stale" ? "external_truth_stale" : "external_truth_required";
      return { blocked: true, reason };
    }
  }

  const trusted = snap.status === "fresh" && snap.bundle;
  if (!trusted) return { blocked: false, reason: null };

  if (snap.bundle.learningMergeEligible === false) return { blocked: true, reason: "external_truth_merge_blocked" };
  return { blocked: false, reason: null };
}

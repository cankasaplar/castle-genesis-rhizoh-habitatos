/**
 * Ground Truth Bridge — gateway cohort outcome aggregates (policy’den bağımsız dış etiketlerin özetı).
 * POST /rhizoh/product/outcome harici sistemlerde; istemci yalnızca GET aggregate + önbellek.
 */

import { loadRhizohProductSession } from "./rhizohProductSessionPersistenceV1.js";
import { getRhizohExternalGroundTruthCachedSync } from "./rhizohExternalGroundTruthV1.js";

export const RHIZOH_GROUND_TRUTH_BRIDGE_VERSION = "1.0.0";

const LS_AGG_CACHE = "rhizoh.grounding.outcome_aggregates.cache.v1";
const CACHE_TTL_MS = 900_000;

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
  const llm = String(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_HTTP || import.meta.env?.VITE_RHIZOH_LLM_HTTP || "" : ""
  ).trim();
  if (!llm) return "";
  try {
    const u = new URL(llm, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return u.origin;
  } catch {
    return "";
  }
}

export function resolveRhizohProductOutcomeAggregateUrl() {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const explicit = String(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_OUTCOME_AGGREGATE_HTTP || "" : ""
  ).trim();
  if (explicit) {
    try {
      const u = new URL(explicit, origin);
      if (u.pathname.includes("/outcome/aggregate")) return u.toString().replace(/\/+$/, "");
      return `${u.origin.replace(/\/+$/, "")}/rhizoh/product/outcome/aggregate`;
    } catch {
      return explicit.includes("/outcome/aggregate")
        ? explicit.replace(/\/+$/, "")
        : `${explicit.replace(/\/+$/, "")}/rhizoh/product/outcome/aggregate`;
    }
  }
  const base = gatewayHttpOriginBestEffort();
  if (!base) return "";
  return `${base.replace(/\/+$/, "")}/rhizoh/product/outcome/aggregate`;
}

function readGatewayTokenBestEffort() {
  try {
    return String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_TOKEN || "" : "").trim();
  } catch {
    return "";
  }
}

function resolveDefaultCohortId() {
  const ext = getRhizohExternalGroundTruthCachedSync();
  if (ext.status === "fresh" && ext.bundle?.populationCohort) return String(ext.bundle.populationCohort);
  return "default";
}

/**
 * @param {unknown} raw
 * @returns {{ cohortId: string, cohortHash?: string, cohortProfile?: object|null, decisionFingerprint: string, outcomeRate: number, sampleN: number, updatedAt: number }[] | null}
 */
export function normalizeRhizohOutcomeAggregateRows(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const sv = String(r.schemaVersion || "");
  if ((sv !== "1.0.0" && sv !== "1.1.0") || !Array.isArray(r.rows)) return null;
  /** @type {object[]} */
  const out = [];
  for (const row of r.rows) {
    if (!row || typeof row !== "object") continue;
    const o = /** @type {Record<string, unknown>} */ (row);
    const cohortId = String(o.cohortId || "");
    const cohortHash = String(o.cohortHash || "");
    const decisionFingerprint = String(o.decisionFingerprint || "");
    const outcomeRate = Number(o.outcomeRate);
    const sampleN = Math.floor(Number(o.sampleN));
    const updatedAt = Number(o.updatedAt);
    if (!cohortId || !decisionFingerprint) continue;
    if (!Number.isFinite(outcomeRate) || !Number.isFinite(sampleN) || sampleN < 1) continue;
    out.push({
      cohortId,
      cohortHash: cohortHash || undefined,
      cohortProfile: o.cohortProfile && typeof o.cohortProfile === "object" ? o.cohortProfile : null,
      decisionFingerprint,
      outcomeRate: Math.max(0, Math.min(1, outcomeRate)),
      sampleN,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0
    });
  }
  return out;
}

/**
 * @returns {{ status: "absent"|"fresh"|"stale"|"invalid", rows: object[], cohortId: string|null, cachedAtMs: number|null }}
 */
export function getRhizohOutcomeAggregatesCachedSync() {
  if (typeof window === "undefined") {
    return { status: "absent", rows: [], cohortId: null, cachedAtMs: null };
  }
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(LS_AGG_CACHE);
    if (!raw) return { status: "absent", rows: [], cohortId: null, cachedAtMs: null };
    const wrap = JSON.parse(raw);
    const cachedAtMs = Number(wrap?.cachedAtMs);
    const cohortId = wrap?.cohortId != null ? String(wrap.cohortId) : null;
    const rows = normalizeRhizohOutcomeAggregateRows({
      schemaVersion: wrap?.schemaVersion,
      rows: wrap?.rows
    });
    if (!Number.isFinite(cachedAtMs) || !rows) return { status: "invalid", rows: [], cohortId: null, cachedAtMs: null };
    const stale = now - cachedAtMs > CACHE_TTL_MS;
    return {
      status: stale ? "stale" : "fresh",
      rows,
      cohortId,
      cachedAtMs
    };
  } catch {
    return { status: "invalid", rows: [], cohortId: null, cachedAtMs: null };
  }
}

/**
 * @param {{ cohortId?: string, decisionFingerprint?: string, limit?: number, sessionIdHint?: string }} [opts]
 */
export async function fetchRhizohOutcomeAggregatesBestEffort(opts = {}) {
  if (typeof window === "undefined") return getRhizohOutcomeAggregatesCachedSync();
  const urlBase = resolveRhizohProductOutcomeAggregateUrl();
  if (!urlBase) return getRhizohOutcomeAggregatesCachedSync();

  const cohortId = opts.cohortId != null ? String(opts.cohortId).trim() : resolveDefaultCohortId();
  const u = new URL(urlBase, window.location.origin);
  u.searchParams.set("cohortId", cohortId || "default");
  if (opts.decisionFingerprint) u.searchParams.set("decisionFingerprint", String(opts.decisionFingerprint).slice(0, 2048));
  u.searchParams.set("limit", String(Math.max(1, Math.min(200, Number(opts.limit) || 80))));

  const sid =
    opts.sessionIdHint ||
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
    const res = await fetch(u.toString(), { method: "GET", signal: ctrl?.signal, headers });
    if (!res.ok) return getRhizohOutcomeAggregatesCachedSync();
    const raw = await res.json();
    const rows = normalizeRhizohOutcomeAggregateRows(raw);
    if (!rows) return getRhizohOutcomeAggregatesCachedSync();
    const sv = String(raw?.schemaVersion || "1.1.0");
    const wrap = {
      schemaVersion: sv === "1.0.0" || sv === "1.1.0" ? sv : "1.1.0",
      cachedAtMs: Date.now(),
      cohortId: cohortId || "default",
      rows
    };
    window.localStorage.setItem(LS_AGG_CACHE, JSON.stringify(wrap));
    return getRhizohOutcomeAggregatesCachedSync();
  } catch {
    return getRhizohOutcomeAggregatesCachedSync();
  } finally {
    if (t) window.clearTimeout(t);
  }
}

export function getRhizohGroundTruthBridgeMvpHintSync() {
  const agg = getRhizohOutcomeAggregatesCachedSync();
  const rowCount = Array.isArray(agg.rows) ? agg.rows.length : 0;
  const groundedLearningMode = agg.status === "fresh" && rowCount > 0;
  const cohortConfidence01 =
    rowCount > 0
      ? Math.round(
          (agg.rows.reduce((s, r) => {
            const c = Number(r?.cohortProfile?.confidence01);
            const n = Math.max(1, Number(r?.sampleN) || 1);
            return s + (Number.isFinite(c) ? c : 0.5) * n;
          }, 0) /
            agg.rows.reduce((s, r) => s + Math.max(1, Number(r?.sampleN) || 1), 0)) *
            1000
        ) / 1000
      : null;
  return {
    schemaVersion: "1.0.0",
    bridgeVersion: RHIZOH_GROUND_TRUTH_BRIDGE_VERSION,
    aggregateCacheStatus: agg.status,
    rowCount,
    cohortId: agg.cohortId,
    cohortConfidence01,
    fetchedAtMs: agg.cachedAtMs,
    groundedLearningMode
  };
}

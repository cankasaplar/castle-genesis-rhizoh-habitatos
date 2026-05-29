/**
 * Kohort gözlem tamponu — yalnızca pasif kayıt.
 *
 * Sözleşme (ürün / kontrol ayrımı):
 * - Bu buffer runtime’da gate, izin, rollout veya ürün kararı tetiklemez.
 * - Etiketler allowlist dışına çıkmaz; meta alanları küçük ve sıkı sanitize edilir.
 * - İleride “log = karar motoru” bağlantısı kurulmamalı; kararlar WAL / sunucu politikasında kalır.
 *
 * Export: `window.__CASTLE_COHORT_OBSERVATION_LOG__()` (salt okunur dışa aktarım).
 */

import {
  isCohortEmailAllowlistConfiguredV0,
  isCohortServerGateEnabledV0,
  isInviteOnlyGoogleModeV0
} from "./cohortEmailAllowlistV0.js";

const STORAGE_KEY = "castle.cohort_obs_ring.v1";
const MAX = 80;

/** Yalnızca bu etiketler yazılır — kontrol yüzeyi yok, yalnızca gözlem. */
export const COHORT_OBSERVATION_ALLOWED_TAGS_V0 = Object.freeze(
  new Set([
    "cohort_auth_ok",
    "cohort_allowlist_reject",
    "cohort_server_gate_fail",
    "cohort_server_gate_ok",
    "ingress_shell_app_mount"
  ])
);

const META_KEYS_ALLOWED = new Set(["status", "reason", "anonymous", "serverGate"]);

/**
 * @param {Record<string, unknown>} meta
 */
function sanitizeObservationMetaV0(meta) {
  const out = {};
  if (!meta || typeof meta !== "object") return out;
  for (const [k, v] of Object.entries(meta)) {
    if (!META_KEYS_ALLOWED.has(k)) continue;
    if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 120);
  }
  return out;
}

/** @returns {boolean} */
export function isCohortObservationLogEnabledV0() {
  if (typeof import.meta === "undefined") return false;
  const v = import.meta.env?.VITE_RHIZOH_COHORT_OBSERVATION_LOG;
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  return (
    isInviteOnlyGoogleModeV0() ||
    isCohortServerGateEnabledV0() ||
    isCohortEmailAllowlistConfiguredV0()
  );
}

function readRing() {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeRing(arr) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX)));
  } catch {
    /* quota / private mode */
  }
}

let windowHookInstalled = false;

function installWindowExportOnce() {
  if (typeof window === "undefined" || windowHookInstalled) return;
  windowHookInstalled = true;
  window.__CASTLE_COHORT_OBSERVATION_LOG__ = () => {
    try {
      return JSON.stringify(readRing(), null, 2);
    } catch {
      return "[]";
    }
  };
}

/**
 * @param {{ tag: string, meta?: Record<string, unknown> }} entry
 */
export function recordCohortObservationV0(entry) {
  if (!isCohortObservationLogEnabledV0()) return;
  const tag = String(entry?.tag || "").slice(0, 120);
  if (!COHORT_OBSERVATION_ALLOWED_TAGS_V0.has(tag)) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[cohort_obs] pasif allowlist: etiket yazılmadı:", tag);
    }
    return;
  }
  installWindowExportOnce();
  const meta = sanitizeObservationMetaV0(entry?.meta && typeof entry.meta === "object" ? entry.meta : {});
  const row = { at: Date.now(), tag, meta };
  const next = [...readRing(), row];
  writeRing(next);
}

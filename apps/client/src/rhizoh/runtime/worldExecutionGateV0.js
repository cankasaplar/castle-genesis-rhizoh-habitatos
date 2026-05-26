/**
 * PR-2 — WORLD execution isolation: OFF | PASSIVE | ACTIVE.
 *
 * **Semantic lock (PASSIVE vs ACTIVE):**
 * - **PASSIVE = OBSERVER:** yalnızca cache ingest (`refreshWeatherAtmosphereFeedIfStaleV0` → provenance),
 *   durum türetimi (`buildWorldPresenceStateV0`), **ham** projection türevi (`deriveProjectionHintsV0`).
 *   **Yok:** `_smoothedProjectionHints` güncellemesi, DOM/CSS, castle aura yüzeyi, Cesium sink, renderer.
 * - **ACTIVE = EFFECTOR:** ingest + ham türetim sonrası smoothing belleği + host/castle uygulaması + Cesium sink.
 * - **OFF:** ağ/ingest/orchestrator zamanı yok; tick yalnızca önbellekten salt okunur türetim (ham hints).
 *
 * Env: `VITE_WORLD_EXECUTION_MODE` = `off` | `passive` | `active` (case-insensitive).
 * Unset: follows `isWorldLayerEnabled()` — layer off → OFF, else ACTIVE (PASSIVE must be explicit).
 *
 * @see castleWorldLayerGateV0.js
 * @see liveRuntimeOrchestratorV0.js
 * @see worldPresenceStoreV0.js
 */

import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";

/** İnsan / doküman hizası — runtime stringleri değişmez. */
export const WORLD_EXECUTION_PASSIVE_SEMANTIC = "OBSERVER";
/** İnsan / doküman hizası — runtime stringleri değişmez. */
export const WORLD_EXECUTION_ACTIVE_SEMANTIC = "EFFECTOR";

/** @typedef {"OFF" | "PASSIVE" | "ACTIVE"} WorldExecutionModeV0 */

/**
 * @returns {WorldExecutionModeV0}
 */
export function getWorldExecutionModeV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return isWorldLayerEnabled() ? "ACTIVE" : "OFF";
  }
  const raw = String(import.meta.env.VITE_WORLD_EXECUTION_MODE ?? "").trim().toLowerCase();
  if (raw === "off" || raw === "0" || raw === "false") return "OFF";
  if (raw === "passive" || raw === "passive_only" || raw === "cache") return "PASSIVE";
  if (raw === "active" || raw === "on" || raw === "full") return "ACTIVE";
  return isWorldLayerEnabled() ? "ACTIVE" : "OFF";
}

/** @returns {boolean} */
export function isWorldExecutionOffV0() {
  return getWorldExecutionModeV0() === "OFF";
}

/** @returns {boolean} */
export function isWorldExecutionPassiveV0() {
  return getWorldExecutionModeV0() === "PASSIVE";
}

/** @returns {boolean} */
export function isWorldExecutionActiveV0() {
  return getWorldExecutionModeV0() === "ACTIVE";
}

/**
 * PR — Anchor truth table: **place (world seed) ≠ identity (HOME_BASE)**.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Canonical sentences (system law, not lore):
 * - Sarıyer / `RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0` is **never** the user’s Castle; it is only the
 *   **world-layer calibration / atmosphere breath** seed.
 * - **HOME_BASE** is **Castle Core identity root** — only from Auth → Profile → validated `homeAnchor`
 *   (`homeAnchorAuthorityV0.js`, `primaryAnchorResolverV0.js`).
 *
 * **HOME_BASE ≠ current camera / map viewport.** Map and globe are projection/world locality;
 * they must not be equated with identity in state trees.
 */

import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "./geographicAnchorsV0.js";

export const ANCHOR_TRUTH_TABLE_SCHEMA_V0 = "anchorTruthTable.v0";

/** World runtime bootstrap / calibration semantic (not identity authority). */
export const WORLD_CALIBRATION_ANCHOR_SEMANTIC_ROLE_V0 = "WORLD_LAYER_CALIBRATION_SEED";

/** Castle Core persistent identity root (profile-backed only). */
export const HOME_BASE_SEMANTIC_ROLE_V0 = "CASTLE_CORE_IDENTITY_ROOT";

export const WORLD_CALIBRATION_ANCHOR_ID_V0 = RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0;

/** Short witness for logs / audits. */
export const SARIYER_IS_NOT_USER_CASTLE_LAW_V0 =
  "Sarıyer is never the user's Castle; it is only the world's calibration coordinate seed.";

/** Map / globe / camera locality must not be merged with identity HOME_BASE in SSOT state. */
export const HOME_BASE_NOT_CAMERA_VIEWPORT_LAW_V0 =
  "HOME_BASE is Castle Core identity authority; map viewport and camera pose are projection locality only — never equivalent stores.";

/**
 * HOME_BASE **id** must never alias the world calibration row id (prevents “demo city = me”).
 *
 * @param {{ kind: string, anchor?: { id?: string, provenance?: string } | null }} resolution
 */
export function assertIdentityPrimaryNotCalibrationWorldSeedV0(resolution) {
  if (!resolution || resolution.kind !== "HOME_BASE") return { ok: true };
  const id = resolution.anchor && typeof resolution.anchor.id === "string" ? resolution.anchor.id : "";
  if (id === WORLD_CALIBRATION_ANCHOR_ID_V0) {
    return {
      ok: false,
      code: "HOME_BASE_CANNOT_ALIAS_WORLD_CALIBRATION_ANCHOR_ID",
      detail: SARIYER_IS_NOT_USER_CASTLE_LAW_V0
    };
  }
  return { ok: true };
}

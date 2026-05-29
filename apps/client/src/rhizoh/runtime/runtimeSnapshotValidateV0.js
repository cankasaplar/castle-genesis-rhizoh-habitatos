/**
 * Runtime snapshot validation (log-only, v0).
 * Missing / inconsistent fields → console.warn; never throws in production paths.
 */

import { deriveDeterministicMergeId } from "./runtimeIdentityMergePolicyV0.js";

/**
 * @param {unknown} snap
 * @returns {{ ok: boolean, issues: string[] }}
 */
export function validateRuntimeSnapshotV1(snap) {
  const issues = [];
  if (!snap || typeof snap !== "object") {
    issues.push("snapshot_not_object");
    return { ok: false, issues };
  }
  const s = /** @type {Record<string, unknown>} */ (snap);
  if (String(s.schema || "") !== "runtimeSnapshot.v1") issues.push("schema_mismatch");
  if (typeof s.timestamp !== "number" || !Number.isFinite(s.timestamp)) issues.push("timestamp_invalid");

  const frameId = s.frameId == null ? "" : String(s.frameId);
  const sessionId = String(s.sessionId || "");
  const connectionId = String(s.connectionId || "");

  if (!frameId) issues.push("frameId_empty");
  if (!sessionId) issues.push("sessionId_empty");

  const ari = s.activeRuntimeIdentity;
  if (!ari || typeof ari !== "object") {
    issues.push("activeRuntimeIdentity_missing");
  } else {
    const ar = /** @type {Record<string, unknown>} */ (ari);
    const fv = ar.frameId && typeof ar.frameId === "object" ? String(/** @type {any} */ (ar.frameId).value || "") : "";
    const sv = ar.sessionId && typeof ar.sessionId === "object" ? String(/** @type {any} */ (ar.sessionId).value || "") : "";
    const cv = ar.connectionId && typeof ar.connectionId === "object" ? String(/** @type {any} */ (ar.connectionId).value || "") : "";
    const mv = ar.mergeId && typeof ar.mergeId === "object" ? String(/** @type {any} */ (ar.mergeId).value || "") : "";
    if (fv && frameId && fv !== frameId) issues.push("frameId_mismatch_top_vs_identity");
    if (sv && sessionId && sv !== sessionId) issues.push("sessionId_mismatch_top_vs_identity");
    if (cv !== connectionId) issues.push("connectionId_mismatch_top_vs_identity");
    const expected = deriveDeterministicMergeId(fv || frameId, sv || sessionId, cv || connectionId);
    if (mv && expected && mv !== expected) issues.push("mergeId_derive_mismatch");
    const topWinMerge =
      s.mergeId != null && String(s.mergeId) !== "" ? String(s.mergeId) : "";
    const idMergeVal =
      ar.mergeId && typeof ar.mergeId === "object" ? String(/** @type {any} */ (ar.mergeId).value || "") : "";
    if (topWinMerge && idMergeVal && topWinMerge !== idMergeVal) {
      issues.push("mergeId_window_vs_identity_mismatch");
    }
  }

  const freezeLock = s.freezeGraphLockSha256 == null ? "" : String(s.freezeGraphLockSha256).trim();
  // Vite replaces `import.meta.env.PROD` at bundle time; dev skips noisy lock absence.
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PROD && !freezeLock) {
    issues.push("freeze_graph_lock_empty");
  }

  const ok = issues.length === 0;
  return { ok, issues };
}

/**
 * @param {unknown} snap
 */
export function logRuntimeSnapshotValidationIssues(snap) {
  const { ok, issues } = validateRuntimeSnapshotV1(snap);
  if (ok) return;
  try {
    console.warn("[CASTLE_SNAPSHOT_VALIDATION]", JSON.stringify({ issues, at: Date.now() }));
  } catch {
    /* noop */
  }
}

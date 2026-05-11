/**
 * Operasyonel drift paneli — tek JSON snapshot (dashboard / observability).
 * LR, dış döngü, policy hızı, rollback, batch/truth gecikmesi.
 */

import { getRhizohExternalGroundTruthCachedSync } from "./rhizohExternalGroundTruthV1.js";
import {
  getRhizohExternalLossLearningRateMultiplier,
  getRhizohExternalLoopAsymmetryScale,
  getRhizohExternalLossBatchIngestSnapshot
} from "./rhizohExternalLossFunctionV1.js";
import { getRhizohProductPolicyAuditTail, loadRhizohProductPolicyState } from "./rhizohProductPolicyStoreV1.js";
import { getRhizohRealWorldAlignmentAssessment } from "./rhizohRealWorldAlignmentV1.js";
import { getRhizohGroundingPostureSnapshot } from "./rhizohGroundingPostureV1.js";

export const RHIZOH_OPERATIONAL_DRIFT_PANEL_VERSION = "1.0.2";

const AUDIT_WINDOW_MS = 86_400_000;

/**
 * @param {Record<string, unknown> | number | null | undefined} [continuityMetaOrNow]
 * @param {number} [maybeNow] — `snapshot(ts)` veya `snapshot(meta, ts)`
 */
export function getRhizohOperationalDriftPanelSnapshot(continuityMetaOrNow, maybeNow) {
  /** @type {Record<string, unknown> | undefined} */
  let continuityMeta;
  let now;
  if (typeof continuityMetaOrNow === "number") {
    continuityMeta = undefined;
    now = continuityMetaOrNow;
  } else if (
    continuityMetaOrNow != null &&
    typeof continuityMetaOrNow === "object" &&
    !Array.isArray(continuityMetaOrNow)
  ) {
    continuityMeta = continuityMetaOrNow;
    now = typeof maybeNow === "number" ? maybeNow : Date.now();
  } else {
    continuityMeta = undefined;
    now = typeof maybeNow === "number" ? maybeNow : Date.now();
  }
  now = Number(now) || Date.now();
  if (typeof window === "undefined") {
    return {
      schemaVersion: "1.0.0",
      panelVersion: RHIZOH_OPERATIONAL_DRIFT_PANEL_VERSION,
      ts: now,
      unavailable: true
    };
  }

  const lr = getRhizohExternalLossLearningRateMultiplier();
  const asym = lr.externalLoopAsymmetry ?? getRhizohExternalLoopAsymmetryScale(now);
  const batch = getRhizohExternalLossBatchIngestSnapshot();
  const extTruth = getRhizohExternalGroundTruthCachedSync();
  const state = loadRhizohProductPolicyState();
  const audit = getRhizohProductPolicyAuditTail(48);

  const since = now - AUDIT_WINDOW_MS;
  const rollbacks24h = audit.filter(
    (e) =>
      e &&
      typeof e.ts === "number" &&
      e.ts >= since &&
      typeof e.action === "string" &&
      e.action.startsWith("rollback_")
  ).length;
  const promotes24h = audit.filter(
    (e) =>
      e &&
      typeof e.ts === "number" &&
      e.ts >= since &&
      typeof e.action === "string" &&
      e.action.startsWith("promote_")
  ).length;

  const lag01 = Math.round((1 - asym.scale01) * 1000) / 1000;
  const spread01 = Math.round(Math.abs(lr.multiplier01 - asym.scale01) * 1000) / 1000;
  const rawAsym = Number(asym.rawScale01);
  const externalLoopRaw01 = Number.isFinite(rawAsym) ? rawAsym : asym.scale01;

  return {
    schemaVersion: "1.0.0",
    panelVersion: RHIZOH_OPERATIONAL_DRIFT_PANEL_VERSION,
    ts: now,
    learningRate: {
      effectiveMultiplier01: lr.multiplier01,
      externalLossScore01: lr.externalLossScore01,
      gradientDisabled: lr.gradientDisabled
    },
    externalLoopAsymmetry: asym,
    divergence: {
      /** Etkin LR ile dış döngü ölçeği arası fark (operasyonel “spread”) */
      lrVsExternalScale01: spread01,
      externalLagIndex01: lag01,
      externalLoopRaw01: externalLoopRaw01
    },
    policyVelocity24h: { promotes: promotes24h, rollbacks: rollbacks24h },
    externalGroundTruth: {
      status: extTruth.status,
      bundleAgeMs: extTruth.bundleAgeMs ?? null,
      populationCohort: extTruth.bundle?.populationCohort ?? null
    },
    batchIngest: batch,
    policyUpdatedAt: state.updatedAt,
    realWorldAlignment: getRhizohRealWorldAlignmentAssessment(continuityMeta, now),
    groundingPosture: getRhizohGroundingPostureSnapshot(now)
  };
}

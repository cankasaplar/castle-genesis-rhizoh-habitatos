/**
 * TLOA-1 — Tri-Layer Observable Artifact: EBE + EBL + ECDM → single snapshot.
 * snapshotContentDigest = epistemic identity / tri-layer coherence fingerprint / replay anchor (see spec §1.3).
 * Snapshot-to-snapshot law / ETK-1: docs/ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md · `ecerEpistemicTransitionKernel.mjs`.
 * @see docs/ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md
 */

import { createHash } from "node:crypto";
import { stableStringifyForDeterminism } from "./evaluateBind.mjs";

export const TLOA_VERSION = "TLOA_1_0";

/** @typedef {'EVOLVE_ALLOWED'|'FROZEN'|'PENDING'|'UNKNOWN'} EvolutionGate */
/** @typedef {'POLICY_EVOLUTION_OK'|'CONSTITUTIONAL_DRIFT'|'AMBIGUOUS'|'UNKNOWN'} LegitimacyClass */
/** @typedef {'IN_BAND'|'FREEZE_RISK'|'DRIFT_RISK'|'UNKNOWN'} StableBandHint */

/**
 * @param {{
 *   betaCap?: Record<string, unknown> | null;
 *   evolutionGate?: string;
 *   lastCommitRef?: string | null;
 *   triangulationRecord?: Record<string, unknown> | null;
 * }} [partial]
 */
export function ebeState(partial) {
  const p = partial && typeof partial === "object" ? partial : {};
  return {
    betaCap: p.betaCap ?? null,
    evolutionGate: typeof p.evolutionGate === "string" ? p.evolutionGate : "UNKNOWN",
    lastCommitRef: p.lastCommitRef ?? null,
    triangulationRecord: p.triangulationRecord ?? null
  };
}

/**
 * @param {{
 *   gpfQueueRef?: string | null;
 *   acceptedGapIds?: string[];
 *   deferredGapIds?: string[];
 *   ledger?: Record<string, unknown> | null;
 *   budgetDimensionsConsumed?: Record<string, unknown> | null;
 * }} [partial]
 */
export function eblState(partial) {
  const p = partial && typeof partial === "object" ? partial : {};
  return {
    gpfQueueRef: p.gpfQueueRef ?? null,
    acceptedGapIds: Array.isArray(p.acceptedGapIds) ? [...p.acceptedGapIds] : [],
    deferredGapIds: Array.isArray(p.deferredGapIds) ? [...p.deferredGapIds] : [],
    ledger: p.ledger ?? null,
    budgetDimensionsConsumed: p.budgetDimensionsConsumed ?? null
  };
}

/**
 * @param {{
 *   legitimacyClass?: string;
 *   bottleneckSignal?: boolean;
 *   coreVersionRefs?: Record<string, string> | null;
 *   driftReportRef?: string | null;
 * }} [partial]
 */
export function ecdmState(partial) {
  const p = partial && typeof partial === "object" ? partial : {};
  return {
    legitimacyClass:
      typeof p.legitimacyClass === "string" ? p.legitimacyClass : "UNKNOWN",
    bottleneckSignal: p.bottleneckSignal === true,
    coreVersionRefs:
      p.coreVersionRefs && typeof p.coreVersionRefs === "object"
        ? { ...p.coreVersionRefs }
        : null,
    driftReportRef: p.driftReportRef ?? null
  };
}

/**
 * @param {{
 *   stableBandHint?: string;
 *   tlsNotes?: string | null;
 * }} [partial]
 */
export function closureState(partial) {
  const p = partial && typeof partial === "object" ? partial : {};
  return {
    stableBandHint:
      typeof p.stableBandHint === "string" ? p.stableBandHint : "UNKNOWN",
    tlsNotes: p.tlsNotes ?? null
  };
}

/**
 * @param {{
 *   snapshotId: string;
 *   capturedAt?: string;
 *   ebe?: Parameters<typeof ebeState>[0];
 *   ebl?: Parameters<typeof eblState>[0];
 *   ecdm?: Parameters<typeof ecdmState>[0];
 *   closure?: Parameters<typeof closureState>[0];
 * }} opts
 */
export function buildTriLayerObservableSnapshot(opts) {
  const capturedAt =
    typeof opts.capturedAt === "string"
      ? opts.capturedAt
      : new Date().toISOString();
  return {
    tloaVersion: TLOA_VERSION,
    snapshotId: opts.snapshotId,
    capturedAt,
    ebe: ebeState(opts.ebe),
    ebl: eblState(opts.ebl),
    ecdm: ecdmState(opts.ecdm),
    closure: closureState(opts.closure)
  };
}

/**
 * Epistemic identity of the tri-layer payload (id/timestamp excluded by default policy — TLOA-1 §8).
 * Same digest ⇒ same canonical epistemic universe for replay/diff bases.
 * @param {ReturnType<typeof buildTriLayerObservableSnapshot>} snapshot
 */
export function snapshotContentDigest(snapshot) {
  const payload = {
    tloaVersion: snapshot.tloaVersion,
    ebe: snapshot.ebe,
    ebl: snapshot.ebl,
    ecdm: snapshot.ecdm,
    closure: snapshot.closure
  };
  const canon = stableStringifyForDeterminism(payload);
  return createHash("sha256").update(canon, "utf8").digest("hex");
}

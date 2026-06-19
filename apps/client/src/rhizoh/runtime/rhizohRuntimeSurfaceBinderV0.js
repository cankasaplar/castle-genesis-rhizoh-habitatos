/**
 * Runtime Surface Binding Layer v0 — unified window.__rhizoh interaction surface.
 * Binds after ontological gate, before React mount (not scheduler-owned).
 * RESEARCH-ONLY — surface projection only; no execution authority.
 */

import {
  fuseCrossSpaceEpistemicV0,
  ingestChessDriftLaneV0,
  ingestCuxPerceptionLaneV0
} from "./crossSpaceCausalFusionV0.js";
import {
  ensureCrossSpaceStabilizationLayerV0,
  fuseAndStabilizeCrossSpaceV0,
  stabilizeCrossSpaceFusionV0
} from "./crossSpaceStabilizationLayerV0.js";
import {
  ensureExecutionPhaseSynchronizerV0,
  runAlignedExecutionPhaseV0
} from "./executionPhaseSynchronizerV0.js";
import {
  ensureAdmissionArbitrationLayerV1,
  arbitrateAdmissionV1,
  getAdmissionArbitrationSnapshotV1
} from "./admissionArbitrationLayerV1.js";
import {
  ensureAuthorityLedgerSealPipelineV1,
  getAuthorityLedgerSnapshotV1,
  replayAuthorityLedgerV1
} from "./authorityLedgerSealPipelineV1.js";
import {
  ingestSportsMatchEventV0,
  normalizeSportsMatchEventV0
} from "./sportsEventAdapterV0.js";

export const RHIZOH_RUNTIME_SURFACE_BINDER_SCHEMA_V0 =
  "castle.rhizoh.runtime_surface_binder.v0";

export const RUNTIME_SURFACE_API_KEYS_V0 = Object.freeze([
  "ingestSportsEvent",
  "ingestChessDriftLane",
  "ingestCuxPerceptionLane",
  "fuseCrossSpaceEpistemic",
  "fuseAndStabilizeCrossSpace",
  "stabilizeCrossSpaceFusion",
  "runExecutionPhase",
  "arbitrateAdmission",
  "admissionArbitration",
  "authorityLedger",
  "replayAuthorityLedger"
]);

/**
 * @param {Record<string, unknown>} [target]
 */
export function bindRhizohRuntimeSurfaceV0(target) {
  const rhizoh =
    target || (typeof window !== "undefined" ? (window.__rhizoh = window.__rhizoh || {}) : null);
  if (!rhizoh) return null;

  rhizoh.ingestSportsEvent = (raw) =>
    ingestSportsMatchEventV0(normalizeSportsMatchEventV0(raw));
  rhizoh.ingestChessDriftLane = (input) => ingestChessDriftLaneV0(input);
  rhizoh.ingestCuxPerceptionLane = (input) => ingestCuxPerceptionLaneV0(input);
  rhizoh.fuseCrossSpaceEpistemic = (opts) => fuseCrossSpaceEpistemicV0(opts);
  rhizoh.fuseAndStabilizeCrossSpace = (opts) => fuseAndStabilizeCrossSpaceV0(opts);
  rhizoh.stabilizeCrossSpaceFusion = (fusion) => stabilizeCrossSpaceFusionV0(fusion);
  rhizoh.runExecutionPhase = (opts) => runAlignedExecutionPhaseV0(opts);
  rhizoh.arbitrateAdmission = (projection) => arbitrateAdmissionV1({ projection });
  rhizoh.admissionArbitration = () => getAdmissionArbitrationSnapshotV1();
  rhizoh.authorityLedger = () => getAuthorityLedgerSnapshotV1();
  rhizoh.replayAuthorityLedger = () => replayAuthorityLedgerV1();

  return rhizoh;
}

/**
 * Namespace completion check — fusion surface must be callable at boot.
 * @param {Record<string, unknown>} [target]
 */
export function assertRhizohRuntimeSurfaceV0(target) {
  const rhizoh = target || (typeof window !== "undefined" ? window.__rhizoh : null);
  const missing = RUNTIME_SURFACE_API_KEYS_V0.filter((key) => typeof rhizoh?.[key] !== "function");
  if (missing.length > 0) {
    throw new Error(`[RHIZOH_SURFACE] missing APIs: ${missing.join(", ")}`);
  }
  return Object.freeze({
    schema: `${RHIZOH_RUNTIME_SURFACE_BINDER_SCHEMA_V0}.assert`,
    ok: true,
    apis: RUNTIME_SURFACE_API_KEYS_V0,
    atMs: Date.now()
  });
}

let surfaceBoundV0 = false;

/**
 * Post-ontological-gate surface bind — idempotent.
 * @param {{ strict?: boolean }} [opts]
 */
export function ensureRhizohRuntimeSurfaceBinderV0(opts = {}) {
  if (typeof window === "undefined") return null;

  bindRhizohRuntimeSurfaceV0(window.__rhizoh);
  ensureCrossSpaceStabilizationLayerV0();
  ensureExecutionPhaseSynchronizerV0();
  ensureAdmissionArbitrationLayerV1();
  ensureAuthorityLedgerSealPipelineV1();

  const strict = opts.strict !== false;
  const assertResult = strict ? assertRhizohRuntimeSurfaceV0(window.__rhizoh) : null;

  if (!surfaceBoundV0) {
    surfaceBoundV0 = true;
    window.__rhizoh.runtimeSurfaceBinder = Object.freeze({
      schema: RHIZOH_RUNTIME_SURFACE_BINDER_SCHEMA_V0,
      phase: "post_ontological_gate_pre_react_mount",
      bound: RUNTIME_SURFACE_API_KEYS_V0,
      atMs: Date.now(),
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  return assertResult;
}

/** @internal vitest */
export function resetRhizohRuntimeSurfaceBinderForTestV0() {
  surfaceBoundV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.runtimeSurfaceBinder;
    for (const key of RUNTIME_SURFACE_API_KEYS_V0) {
      delete window.__rhizoh[key];
    }
  }
}

/**
 * Cross-Space Stabilization Layer v0 — post-fusion normalize, load redistribute,
 * separability threshold, admission-safe projection.
 * Scheduler selects; fusion synthesizes; stabilization projects safely.
 * RESEARCH-ONLY — interpretation only; never mutates execution.
 * @see docs/RHIZOH_CROSS_SPACE_STABILIZATION_LAYER_V0.md
 */

import {
  CROSS_SPACE_FUSION_EVENT_V0,
  fuseCrossSpaceEpistemicV0,
  getCrossSpaceFusionSnapshotV0
} from "./crossSpaceCausalFusionV0.js";
import {
  assessCrossSpaceResourceLoadV0,
  scoreFusionReliabilityV0
} from "./crossSpaceResourceContentionGuardV0.js";
import { selectActiveArenaFrameV0 } from "./multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";

export const CROSS_SPACE_STABILIZATION_SCHEMA_V0 =
  "castle.rhizoh.cross_space_stabilization.v0";
export const CROSS_SPACE_STABILIZATION_EVENT_V0 =
  "rhizoh:cross-space-stabilization-v0";

export const SEPARABILITY_THRESHOLD_V0 = 0.12;
export const ADMISSION_RELIABILITY_FLOOR_V0 = 0.35;

let stabilizationSeqV0 = 0;
/** @type {object | null} */
let lastStabilizationV0 = null;
/** @type {object[]} */
const stabilizationLogV0 = [];

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function emptySharesV0() {
  return Object.freeze({
    SC: 0,
    REC: 0,
    QUOTA: 0,
    SIG: 0,
    ENTROPY_DRIFT: 0,
    PERCEPTION: 0
  });
}

/**
 * L1-normalize fused shares — prevents runaway magnitude in unified field.
 * @param {Record<string, number>} shares
 */
export function normalizeFusionOutputV0(shares = {}) {
  const base = { ...emptySharesV0() };
  for (const [k, v] of Object.entries(shares)) {
    if (Object.prototype.hasOwnProperty.call(base, k)) {
      base[k] = Math.max(0, Number(v) || 0);
    }
  }
  const sum = Object.values(base).reduce((acc, v) => acc + v, 0);
  if (sum <= 1e-9) {
    return Object.freeze({ ...base, _normalized: true, _sumBefore: 0 });
  }
  const normalized = Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, clamp01(v / sum)])
  );
  return Object.freeze({
    ...normalized,
    _normalized: true,
    _sumBefore: sum
  });
}

/**
 * Redistribute lane weights when resource load skews — anti noise-amplification.
 * @param {object} load
 * @param {object} contributions
 */
export function redistributeCrossSpaceLoadV0(load, contributions = {}) {
  let chess = clamp01(Number(contributions.chess?.weight) || 0.35);
  let sports = clamp01(Number(contributions.sports?.weight) || 0.25);
  let cux = clamp01(Number(contributions.cux?.weight) || 0.12);

  if (load?.chessLoad > 0.5) {
    const excess = (load.chessLoad - 0.5) * 0.35;
    chess = Math.max(0.12, chess - excess);
    sports += excess * 0.55;
    cux += excess * 0.45;
  }
  if (load?.sportsLoad > 0.4) {
    const excess = (load.sportsLoad - 0.4) * 0.3;
    sports = Math.max(0.08, sports - excess);
    chess += excess * 0.65;
    cux += excess * 0.35;
  }
  if (load?.overload) {
    cux = Math.max(0.04, cux * 0.7);
    const freed = (Number(contributions.cux?.weight) || 0.12) - cux;
    chess += freed * 0.6;
    sports += freed * 0.4;
  }

  const sum = chess + sports + cux || 1;
  return Object.freeze({
    chess: chess / sum,
    sports: sports / sum,
    cux: cux / sum,
    redistributed: true,
    loadSnapshot: Object.freeze({
      chessLoad: load?.chessLoad ?? 0,
      sportsLoad: load?.sportsLoad ?? 0,
      totalLoad01: load?.totalLoad01 ?? 0,
      overload: Boolean(load?.overload)
    })
  });
}

/**
 * @param {object} laneEntry
 */
function measureLaneSignalV0(laneEntry) {
  const raw = laneEntry?.raw;
  if (!raw?.shares) return 0;
  return Object.values(raw.shares).reduce((acc, v) => acc + Math.abs(Number(v) || 0), 0);
}

/**
 * Separability threshold — each present lane must carry minimum independent signal.
 * @param {object} laneAudit
 * @param {number} [threshold]
 */
export function checkSeparabilityThresholdV0(
  laneAudit = {},
  threshold = SEPARABILITY_THRESHOLD_V0
) {
  const laneNames = ["chess", "sports", "cux"];
  const lanes = laneNames.map((name) => {
    const entry = laneAudit[name] || {};
    const signal = measureLaneSignalV0(entry);
    return Object.freeze({
      lane: name,
      present: Boolean(entry.present),
      signal01: clamp01(signal),
      aboveThreshold: !entry.present || signal >= threshold
    });
  });

  const present = lanes.filter((l) => l.present);
  const above = present.filter((l) => l.aboveThreshold);
  const separabilityOk =
    present.length === 0 || above.length >= Math.max(1, Math.ceil(present.length * 0.5));

  return Object.freeze({
    threshold,
    lanes,
    presentCount: present.length,
    aboveThresholdCount: above.length,
    separabilityOk,
    separabilityPreserved: Boolean(laneAudit.separabilityPreserved)
  });
}

/**
 * Apply redistributed weights to normalized shares.
 * @param {Record<string, number>} normalizedShares
 * @param {object} weights
 * @param {object} contributions
 */
function applyRedistributedWeightsV0(normalizedShares, weights, contributions) {
  const out = { ...emptySharesV0() };
  const lanes = [
    { key: "chess", weight: weights.chess, shares: contributions.chess?.rawShares },
    { key: "sports", weight: weights.sports, shares: contributions.sports?.rawShares },
    { key: "cux", weight: weights.cux, shares: contributions.cux?.rawShares }
  ];
  for (const lane of lanes) {
    const src = lane.shares || {};
    const w = lane.weight || 0;
    for (const [k, v] of Object.entries(src)) {
      if (Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] += (Number(v) || 0) * w;
      }
    }
  }
  for (const [k, v] of Object.entries(normalizedShares)) {
    if (k.startsWith("_")) continue;
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      out[k] = clamp01(out[k] * 0.55 + (Number(v) || 0) * 0.45);
    }
  }
  return normalizeFusionOutputV0(out);
}

/**
 * Produce admission-safe projection from fusion output.
 * @param {object} fusion
 * @param {{ atMs?: number, forceAdmission?: boolean }} [opts]
 */
export function stabilizeCrossSpaceFusionV0(fusion, opts = {}) {
  const atMs = Number(opts.atMs) || fusion?.atMs || Date.now();
  const load = assessCrossSpaceResourceLoadV0(atMs);
  const selection = selectActiveArenaFrameV0(atMs);

  if (!fusion || fusion.deferred || fusion.schema?.endsWith(".deferred")) {
    const hold = Object.freeze({
      schema: `${CROSS_SPACE_STABILIZATION_SCHEMA_V0}.hold`,
      admissionSafe: false,
      holdReason: fusion?.reason || "fusion_deferred",
      fusionRef: fusion?.fusionId || null,
      laneAudit: fusion?.laneAudit || null,
      separability: fusion?.laneAudit
        ? checkSeparabilityThresholdV0(fusion.laneAudit)
        : null,
      load,
      atMs,
      interpretationOnly: true,
      nonExecutive: true
    });
    lastStabilizationV0 = hold;
    return hold;
  }

  const update = fusion.epistemicUpdate || {};
  const laneAudit = fusion.laneAudit || {};
  const contributions = update.laneContributions || {};

  const normalizedShares = normalizeFusionOutputV0(update.fusedShares || {});
  const redistributedWeights = redistributeCrossSpaceLoadV0(load, contributions);
  const stabilizedShares = applyRedistributedWeightsV0(
    normalizedShares,
    redistributedWeights,
    contributions
  );
  const separability = checkSeparabilityThresholdV0(laneAudit);
  const fusionReliability =
    fusion.fusionReliability ||
    scoreFusionReliabilityV0({ epistemicUpdate: update, laneAudit, guard: fusion.guard });

  const guardAdmitted = fusion.guard?.admitted !== false;
  const reliabilityOk = fusionReliability.reliability01 >= ADMISSION_RELIABILITY_FLOOR_V0;
  const admissionSafe =
    opts.forceAdmission === true ||
    (guardAdmitted && separability.separabilityOk && reliabilityOk && !load.overload);

  stabilizationSeqV0 += 1;

  const projection = Object.freeze({
    schema: `${CROSS_SPACE_STABILIZATION_SCHEMA_V0}.projection`,
    stabilizationId: `stab_${stabilizationSeqV0}_${String(fusion.primarySpaceId || "unknown").replace(/\./g, "_")}`,
    stabilizationSeq: stabilizationSeqV0,
    admissionSafe,
    projectionTrustClass: admissionSafe ? "admission_safe" : "hold_projection",
    holdReason: admissionSafe
      ? null
      : !guardAdmitted
        ? "guard_not_admitted"
        : !separability.separabilityOk
          ? "separability_below_threshold"
          : !reliabilityOk
            ? "reliability_below_floor"
            : load.overload
              ? "epistemic_overload"
              : "hold",
    normalizedShares,
    stabilizedShares,
    redistributedWeights,
    separability,
    fusionReliability,
    fusionRef: fusion.fusionId || null,
    fusionSeq: fusion.fusionSeq ?? null,
    primarySpaceId: fusion.primarySpaceId || selection.primarySpaceId || CAUSAL_SPACE_ID_V0.CHESS,
    laneAudit,
    load,
    guard: fusion.guard || null,
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  lastStabilizationV0 = projection;
  stabilizationLogV0.unshift(projection);
  if (stabilizationLogV0.length > 32) stabilizationLogV0.length = 32;

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(CROSS_SPACE_STABILIZATION_EVENT_V0, { detail: projection })
    );
  }

  return projection;
}

/**
 * Fuse + stabilize in one call — surface convenience.
 * @param {object} [opts]
 */
export function fuseAndStabilizeCrossSpaceV0(opts = {}) {
  const fusion = fuseCrossSpaceEpistemicV0(opts);
  const projection = stabilizeCrossSpaceFusionV0(fusion, { atMs: fusion?.atMs });
  return Object.freeze({
    schema: `${CROSS_SPACE_STABILIZATION_SCHEMA_V0}.fuse_and_stabilize`,
    fusion,
    projection,
    admissionSafe: projection.admissionSafe,
    atMs: projection.atMs,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getCrossSpaceStabilizationSnapshotV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_STABILIZATION_SCHEMA_V0}.snapshot`,
    stabilizationSeq: stabilizationSeqV0,
    lastProjection: lastStabilizationV0,
    separabilityThreshold: SEPARABILITY_THRESHOLD_V0,
    admissionReliabilityFloor: ADMISSION_RELIABILITY_FLOOR_V0,
    recentProjections: Object.freeze(stabilizationLogV0.slice(0, 8)),
    fusionDiagnosis: getCrossSpaceFusionSnapshotV0().diagnosis,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildCrossSpaceStabilizationReportV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_STABILIZATION_SCHEMA_V0}.report`,
    note: "Post-fusion stabilization — normalize, redistribute load, separability gate, admission-safe projection",
    snapshot: getCrossSpaceStabilizationSnapshotV0(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.crossSpaceStabilization()",
      stabilize: "window.__rhizoh.stabilizeCrossSpaceFusion(fusion?)",
      fuseAndStabilize: "window.__rhizoh.fuseAndStabilizeCrossSpace()"
    }),
    atMs: Date.now()
  });
}

export function ensureCrossSpaceStabilizationLayerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.crossSpaceStabilization) {
    window.__rhizoh.crossSpaceStabilization = () => getCrossSpaceStabilizationSnapshotV0();
  }
  if (!window.__rhizoh.crossSpaceStabilizationReport) {
    window.__rhizoh.crossSpaceStabilizationReport = () => buildCrossSpaceStabilizationReportV0();
  }
  if (!window.__rhizoh.stabilizeCrossSpaceFusion) {
    window.__rhizoh.stabilizeCrossSpaceFusion = (fusion) =>
      stabilizeCrossSpaceFusionV0(fusion || getCrossSpaceFusionSnapshotV0().lastFusion);
  }
  if (!window.__rhizoh.fuseAndStabilizeCrossSpace) {
    window.__rhizoh.fuseAndStabilizeCrossSpace = (opts) => fuseAndStabilizeCrossSpaceV0(opts);
  }

  if (!window.__rhizoh.__crossSpaceStabilizationWired) {
    window.__rhizoh.__crossSpaceStabilizationWired = true;
    window.addEventListener(CROSS_SPACE_FUSION_EVENT_V0, (ev) => {
      stabilizeCrossSpaceFusionV0(ev?.detail);
    });
  }

  return window.__rhizoh.crossSpaceStabilization;
}

/** @internal vitest */
export function resetCrossSpaceStabilizationForTestV0() {
  stabilizationSeqV0 = 0;
  lastStabilizationV0 = null;
  stabilizationLogV0.length = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.__crossSpaceStabilizationWired;
  }
}

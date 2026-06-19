/**
 * Cross-Space Resource Contention Guard v0 — compute/perception/fusion budget arbitration.
 * Prevents fusion noise amplification when chess cluster + sports burst + CUX compete.
 * RESEARCH-ONLY — orchestrates only, never mutates execution.
 * @see docs/RHIZOH_CROSS_SPACE_RESOURCE_CONTENTION_GUARD_V0.md
 */

import {
  getChessEngineContentionSnapshotV0,
  isChessArenaWorkspaceOpenV0,
  prioritizeArenaEngineForMoveV0
} from "./chessEngineContentionGateV0.js";
import { selectActiveArenaFrameV0 } from "./multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";

export const CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0 =
  "castle.rhizoh.cross_space_resource_guard.v0";
export const RESOURCE_GUARD_EVENT_V0 = "rhizoh:cross-space-resource-guard-v0";

export const RESOURCE_BUDGET_V0 = Object.freeze({
  CHESS_COMPUTE: 0.55,
  SPORTS_BURST: 0.25,
  CUX_PERCEPTION: 0.08,
  FUSION_SYNTHESIS: 0.07,
  HEADROOM: 0.05
});

export const GUARD_DENY_REASON_V0 = Object.freeze({
  EPISTEMIC_OVERLOAD: "epistemic_overload",
  FUSION_BUDGET_EXHAUSTED: "fusion_budget_exhausted",
  CHESS_ENGINE_CONTENTION: "chess_engine_contention",
  SPORTS_BURST_THROTTLE: "sports_burst_throttle"
});

/** @type {Record<string, number>} */
const budgetUsedV0 = {
  chess: 0,
  sports: 0,
  cux: 0,
  fusion: 0
};

let guardSeqV0 = 0;
/** @type {object | null} */
let lastGuardSnapshotV0 = null;

/** @type {object[]} */
const guardLogV0 = [];

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Assess cross-space resource load from chess contention + scheduler primary.
 */
export function assessCrossSpaceResourceLoadV0(atMs = Date.now()) {
  const chess = getChessEngineContentionSnapshotV0();
  const selection = selectActiveArenaFrameV0(atMs);

  const queueLoad = clamp01((Number(chess.queuePending) || 0) / 6);
  const chessLoad = clamp01(
    (chess.contended ? 0.45 : 0.1) +
      (chess.chessLock ? 0.25 : 0) +
      queueLoad * 0.3 +
      (chess.arenaWorkspaceOpen ? 0.15 : 0)
  );

  const sportsBurst =
    selection.sportsBurstActive && selection.primarySpaceId === CAUSAL_SPACE_ID_V0.SPORTS;
  const sportsLoad = clamp01(
    sportsBurst ? 0.35 + budgetUsedV0.sports * 0.4 : budgetUsedV0.sports * 0.2
  );

  const cuxLoad = clamp01(budgetUsedV0.cux * 0.5 + 0.05);
  const fusionLoad = clamp01(budgetUsedV0.fusion * 0.6 + 0.02);

  const totalLoad = clamp01(chessLoad + sportsLoad + cuxLoad + fusionLoad);
  const overload = totalLoad > 1 - RESOURCE_BUDGET_V0.HEADROOM;

  return Object.freeze({
    schema: `${CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0}.load`,
    chessLoad,
    sportsLoad,
    cuxLoad,
    fusionLoad,
    totalLoad01: totalLoad,
    overload,
    recommendDeferFusion: overload || chess.contended,
    recommendPrioritizeArena: chess.arenaWorkspaceOpen && chess.contended,
    chessContention: chess,
    primarySpaceId: selection.primarySpaceId,
    sportsBurstActive: selection.sportsBurstActive,
    atMs,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{ lane: string, cost?: number }} input
 */
export function acquireResourceSlotV0(input) {
  const lane = String(input.lane || "fusion");
  const cost = Math.max(0.01, Number(input.cost) || 0.05);
  const load = assessCrossSpaceResourceLoadV0();

  let cap = RESOURCE_BUDGET_V0.FUSION_SYNTHESIS;
  if (lane === "chess" || lane === "chess_compute") cap = RESOURCE_BUDGET_V0.CHESS_COMPUTE;
  if (lane === "sports" || lane === "sports_burst") cap = RESOURCE_BUDGET_V0.SPORTS_BURST;
  if (lane === "cux" || lane === "cux_perception") cap = RESOURCE_BUDGET_V0.CUX_PERCEPTION;
  if (lane === "fusion") cap = RESOURCE_BUDGET_V0.FUSION_SYNTHESIS;

  const key =
    lane === "chess" || lane === "chess_compute"
      ? "chess"
      : lane === "sports" || lane === "sports_burst"
        ? "sports"
        : lane === "cux" || lane === "cux_perception"
          ? "cux"
          : "fusion";

  const used = budgetUsedV0[key] || 0;
  const granted = used + cost <= cap && !load.overload;

  if (granted) {
    budgetUsedV0[key] = used + cost;
  }

  return Object.freeze({
    schema: `${CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0}.acquire`,
    lane,
    cost,
    granted,
    cap,
    usedAfter: granted ? budgetUsedV0[key] : used,
    reason: granted ? null : load.overload ? GUARD_DENY_REASON_V0.EPISTEMIC_OVERLOAD : GUARD_DENY_REASON_V0.FUSION_BUDGET_EXHAUSTED,
    load,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{ lane: string, cost?: number }} input
 */
export function releaseResourceSlotV0(input) {
  const key =
    input.lane === "chess" || input.lane === "chess_compute"
      ? "chess"
      : input.lane === "sports" || input.lane === "sports_burst"
        ? "sports"
        : input.lane === "cux" || input.lane === "cux_perception"
          ? "cux"
          : "fusion";
  const cost = Math.max(0, Number(input.cost) || 0.05);
  budgetUsedV0[key] = Math.max(0, (budgetUsedV0[key] || 0) - cost);
}

/**
 * Admission gate before fusion synthesis — anti noise-amplification.
 * @param {{ atMs?: number, force?: boolean, phaseLock?: boolean }} [opts]
 */
export function guardFusionAdmissionV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const load = assessCrossSpaceResourceLoadV0(atMs);

  if (load.recommendPrioritizeArena) {
    prioritizeArenaEngineForMoveV0();
  }

  let admitted = true;
  let reason = null;

  if (!opts.force) {
    if (load.overload) {
      admitted = false;
      reason = GUARD_DENY_REASON_V0.EPISTEMIC_OVERLOAD;
    } else if (opts.phaseLock) {
      acquireResourceSlotV0({ lane: "fusion", cost: 0.03 });
    } else if (load.recommendDeferFusion) {
      const slot = acquireResourceSlotV0({ lane: "fusion", cost: 0.04 });
      if (!slot.granted) {
        admitted = false;
        reason = slot.reason || GUARD_DENY_REASON_V0.CHESS_ENGINE_CONTENTION;
      }
    } else {
      acquireResourceSlotV0({ lane: "fusion", cost: 0.03 });
    }
  }

  guardSeqV0 += 1;
  const verdict = Object.freeze({
    schema: CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0,
    guardSeq: guardSeqV0,
    admitted,
    reason,
    phaseLock: Boolean(opts.phaseLock),
    separabilityRequired: true,
    load,
    atMs,
    interpretationOnly: true,
    nonExecutive: true
  });

  lastGuardSnapshotV0 = verdict;
  guardLogV0.unshift(verdict);
  if (guardLogV0.length > 32) guardLogV0.length = 32;

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(RESOURCE_GUARD_EVENT_V0, { detail: verdict }));
  }

  return verdict;
}

/**
 * Fusion reliability — how trustworthy is the unified field?
 * @param {{ epistemicUpdate?: object, laneAudit?: object, guard?: object }} fusion
 */
export function scoreFusionReliabilityV0(fusion = {}) {
  const update = fusion.epistemicUpdate || fusion;
  const laneAudit = fusion.laneAudit || {};
  const guard = fusion.guard || lastGuardSnapshotV0;

  const lanesPresent = ["chess", "sports", "cux"].filter((k) => laneAudit[k]?.present).length;
  const separabilityPreserved = Boolean(laneAudit.separabilityPreserved);
  const baseConfidence = clamp01(update.confidence01 ?? 0.2);

  let noiseRisk = 0.15;
  if (guard?.load?.overload) noiseRisk += 0.45;
  if (guard?.load?.chessContention?.contended) noiseRisk += 0.25;
  if (lanesPresent < 2) noiseRisk += 0.1;
  if (!separabilityPreserved) noiseRisk += 0.35;
  noiseRisk = clamp01(noiseRisk);

  const reliability01 = clamp01(baseConfidence * (1 - noiseRisk * 0.6) + lanesPresent * 0.08);

  return Object.freeze({
    schema: `${CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0}.reliability`,
    reliability01,
    noiseRisk,
    separabilityPreserved,
    lanesPresent,
    fusionTrustClass: reliability01 >= 0.55 ? "trusted_synthesis" : "degraded_synthesis",
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function decayResourceBudgetsV0(factor = 0.85) {
  const f = clamp01(factor);
  for (const key of Object.keys(budgetUsedV0)) {
    budgetUsedV0[key] = (budgetUsedV0[key] || 0) * f;
  }
}

export function getCrossSpaceResourceGuardSnapshotV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0}.snapshot`,
    guardSeq: guardSeqV0,
    lastVerdict: lastGuardSnapshotV0,
    budgetUsed: Object.freeze({ ...budgetUsedV0 }),
    budgets: RESOURCE_BUDGET_V0,
    load: assessCrossSpaceResourceLoadV0(),
    recentVerdicts: Object.freeze(guardLogV0.slice(0, 8)),
    arenaWorkspaceOpen: isChessArenaWorkspaceOpenV0(),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildCrossSpaceResourceGuardReportV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_RESOURCE_GUARD_SCHEMA_V0}.report`,
    note: "Anti noise-amplification guard for chess + sports + CUX + fusion",
    snapshot: getCrossSpaceResourceGuardSnapshotV0(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.crossSpaceResourceGuard()",
      assess: "window.__rhizoh.assessCrossSpaceResourceLoad()",
      guardFusion: "window.__rhizoh.guardFusionAdmission()"
    }),
    atMs: Date.now()
  });
}

export function ensureCrossSpaceResourceGuardV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.crossSpaceResourceGuard) {
    window.__rhizoh.crossSpaceResourceGuard = () => getCrossSpaceResourceGuardSnapshotV0();
  }
  if (!window.__rhizoh.crossSpaceResourceGuardReport) {
    window.__rhizoh.crossSpaceResourceGuardReport = () => buildCrossSpaceResourceGuardReportV0();
  }
  if (!window.__rhizoh.assessCrossSpaceResourceLoad) {
    window.__rhizoh.assessCrossSpaceResourceLoad = () => assessCrossSpaceResourceLoadV0();
  }
  if (!window.__rhizoh.guardFusionAdmission) {
    window.__rhizoh.guardFusionAdmission = (opts) => guardFusionAdmissionV0(opts);
  }
  return window.__rhizoh.crossSpaceResourceGuard;
}

/** @internal vitest */
export function resetCrossSpaceResourceGuardForTestV0() {
  budgetUsedV0.chess = 0;
  budgetUsedV0.sports = 0;
  budgetUsedV0.cux = 0;
  budgetUsedV0.fusion = 0;
  guardSeqV0 = 0;
  lastGuardSnapshotV0 = null;
  guardLogV0.length = 0;
}

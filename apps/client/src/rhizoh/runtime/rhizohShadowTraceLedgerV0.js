/**
 * Shadow Trace Ledger v0 — counterfactual evidence chain (not console log).
 * Pre-legality epistemic dry-run: observation graph without execution/UI effect.
 * RESEARCH-ONLY — never feeds drift detection or move selection.
 */

import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { resolveIngressRouteV0 } from "../ingress/ingress_router.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import {
  __resetEpistemicMemoryGraphForTestV0,
  getEpistemicMemoryGraphComplianceSummaryV0,
  projectShadowTraceToEpistemicMemoryV0
} from "./rhizohEpistemicMemoryGraphV0.js";
import { __resetEpistemicGraphLifecycleForTestV0, getLastEpistemicGraphLifecyclePassV0 } from "./rhizohEpistemicGraphLifecycleV0.js";
import {
  __resetEpistemicGraphInflationGuardForTestV0,
  assessEpistemicGraphInflationRiskV0
} from "./rhizohEpistemicGraphInflationGuardV0.js";
import { getLastCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { getExecutionGovernanceSnapshotV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";

export const RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0 = "castle.rhizoh.shadow_trace_ledger.v0";
export const RHIZOH_SHADOW_TRACE_EVENT_V0 = "rhizoh:shadow-trace-ledger-v0";

export const SHADOW_SOURCE_SYSTEM_V0 = Object.freeze({
  CHESS: "chess",
  MAP: "map",
  COUNCIL: "council",
  COMPLIANCE: "compliance",
  STREAM: "stream"
});

export const SHADOW_TRUST_CLASS_V0 = Object.freeze({
  TRUSTED: "trusted",
  UNTRUSTED: "untrusted",
  ADVERSARIAL: "adversarial"
});

/** Ledger rows must not close feedback loops into drift/policy/move paths. */
export const SHADOW_LEDGER_GOVERNANCE_V0 = Object.freeze({
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  executionEffect: false,
  uiEffect: false,
  epistemicRole: "shadow_trace"
});

const RING_MAX_V0 = 512;
let recordSeqV0 = 0;

/** @type {object[]} */
const ringV0 = [];

/**
 * Shadow Mode = parallel observation runtime without execution authority.
 * Active during legal hold, legal preamble UI, or live chess cluster (pre-READY observation).
 * @returns {boolean}
 */
export function isRhizohShadowModeActiveV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.shadowMode?.force === true) {
    return true;
  }
  try {
    if (isRhizohLegalPendingHoldV0()) return true;
    const ingress = resolveIngressRouteV0();
    if (ingress?.route === "legal_preamble") return true;
    if (ingress?.required && !ingress?.acked) return true;
  } catch {
    /* noop */
  }
  try {
    if (typeof window !== "undefined" && window.__rhizoh?.chessGameCluster?.running) {
      return true;
    }
  } catch {
    /* noop */
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_SHADOW_MODE === "1") {
    return true;
  }
  return false;
}

/**
 * @returns {string}
 */
export function resolveShadowModeReasonV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.shadowMode?.force === true) {
    return "force_flag";
  }
  try {
    if (isRhizohLegalPendingHoldV0()) return "legal_pending_hold";
    const ingress = resolveIngressRouteV0();
    if (ingress?.route === "legal_preamble") return "ingress_legal_preamble";
    if (ingress?.required && !ingress?.acked) return "legal_required_unacked";
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined" && window.__rhizoh?.chessGameCluster?.running) {
    return "chess_cluster_observation";
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_SHADOW_MODE === "1") {
    return "env_shadow_mode";
  }
  return "inactive";
}

/**
 * @param {{
 *   sourceSystem?: string,
 *   eventType?: string,
 *   entropyScore?: number|null,
 *   causalChainId?: string|null,
 *   policyContext?: object|null,
 *   hypotheticalOutcome?: string|null,
 *   trustClass?: string,
 *   matchId?: string|null,
 *   slotId?: number|null,
 *   payload?: object|null
 * }} row
 */
export function appendShadowTraceRecordV0(row = {}) {
  if (!isRhizohShadowModeActiveV0()) return null;

  recordSeqV0 += 1;
  const record = Object.freeze({
    schema: RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0,
    recordId: `shadow_${recordSeqV0}_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    atMs: Date.now(),
    sourceSystem: String(row.sourceSystem || SHADOW_SOURCE_SYSTEM_V0.CHESS),
    eventType: String(row.eventType || "observation"),
    entropyScore:
      row.entropyScore == null ? null : Number(Number(row.entropyScore).toFixed(4)),
    causalChainId: row.causalChainId || null,
    policyContext: row.policyContext ? Object.freeze({ ...row.policyContext }) : null,
    hypotheticalOutcome: row.hypotheticalOutcome || null,
    trustClass: row.trustClass || SHADOW_TRUST_CLASS_V0.TRUSTED,
    matchId: row.matchId || null,
    slotId: row.slotId ?? null,
    payload: row.payload ? Object.freeze({ ...row.payload }) : null,
    governance: SHADOW_LEDGER_GOVERNANCE_V0,
    shadowMode: true
  });

  ringV0.push(record);
  while (ringV0.length > RING_MAX_V0) ringV0.shift();
  projectShadowTraceToEpistemicMemoryV0(record, { trustedCaller: true });
  publishShadowTraceLedgerV0(record);
  return record;
}

function publishShadowTraceLedgerV0(lastRecord = null) {
  if (typeof window === "undefined") return;
  const snap = getShadowTraceLedgerSnapshotV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowTraceLedger = snap;
  if (lastRecord) {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SHADOW_TRACE_EVENT_V0, { detail: lastRecord })
      );
    } catch {
      /* noop */
    }
  }
}

/**
 * @param {object} driftEnvelope — from buildChessDriftLogEnvelopeV0
 */
export function appendShadowTraceFromDriftEventV0(driftEnvelope) {
  if (!driftEnvelope || driftEnvelope.kind !== "DRIFT_EVENT") return null;
  const entropy = Number(driftEnvelope.entropyScore ?? driftEnvelope.driftMagnitude) || 0;
  const eventType = String(driftEnvelope.eventType || "TOPOLOGY_DRIFT");
  const severity = String(driftEnvelope.severity || "info");

  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType,
    entropyScore: entropy,
    causalChainId: driftEnvelope.causalChainId || null,
    matchId: driftEnvelope.matchId || null,
    slotId: driftEnvelope.slotId ?? driftEnvelope.clusterId ?? null,
    policyContext: Object.freeze({
      severity,
      canonicalPattern: driftEnvelope.canonicalPattern || null,
      mirrorPattern: driftEnvelope.mirrorPattern || null,
      playedFamily: driftEnvelope.playedFamily || null,
      expectedFamily: driftEnvelope.expectedFamily || null
    }),
    hypotheticalOutcome:
      severity === "warn"
        ? "If executed in live kernel: policy_diff would mark drifted; move path unchanged in shadow."
        : "If executed in live kernel: topology would remain locked; no execution branch taken.",
    payload: driftEnvelope
  });
}

/**
 * @param {object} councilObservation
 */
export function appendShadowTraceFromCouncilV0(councilObservation) {
  if (!councilObservation) return null;
  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.COUNCIL,
    eventType: "COUNCIL_EMIT_OBSERVATION",
    entropyScore: 0.5,
    causalChainId: `council_${councilObservation.sessionId || "na"}`,
    matchId: councilObservation.matchId || null,
    slotId: councilObservation.slotId ?? null,
    policyContext: Object.freeze({
      triggers: councilObservation.triggers || [],
      governance: councilObservation.governance || null
    }),
    hypotheticalOutcome:
      "If executed in live kernel: multi-lens annotation only — no move override, no drift feedback.",
    payload: councilObservation
  });
}

/**
 * @param {{ matchId?: string, fen?: string, movetimeMs?: number, depth?: number }} detail
 */
export function appendShadowTraceFromStockfishTimeoutV0(detail = {}) {
  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType: "STOCKFISH_TIMEOUT",
    entropyScore: 0.65,
    causalChainId: `stockfish_timeout_${String(detail.matchId || "na")}_${Date.now()}`,
    matchId: detail.matchId || null,
    slotId: detail.slotId ?? null,
    policyContext: Object.freeze({
      movetimeMs: detail.movetimeMs ?? null,
      depth: detail.depth ?? null,
      fen: detail.fen ? String(detail.fen).slice(0, 48) : null
    }),
    hypotheticalOutcome:
      "If executed in live kernel: heuristic fallback move would play; clock continues; no UI mutation in shadow.",
    payload: detail
  });
}

/**
 * Deterministic anchor trace — slot 0 every move seeds the evidence chain.
 * @param {{ san?: string, slotId?: number, matchId?: string, moveNumber?: number, color?: string }} row
 */
export function appendShadowTraceFromChessMoveAnchorV0(row = {}) {
  const slotId = row.slotId ?? null;
  if (slotId !== CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 && slotId != null) return null;
  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType: "CHESS_MOVE_ANCHOR",
    entropyScore: 0.05,
    causalChainId: `anchor_${String(row.matchId || "na")}_${String(row.moveNumber ?? "x")}`,
    matchId: row.matchId || null,
    slotId: slotId ?? CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    policyContext: Object.freeze({
      san: row.san || null,
      color: row.color || null,
      moveNumber: row.moveNumber ?? null
    }),
    hypotheticalOutcome:
      "If executed in live kernel: move would advance game state and clock; shadow records only.",
    payload: row
  });
}

/** @type {object|null} */
let lastStressRunForComplianceV0 = null;

/**
 * Deterministic replay fingerprint for compliance export (interpretation-only).
 * @param {object[]} rows
 * @param {object | null} [stressRun]
 */
export function computeShadowReplayFingerprintV0(rows, stressRun = lastStressRunForComplianceV0) {
  const tail = rows.slice(-64).map((r) =>
    Object.freeze({
      seq: r.seq,
      eventType: r.eventType,
      causalChainId: r.causalChainId,
      sourceSystem: r.sourceSystem
    })
  );
  const stressPayload =
    stressRun?.ok && stressRun?.conflictGraph
      ? Object.freeze({
          stressRunId: stressRun.stressRunId,
          nodeIds: (stressRun.conflictGraph.nodes || []).map((n) => n.id || n.lensId)
        })
      : null;
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, Object.freeze({ tail, stress: stressPayload }));
}

/**
 * @param {object|null} run — from injectEpistemicStressV0
 */
export function setLastStressRunForComplianceV0(run) {
  lastStressRunForComplianceV0 = run?.ok ? run : null;
}

/**
 * Controlled entropy injection for shadow pipeline validation (DevTools / legal hold).
 */
export function injectShadowEntropyTestV0(opts = {}) {
  const drift = appendShadowTraceFromDriftEventV0({
    kind: "DRIFT_EVENT",
    severity: "warn",
    eventType: "SYNTHETIC_DRIFT_INJECTION",
    causalChainId: `synthetic_${Date.now().toString(36)}`,
    matchId: opts.matchId || "cluster_0_synthetic",
    slotId: opts.slotId ?? CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    entropyScore: Number(opts.entropyScore) || 0.85,
    canonicalPattern: "cluster",
    mirrorPattern: "jump"
  });
  const timeout = appendShadowTraceFromStockfishTimeoutV0({
    matchId: opts.matchId || "cluster_0_synthetic",
    slotId: opts.slotId ?? 0,
    movetimeMs: 320,
    depth: 14,
    fen: opts.fen || "synthetic"
  });
  return Object.freeze({ drift, timeout, shadowModeReason: resolveShadowModeReasonV0() });
}

/**
 * Compliance / YouTube-style deterministic snapshot boundary (state export, not video).
 * @param {string} [label]
 */
export function exportShadowComplianceSnapshotV0(label = "checkpoint") {
  const all = [...ringV0];
  const snap = getShadowTraceLedgerSnapshotV0();
  const driftRows = all.filter((r) => String(r.eventType || "").includes("DRIFT"));
  const councilRows = all.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.COUNCIL);
  const timeoutRows = all.filter((r) => r.eventType === "STOCKFISH_TIMEOUT");
  const anchorRows = all.filter((r) => r.eventType === "CHESS_MOVE_ANCHOR");

  const entropySum = driftRows.reduce((a, r) => a + (Number(r.entropyScore) || 0), 0);
  const entropyMean = driftRows.length ? entropySum / driftRows.length : 0;

  const checkpoint = Object.freeze({
    schema: "castle.rhizoh.shadow_compliance_snapshot.v0",
    snapshotId: `shadow_snap_${Date.now().toString(36)}`,
    label,
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true,
    shadowMode: isRhizohShadowModeActiveV0(),
    shadowModeReason: resolveShadowModeReasonV0(),
    recordCount: snap.recordCount,
    anchorMoveCount: anchorRows.length,
    replayLock: Object.freeze({
      interpretationOnly: true,
      replayFingerprint: computeShadowReplayFingerprintV0(all),
      stressRunId: lastStressRunForComplianceV0?.stressRunId || null,
      memoryGraphDigest: getEpistemicMemoryGraphComplianceSummaryV0().memoryGraphDigest
    }),
    executionGovernance: getExecutionGovernanceSnapshotV0(),
    clusterLearning:
      typeof window !== "undefined" && window.__rhizoh?.chessGameCluster
        ? Object.freeze({
            running: Boolean(window.__rhizoh.chessGameCluster.running),
            sessionGamesEnded: Number(window.__rhizoh.chessGameCluster.sessionGamesEnded) || 0,
            timeControlId: window.__rhizoh.chessGameCluster.timeControlId || null
          })
        : null,
    entropySummary: Object.freeze({
      mean: Number(entropyMean.toFixed(4)),
      max: driftRows.reduce((m, r) => Math.max(m, Number(r.entropyScore) || 0), 0),
      driftEventCount: driftRows.length
    }),
    driftDeltaGraph: Object.freeze(
      driftRows.slice(-24).map((r) =>
        Object.freeze({
          causalChainId: r.causalChainId,
          entropyScore: r.entropyScore,
          slotId: r.slotId,
          eventType: r.eventType
        })
      )
    ),
    councilAggregate: Object.freeze({
      sessionHints: councilRows.length,
      lastTrigger: councilRows[councilRows.length - 1]?.policyContext?.triggers || []
    }),
    timeoutCount: timeoutRows.length,
    stressInjection: (() => {
      const lastStress = lastStressRunForComplianceV0;
      if (!lastStress?.ok) return null;
      return Object.freeze({
        stressRunId: lastStress.stressRunId,
        profile: lastStress.profile,
        recordCount: lastStress.recordCount,
        conflictGraph: lastStress.conflictGraph,
        councilTriggered: Boolean(lastStress.councilObservation || lastStress.councilTrigger)
      });
    })(),
    memoryGraph: getEpistemicMemoryGraphComplianceSummaryV0(),
    graphInflationRisk: assessEpistemicGraphInflationRiskV0(),
    graphLifecycle: getLastEpistemicGraphLifecyclePassV0(),
    anomalyReasoning: (() => {
      const last = getLastCouncilAnomalyReasoningV0();
      if (!last) return null;
      return Object.freeze({
        sessionId: last.sessionId,
        anomalyScore: last.anomalyScore,
        gatewayOk: last.gatewayOk,
        severity: last.severity,
        reasoningChain: last.reasoningChain
      });
    })(),
    governance: SHADOW_LEDGER_GOVERNANCE_V0
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.shadowComplianceSnapshot = checkpoint;
  }

  return checkpoint;
}

export function getShadowTraceLedgerSnapshotV0() {
  const recent = Object.freeze([...ringV0].slice(-32));
  const bySource = Object.freeze({
    chess: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.CHESS).length,
    council: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.COUNCIL).length,
    map: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.MAP).length
  });

  return Object.freeze({
    schema: RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0,
    shadowMode: isRhizohShadowModeActiveV0(),
    shadowModeReason: resolveShadowModeReasonV0(),
    recordCount: ringV0.length,
    bySource,
    recent,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowTraceLedgerForTestV0() {
  ringV0.length = 0;
  recordSeqV0 = 0;
  lastStressRunForComplianceV0 = null;
  __resetEpistemicMemoryGraphForTestV0();
  __resetEpistemicGraphInflationGuardForTestV0();
  __resetEpistemicGraphLifecycleForTestV0();
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.shadowTraceLedger;
    delete window.__rhizoh?.shadowComplianceSnapshot;
  }
}

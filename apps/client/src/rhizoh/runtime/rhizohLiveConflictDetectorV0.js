/**
 * Live Conflict Detector v0 — domain drift + tensor contradiction (read-only).
 * Answers: "is the system telling a consistent story about itself?"
 */

import { auditDomainCoherenceV0 } from "./rhizohDomainCoherenceV0.js";
import { getTruthTraceLogV0, TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";
import { replayTensorIntentV0 } from "./rhizohTensorReplayV0.js";
import { runLiveConsistencyAuditV0 } from "./rhizohLiveConsistencyAuditV0.js";
import { buildCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";

export const RHIZOH_LIVE_CONFLICT_DETECTOR_SCHEMA_V0 = "rhizoh.live_conflict_detector.v0";

/**
 * @param {unknown} value
 */
function stableActionKeyV0(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value);
  }
}

/**
 * @param {unknown} recorded
 * @param {unknown} replayed
 */
function tensorActionsMatchV0(recorded, replayed) {
  const rec =
    recorded && typeof recorded === "object"
      ? recorded.action ?? recorded
      : recorded;
  const rep =
    replayed && typeof replayed === "object"
      ? replayed.action ?? replayed
      : replayed;
  return stableActionKeyV0(rec) === stableActionKeyV0(rep);
}

/**
 * Compare recent tensor decisions against dry-run replay — detect contradictions.
 */
export function detectTensorContradictionsV0(limit = 6) {
  const decisions = getTruthTraceLogV0()
    .filter((t) => t.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION && t.intent && t.domain)
    .slice(-limit);

  /** @type {object[]} */
  const conflicts = [];

  for (const row of decisions) {
    if (row.blocked === true) continue;
    const replay = replayTensorIntentV0(row.domain, row.intent, { source: "conflict_detector" });
    if (!tensorActionsMatchV0(row.tensorAction, replay.result?.action)) {
      conflicts.push(
        Object.freeze({
          code: "tensor_contradiction",
          severity: "high",
          domain: row.domain,
          intent: row.intent,
          recordedAction: row.tensorAction ?? null,
          replayedAction: replay.result?.action ?? null,
          atMs: row.atMs,
          hint: "Live tensor decision no longer matches deterministic replay"
        })
      );
    }
  }

  return Object.freeze({
    checked: decisions.length,
    conflictCount: conflicts.length,
    conflicts: Object.freeze(conflicts)
  });
}

const STRUCTURAL_CONFLICT_CODES_V0 = new Set([
  "domain_drift",
  "tensor_contradiction"
]);

/**
 * @param {string} [pathname]
 * @param {{ structuralOnly?: boolean }} [opts]
 */
export function detectLiveConflictsV0(pathname, opts = {}) {
  const p =
    pathname ||
    (typeof window !== "undefined" ? String(window.location.pathname || "/") : "/");

  const domainCoherence = auditDomainCoherenceV0(p);
  const tensorCheck = detectTensorContradictionsV0();
  const spatialAudit = runLiveConsistencyAuditV0({
    domain: domainCoherence.expectedDomain
  });
  const causal = buildCausalMapLayerV0();

  /** @type {object[]} */
  const conflicts = [];

  if (!domainCoherence.pass) {
    conflicts.push(
      Object.freeze({
        code: "domain_drift",
        severity: "high",
        issues: domainCoherence.issues,
        expected: domainCoherence.expectedDomain,
        core: domainCoherence.coreDomain,
        controlPlane: domainCoherence.controlPlaneDomain,
        hint: "pathname / domainCore / controlPlane misaligned"
      })
    );
  }

  for (const c of tensorCheck.conflicts) conflicts.push(c);

  if (!spatialAudit.pass) {
    conflicts.push(
      Object.freeze({
        code: "spatial_consistency_drift",
        severity: "medium",
        axes: Object.fromEntries(
          Object.entries(spatialAudit.axes).map(([k, v]) => [k, v.pass === false ? v.issues : []])
        ),
        hint: "Spatial layer inconsistent with Cesium readiness or node registry"
      })
    );
  }

  if (causal.nodeCount > 0 && causal.edgeCount === 0) {
    const intentional = causal.compressionContext?.intentional === true;
    conflicts.push(
      Object.freeze({
        code: "causal_graph_disconnected",
        lossType: intentional ? "intentional" : "structural",
        severity: intentional ? "info" : "low",
        nodeCount: causal.nodeCount,
        excludedFromPass: intentional,
        hint: intentional
          ? "Compressed graph awaiting spine edges — not a structural failure."
          : "Events exist but no causal edges — narrative chain incomplete"
      })
    );
  }

  const structuralTruthFail =
    causal.truthLoss?.structuralPass === false ||
    (causal.truthLoss?.v0?.pass === false &&
      causal.truthLoss?.structuralLossCount > 0 &&
      !causal.truthLoss?.compressionContext?.intentional);

  if (structuralTruthFail) {
    conflicts.push(
      Object.freeze({
        code: "semantic_truth_loss",
        lossType: "structural",
        severity: "high",
        structuralLossCount: causal.truthLoss?.structuralLossCount ?? 0,
        intentionalLossCount: causal.truthLoss?.intentionalLossCount ?? 0,
        hint: causal.truthLoss?.selfExplanation
      })
    );
  } else if (
    causal.truthLoss?.intentionalLossCount > 0 &&
    causal.truthLoss?.structuralPass === true
  ) {
    conflicts.push(
      Object.freeze({
        code: "compression_budget_applied",
        lossType: "intentional",
        severity: "info",
        intentionalLossCount: causal.truthLoss.intentionalLossCount,
        hint: causal.truthLoss.compressionBudget?.narrative,
        excludedFromPass: true
      })
    );
  }

  const structuralConflicts = conflicts.filter(
    (c) => STRUCTURAL_CONFLICT_CODES_V0.has(c.code) || c.lossType === "structural"
  );
  const pass = opts.structuralOnly
    ? structuralConflicts.length === 0
    : conflicts.filter((c) => c.excludedFromPass !== true).length === 0;

  const report = Object.freeze({
    schema: RHIZOH_LIVE_CONFLICT_DETECTOR_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    pathname: p,
    pass,
    structuralPass: structuralConflicts.length === 0,
    conflictCount: conflicts.length,
    structuralConflictCount: structuralConflicts.length,
    domainCoherence,
    tensorCheck,
    spatialAuditPass: spatialAudit.pass,
    causalNodeCount: causal.nodeCount,
    conflicts: Object.freeze(conflicts),
    selfExplanation:
      conflicts.length === 0
        ? "System narrative is internally consistent (domain + tensor + spatial)."
        : `${conflicts.length} conflict(s): ${conflicts.map((c) => c.code).join(", ")}.`
  });

  return report;
}

export function publishLiveConflictDetectorV0(pathname) {
  const report = detectLiveConflictsV0(pathname);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.liveConflicts = report;
    window.__rhizoh.detectLiveConflictsV0 = detectLiveConflictsV0;
    window.__RHIZOH_LIVE_CONFLICTS__ = report;
  }
  return report;
}

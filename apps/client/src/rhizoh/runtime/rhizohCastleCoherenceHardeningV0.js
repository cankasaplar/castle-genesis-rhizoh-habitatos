/**
 * Castle Coherence Hardening v0 — perception drift control on shared now surface.
 * ICL drift lock + multi-inhabitant stress + perception divergence detection.
 * @see docs/RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md
 */

import {
  readLastIdentityConsistencyReportV0,
  ICL_DRIFT_CLASS_V0
} from "./rhizohIdentityConsistencyLayerV0.js";
import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { readMultiInhabitantCoPresenceV0 } from "./rhizohMultiInhabitantCoPresenceV0.js";
import { readStudioCastleMappingV0 } from "./rhizohStudioCastleMappingV0.js";
import {
  evaluateAgentCognitionBoundaryV0,
  readAgentCognitionBoundaryReportV0
} from "./rhizohAgentCognitionBoundaryV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

export const CASTLE_COHERENCE_HARDENING_SCHEMA_V0 =
  "castle.rhizoh.castle_coherence_hardening.v0";

export const RHIZOH_CASTLE_COHERENCE_HARDENING_EVENT_V0 =
  "rhizoh:castle-coherence-hardening-v0";

export const PERCEPTION_DRIFT_CLASS_V0 = Object.freeze({
  NONE: "none",
  FORK_RISK: "fork_risk",
  AGENT_PROJECTION_BLEED: "agent_projection_bleed",
  CASTLE_SURFACE_SPLIT: "castle_surface_split",
  ICL_STRUCTURAL: "icl_structural"
});

/** @type {ReturnType<typeof publishCastleCoherenceHardeningV0> | null} */
let lastHardeningReport = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{
 *   castle?: ReturnType<typeof readCastleProjectionV0> | null,
 *   coPresence?: ReturnType<typeof readMultiInhabitantCoPresenceV0> | null,
 *   mapping?: ReturnType<typeof readStudioCastleMappingV0> | null,
 *   icl?: ReturnType<typeof readLastIdentityConsistencyReportV0> | null,
 *   frame?: ReturnType<typeof readLastT0PresenceFrameV0> | null
 * }} [ctx]
 */
export function detectPerceptionDivergenceV0(ctx = {}) {
  const rh = readRhizohV0();
  const castle = ctx.castle ?? readCastleProjectionV0();
  const coPresence = ctx.coPresence ?? readMultiInhabitantCoPresenceV0();
  const mapping = ctx.mapping ?? readStudioCastleMappingV0();
  const icl = ctx.icl ?? readLastIdentityConsistencyReportV0();
  const frame = ctx.frame ?? rh.presenceFrame ?? readLastT0PresenceFrameV0();

  const scrCoherence = frame?.coherenceId || coPresence?.coherence_id || null;
  /** @type {object[]} */
  const signals = [];

  if (castle?.coherence_id && scrCoherence && castle.coherence_id !== scrCoherence) {
    signals.push(
      Object.freeze({
        code: "castle_scr_coherence_split",
        castle: castle.coherence_id,
        scr: scrCoherence
      })
    );
  }

  if (castle?.single_world === false) {
    signals.push(Object.freeze({ code: "castle_world_fork" }));
  }

  const inhabitantCoherences = new Set(
    (coPresence?.inhabitants || [])
      .map((i) => i.coherence_id)
      .filter(Boolean)
      .map(String)
  );
  if (inhabitantCoherences.size > 1) {
    signals.push(
      Object.freeze({
        code: "inhabitant_coherence_split",
        values: Object.freeze([...inhabitantCoherences])
      })
    );
  }

  if (mapping?.producer_to_shared?.some((s) => s.bound === false)) {
    signals.push(Object.freeze({ code: "studio_castle_surface_unbound" }));
  }

  if (coPresence?.violations?.length) {
    signals.push(
      Object.freeze({
        code: "co_presence_violation",
        count: coPresence.violations.length
      })
    );
  }

  if (icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.STRUCTURAL) {
    signals.push(Object.freeze({ code: "icl_structural_drift" }));
  }

  const agentBoundary = readAgentCognitionBoundaryReportV0();
  if (agentBoundary?.ok === false) {
    signals.push(Object.freeze({ code: "agent_projection_bleed" }));
  }

  let drift_class = PERCEPTION_DRIFT_CLASS_V0.NONE;
  if (signals.some((s) => s.code === "castle_world_fork" || s.code === "castle_scr_coherence_split")) {
    drift_class = PERCEPTION_DRIFT_CLASS_V0.FORK_RISK;
  } else if (signals.some((s) => s.code === "agent_projection_bleed")) {
    drift_class = PERCEPTION_DRIFT_CLASS_V0.AGENT_PROJECTION_BLEED;
  } else if (signals.some((s) => s.code === "studio_castle_surface_unbound")) {
    drift_class = PERCEPTION_DRIFT_CLASS_V0.CASTLE_SURFACE_SPLIT;
  } else if (signals.some((s) => s.code === "icl_structural_drift")) {
    drift_class = PERCEPTION_DRIFT_CLASS_V0.ICL_STRUCTURAL;
  } else if (signals.length > 0) {
    drift_class = PERCEPTION_DRIFT_CLASS_V0.FORK_RISK;
  }

  return Object.freeze({
    drift_class,
    signals: Object.freeze(signals),
    ok: drift_class === PERCEPTION_DRIFT_CLASS_V0.NONE,
    scr_coherence_id: scrCoherence,
    castle_coherence_id: castle?.coherence_id || null
  });
}

/**
 * @param {object} [ctx]
 */
export function evaluateCastleCoherenceLockV0(ctx = {}) {
  const icl = ctx.icl ?? readLastIdentityConsistencyReportV0();
  const perception = detectPerceptionDivergenceV0(ctx);
  const coPresence = ctx.coPresence ?? readMultiInhabitantCoPresenceV0();
  const agentBoundary =
    ctx.agentBoundary ??
    evaluateAgentCognitionBoundaryV0(
      (coPresence?.inhabitants || []).filter((i) => i.kind === "agent")
    );

  const iclLocked =
    !icl ||
    (icl.drift?.drift_class !== ICL_DRIFT_CLASS_V0.IDENTITY_BREAK &&
      icl.equivalence?.chain_ok !== false);

  const perceptionLocked = perception.ok === true;
  const coPresenceLocked = coPresence?.ok !== false;
  const agentLocked = agentBoundary.ok === true;

  return Object.freeze({
    ok: iclLocked && perceptionLocked && coPresenceLocked && agentLocked,
    icl_locked: iclLocked,
    perception_locked: perceptionLocked,
    co_presence_locked: coPresenceLocked,
    agent_boundary_locked: agentLocked,
    perception,
    agent_boundary: agentBoundary
  });
}

/**
 * @param {object} [ctx]
 */
export function publishCastleCoherenceHardeningV0(ctx = {}) {
  const lock = evaluateCastleCoherenceLockV0(ctx);
  const castle = readCastleProjectionV0();

  const report = Object.freeze({
    schema: CASTLE_COHERENCE_HARDENING_SCHEMA_V0,
    atMs: Date.now(),
    castle_node_id: castle?.castle_node_id || null,
    world_identity_id: castle?.world_identity_id || null,
    lock,
    perception: lock.perception,
    agent_boundary: lock.agent_boundary,
    shared_now_surface_intact:
      lock.ok && lock.perception.drift_class === PERCEPTION_DRIFT_CLASS_V0.NONE,
    ok: lock.ok
  });

  lastHardeningReport = report;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.castleCoherenceHardening = report;
    window.__rhizoh.castleCoherenceLock = Object.freeze({
      ok: lock.ok,
      perception_drift_class: lock.perception.drift_class,
      icl_locked: lock.icl_locked,
      agent_boundary_locked: lock.agent_boundary_locked,
      projection_locked: lock.perception_locked,
      perception_locked: lock.perception_locked
    });
    if (window.__rhizoh.castleProjection && lock.ok === false) {
      window.__rhizoh.castleProjection = Object.freeze({
        ...window.__rhizoh.castleProjection,
        projection_locked: false,
        hardening_ok: false
      });
    } else if (window.__rhizoh.castleProjection) {
      window.__rhizoh.castleProjection = Object.freeze({
        ...window.__rhizoh.castleProjection,
        projection_locked: true,
        hardening_ok: true
      });
    }
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CASTLE_COHERENCE_HARDENING_EVENT_V0, {
          detail: Object.freeze({ report })
        })
      );
    } catch {
      /* noop */
    }
  }
  return report;
}

/**
 * Multi-inhabitant + perception stress scenarios (deterministic, no network).
 * @param {object} [ctx]
 */
export function runCastleCoherenceStressHarnessV0(ctx = {}) {
  const baseline = publishCastleCoherenceHardeningV0(ctx);

  const scenarios = Object.freeze([
    Object.freeze({
      id: "baseline_shared_now",
      ok: baseline.ok === true,
      drift_class: baseline.perception?.drift_class
    }),
    Object.freeze({
      id: "agent_interpret_only",
      ok: baseline.agent_boundary?.ok === true,
      golden_rule: baseline.agent_boundary?.golden_rule
    }),
    Object.freeze({
      id: "perception_divergence_clear",
      ok: baseline.perception?.ok === true,
      signal_count: baseline.perception?.signals?.length ?? 0
    })
  ]);

  const harness = Object.freeze({
    schema: "castle.rhizoh.castle_coherence_stress_harness.v0",
    atMs: Date.now(),
    scenarios,
    ok: scenarios.every((s) => s.ok === true)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.castleCoherenceStressHarness = harness;
  }
  return harness;
}

export function readCastleCoherenceHardeningReportV0() {
  return (
    lastHardeningReport ||
    (typeof window !== "undefined" ? window.__rhizoh?.castleCoherenceHardening : null) ||
    null
  );
}

export function resetRhizohCastleCoherenceHardeningForTestV0() {
  lastHardeningReport = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.castleCoherenceHardening;
    delete window.__rhizoh.castleCoherenceLock;
    delete window.__rhizoh.castleCoherenceStressHarness;
  }
}

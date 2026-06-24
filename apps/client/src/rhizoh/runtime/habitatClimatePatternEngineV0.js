/**
 * Habitat Climate Pattern Engine v0 — read-only pattern · evolution · identity synthesis.
 * RESEARCH-ONLY — session-local; not 90-day data-plane climate.
 */

import { buildLifeShadowDayBranchComparisonV0 } from "./lifeShadowDayBranchesV0.js";
import { getWorldBridgeMemoryGraphSnapshotV0 } from "./worldBridgeMemoryGraphV0.js";
import { fuseCrossSpaceEpistemicV0 } from "./crossSpaceCausalFusionV0.js";
import { getExecutionGovernanceSnapshotV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";
import { getAdmissionArbitrationSnapshotV1 } from "./admissionArbitrationLayerV1.js";

export const HABITAT_CLIMATE_PATTERN_ENGINE_SCHEMA_V0 =
  "castle.rhizoh.habitat_climate_pattern_engine.v0";

/**
 * @param {{ atMs?: number }} [opts]
 */
export function buildHabitatClimateSnapshotV0(opts = {}) {
  const lifeShadow = buildLifeShadowDayBranchComparisonV0();
  const memory = getWorldBridgeMemoryGraphSnapshotV0();
  const fusion = fuseCrossSpaceEpistemicV0({ atMs: opts.atMs });
  const governance = getExecutionGovernanceSnapshotV0();
  const admission = getAdmissionArbitrationSnapshotV1();
  const laneAudit = fusion?.laneAudit || {};

  const patternLane = Object.freeze({
    dominantBranch: lifeShadow.comparison?.dominantBranch || null,
    dayAShare01: lifeShadow.comparison?.dayAShare01 ?? null,
    dayAEvents: lifeShadow.dayA?.eventCount ?? 0,
    dayBEvents: lifeShadow.dayB?.eventCount ?? 0,
    memoryBySource: Object.freeze({ ...(memory.bySource || {}) })
  });

  const evolutionLane = Object.freeze({
    memoryNodeCount: memory.nodeCount ?? 0,
    fusionSeq: fusion?.fusionSeq ?? null,
    calendarLane: Boolean(laneAudit.calendar?.present),
    mediaLane: Boolean(laneAudit.media?.present),
    activityLane: Boolean(laneAudit.userActivity?.present)
  });

  const identityLane = Object.freeze({
    governanceMode: governance.mode,
    inferenceEligible: admission.lastVerdict?.inferenceEligible === true,
    admissionVerdict: admission.lastVerdict?.verdict || null,
    climateLabel:
      lifeShadow.comparison?.dominantBranch === "day_a"
        ? "continuity_dominant"
        : lifeShadow.comparison?.dominantBranch === "day_b"
          ? "void_dominant"
          : "undifferentiated"
  });

  return Object.freeze({
    schema: HABITAT_CLIMATE_PATTERN_ENGINE_SCHEMA_V0,
    horizon: "session_v0",
    pattern: patternLane,
    evolution: evolutionLane,
    identity: identityLane,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function ensureHabitatClimatePatternEngineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.habitatClimate = () => buildHabitatClimateSnapshotV0();
  return window.__rhizoh.habitatClimate;
}

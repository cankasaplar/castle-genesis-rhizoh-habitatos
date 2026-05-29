/**
 * Phase 20 wire — refresh cross-node resonance from event trace (read-only).
 */

import { getEpistemicEventTraceV0, isEpistemicEventBusEnabledV0 } from "../epistemicEventBusV0.js";
import { isSatelliteNodeRegistryEnabledV0 } from "./satelliteNodeRegistryV0.js";
import {
  analyzeCrossNodeCausalResonanceV0,
  CROSS_NODE_CAUSAL_RESONANCE_SCHEMA_V0
} from "./crossNodeCausalResonanceV0.js";

/** @type {import('./crossNodeCausalResonanceV0.js').CrossNodeCausalResonanceReportV0 | null} */
let latestResonanceV0 = null;

let lastTraceLengthV0 = 0;

export function isCrossNodeResonanceEnabledV0() {
  if (isSatelliteNodeRegistryEnabledV0()) return true;
  return isEpistemicEventBusEnabledV0();
}

export function refreshCrossNodeCausalResonanceV0() {
  if (!isCrossNodeResonanceEnabledV0()) return null;
  const trace = getEpistemicEventTraceV0();
  if (trace.length === 0) return latestResonanceV0;
  if (trace.length === lastTraceLengthV0 && latestResonanceV0) {
    return latestResonanceV0;
  }
  latestResonanceV0 = analyzeCrossNodeCausalResonanceV0(trace);
  lastTraceLengthV0 = trace.length;
  return latestResonanceV0;
}

/**
 * @returns {import('./crossNodeCausalResonanceV0.js').CrossNodeCausalResonanceReportV0 | null}
 */
export function getCrossNodeResonanceForVisualizationV0() {
  return latestResonanceV0 || refreshCrossNodeCausalResonanceV0();
}

export function getCrossNodeCausalResonanceReportV0() {
  return latestResonanceV0;
}

export function clearCrossNodeResonanceWireV0() {
  latestResonanceV0 = null;
  lastTraceLengthV0 = 0;
  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_cross_node_resonance;
    } catch {
      /* noop */
    }
  }
}

export function resetCrossNodeResonanceWireForTestsV0() {
  clearCrossNodeResonanceWireV0();
}

export { CROSS_NODE_CAUSAL_RESONANCE_SCHEMA_V0 };

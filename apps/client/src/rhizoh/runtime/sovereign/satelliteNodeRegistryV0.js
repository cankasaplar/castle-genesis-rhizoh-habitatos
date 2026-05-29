/**
 * Phase 19 — Multi-node satellite registry (non-executive).
 * Shadow coherence graph + topology map — no execution write.
 */

import { isCastleDebugGranularFlagEnabled } from "../castleDebugGateV0.js";
import {
  SOVEREIGN_ANCHOR_BARCELONA_V0,
  SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0
} from "./sovereignNodeOnboardingContractV0.js";

export const SATELLITE_NODE_REGISTRY_SCHEMA_V0 =
  "castle.rhizoh.satellite_node_registry.v0.19";

/** @typedef {Object} SatelliteNodeRecordV0
 * @property {string} nodeId
 * @property {{ lat: number, lon: number, zoom?: number, label?: string }} anchor
 * @property {string} epistemicRole
 * @property {string} zone
 * @property {string} continuity
 * @property {boolean} localPrimary
 * @property {number} registeredAtMs
 */

/** @type {Map<string, SatelliteNodeRecordV0>} */
const registryV0 = new Map();

const PRESET_SATELLITE_NODES_V0 = [
  {
    nodeId: "node:kadikoy_satellite",
    anchor: { ...SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0 },
    epistemicRole: "satellite-observer",
    zone: "local_primary",
    continuity: "pending",
    localPrimary: true
  },
  {
    nodeId: "node:barcelona_satellite",
    anchor: { ...SOVEREIGN_ANCHOR_BARCELONA_V0 },
    epistemicRole: "satellite-observer",
    zone: "coherence_test",
    continuity: "pending",
    localPrimary: false
  }
];

export function isSatelliteNodeRegistryEnabledV0() {
  if (isCastleDebugGranularFlagEnabled("VITE_SATELLITE_NODE_REGISTRY_V0")) return true;
  return isCastleDebugGranularFlagEnabled("VITE_SOVEREIGN_NODE_ONBOARDING");
}

function seedPresetsIfEmptyV0() {
  if (registryV0.size > 0) return;
  for (const p of PRESET_SATELLITE_NODES_V0) {
    registryV0.set(p.nodeId, {
      ...p,
      registeredAtMs: 0
    });
  }
}

/**
 * @param {{
 *   nodeId: string,
 *   anchor: { lat: number, lon: number, zoom?: number, label?: string },
 *   epistemicRole?: string,
 *   zone?: string,
 *   continuity?: string,
 *   localPrimary?: boolean
 * }} node
 */
export function registerSatelliteNodeV0(node) {
  if (!isSatelliteNodeRegistryEnabledV0()) return null;
  seedPresetsIfEmptyV0();

  const record = Object.freeze({
    nodeId: String(node.nodeId),
    anchor: { ...node.anchor },
    epistemicRole: String(node.epistemicRole || "satellite-observer"),
    zone: String(node.zone || "satellite"),
    continuity: String(node.continuity || "pending"),
    localPrimary: node.localPrimary === true,
    registeredAtMs: Date.now()
  });

  registryV0.set(record.nodeId, record);
  syncRegistryMirrorV0();
  return record;
}

/**
 * @param {import('./sovereignNodeOnboardingWizardV0.js').SovereignNodePreviewV0 & { shadowContinuity?: object }} confirmedNode
 */
export function registerSatelliteNodeFromOnboardingV0(confirmedNode) {
  const nodeId = String(confirmedNode.nodeId || "");
  const label = String(confirmedNode.anchor?.label || "").toLowerCase();
  const isBarcelona =
    label.includes("barcelona") || nodeId.includes("barcelona");
  const isKadikoyPreset = nodeId === "node:kadikoy_satellite";
  const slug = nodeId.replace(/^node:/, "").replace(/_satellite$/, "");
  const zone = isBarcelona
    ? "coherence_test"
    : isKadikoyPreset
      ? "local_primary"
      : `constellation_${slug}`;
  return registerSatelliteNodeV0({
    nodeId: confirmedNode.nodeId,
    anchor: confirmedNode.anchor,
    epistemicRole: confirmedNode.epistemicRole,
    zone,
    continuity: confirmedNode.continuity,
    localPrimary: isKadikoyPreset
  });
}

/**
 * @returns {readonly SatelliteNodeRecordV0[]}
 */
export function listSatelliteNodesV0() {
  seedPresetsIfEmptyV0();
  return [...registryV0.values()];
}

/**
 * @param {string} nodeId
 */
export function getSatelliteNodeV0(nodeId) {
  seedPresetsIfEmptyV0();
  return registryV0.get(String(nodeId)) ?? null;
}

export function clearSatelliteNodeRegistryForTestsV0() {
  registryV0.clear();
  syncRegistryMirrorV0();
}

function syncRegistryMirrorV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh_satellite_node_registry = {
    schema: SATELLITE_NODE_REGISTRY_SCHEMA_V0,
    nodes: listSatelliteNodesV0(),
    executive: false
  };
}

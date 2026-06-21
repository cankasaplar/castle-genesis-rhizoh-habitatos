/**
 * Map pin click policy — each pin type opens its feature without blocking the map.
 * SPECFLOW: RESEARCH-ONLY
 */

import { ORCHESTRATOR_ACTION_REGISTRY_V0 } from "./symbyoMapIntentBridgeV0.js";
import { PEER_CASTLE_SIM_ID_V0 } from "./shadowCastleEventBusV0.js";
import {
  clearMapTransitionBusyV0,
  isMapTransitionBusyV0,
  runMapPinApproachThenV0
} from "./worldMapMeaningfulTransitionV0.js";
import { dispatchV11MapEventPinV0 } from "./mapEventPinDispatchV0.js";

export const MAP_PIN_CLICK_MODE_V0 = Object.freeze({
  IMMEDIATE: "immediate",
  APPROACH: "approach"
});

/** Pin ids / types that open a workspace panel — no fly+dwell delay. */
const IMMEDIATE_PIN_IDS_V0 = new Set([
  "library",
  "chess_arena",
  "rhizoh_portal",
  "my_castle",
  "ghost",
  "event",
  "radio",
  "ai_prime",
  "origin_home_serencebey"
]);

const IMMEDIATE_PIN_TYPES_V0 = new Set([
  "spiralmmo",
  "remote_castle",
  "vault",
  "portal",
  "tower",
  "castle",
  "zone",
  "broadcast",
  "hub",
  "ghost",
  "agent",
  "memory_beacon"
]);

const PANEL_ORCHESTRATOR_ACTIONS_V0 = new Set([
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_LIBRARY,
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_CHESS_ARENA,
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_TOWER_PORTAL,
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_WORKSPACE,
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER,
  ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_SPIRAL_MMO,
  ORCHESTRATOR_ACTION_REGISTRY_V0.ENTER_CASTLE,
  ORCHESTRATOR_ACTION_REGISTRY_V0.ATTACH_VOICE_STREAM
]);

/**
 * @param {object} node
 * @returns {typeof MAP_PIN_CLICK_MODE_V0[keyof typeof MAP_PIN_CLICK_MODE_V0]}
 */
export function resolveMapPinClickModeV0(node) {
  if (!node || typeof node !== "object") return MAP_PIN_CLICK_MODE_V0.APPROACH;
  const id = String(node.id || "").toLowerCase();
  const type = String(node.type || "").toLowerCase();
  if (node.shadowPeerSim || id === PEER_CASTLE_SIM_ID_V0) {
    return MAP_PIN_CLICK_MODE_V0.IMMEDIATE;
  }
  if (IMMEDIATE_PIN_IDS_V0.has(id) || IMMEDIATE_PIN_TYPES_V0.has(type)) {
    return MAP_PIN_CLICK_MODE_V0.IMMEDIATE;
  }
  return MAP_PIN_CLICK_MODE_V0.APPROACH;
}

/**
 * @param {object} node
 * @returns {boolean}
 */
export function shouldMapPinDispatchImmediatelyV0(node) {
  return resolveMapPinClickModeV0(node) === MAP_PIN_CLICK_MODE_V0.IMMEDIATE;
}

/**
 * @param {string} decision
 * @returns {boolean}
 */
export function isPanelOrchestratorActionV0(decision) {
  return PANEL_ORCHESTRATOR_ACTIONS_V0.has(decision);
}

/**
 * Run pin click — immediate feature open for panel pins; staged approach for the rest.
 * @param {object | null} map — Leaflet map
 * @param {object} node
 * @returns {boolean}
 */
export function runMapPinClickInteractionV0(map, node) {
  if (!node || typeof node !== "object") return false;

  const commit = () => dispatchV11MapEventPinV0(node, "click", map);

  if (shouldMapPinDispatchImmediatelyV0(node)) {
    clearMapTransitionBusyV0("pin_immediate_click");
    commit();
    return true;
  }

  if (isMapTransitionBusyV0()) return false;
  return runMapPinApproachThenV0(map, node, {}, commit);
}

/**
 * V11 map event pins — unified dispatch (spiral + zone + tower).
 * Same codex events on mobile tap and desktop click.
 */

import { emitCodexBusV0 } from "../../core/CodexBusV0.js";
import { generatePinEventsV1 } from "../../core/spiralPinFieldV1.js";
import { normalizeMapInteractionV0 } from "../../core/simulationDeviceParityV0.js";
import {
  dispatchRemoteCastleClickV0,
  dispatchSovereignVoiceWarpV0
} from "./sovereignWorldMapNodesV0.js";
import {
  emitV11MapIntentV0,
  SYMBYO_MAP_INTERACTION_V0
} from "./symbyoMapIntentBridgeV0.js";
import { PEER_CASTLE_SIM_ID_V0 } from "./shadowCastleEventBusV0.js";
import { handleShadowSimPeerPinClickV0 } from "./shadowDataPlaneLoopV0.js";

export const RHIZOH_MAP_EVENT_PIN_SCHEMA_V0 = "rhizoh.map_event_pin_dispatch.v0";
export const RHIZOH_MAP_EVENT_PIN_EVENT_V0 = "rhizoh:map-event-pin-v0";

/**
 * @param {object} node
 * @param {string} interaction
 * @param {object} [map]
 */
export function dispatchV11MapEventPinV0(node, interaction = "click", map = null) {
  if (!node || typeof node !== "object") {
    return Object.freeze({ ok: false, reason: "missing_node" });
  }

  const normalized = normalizeMapInteractionV0(interaction);
  const type = String(node.type || "");
  const pinId = String(node.id || "");

  if (type === "remote_castle") {
    if (node.shadowPeerSim || pinId === PEER_CASTLE_SIM_ID_V0) {
      handleShadowSimPeerPinClickV0(node);
      return Object.freeze({ ok: true, route: "shadow_sim_peer" });
    }
    dispatchRemoteCastleClickV0(node);
    return Object.freeze({ ok: true, route: "remote_castle" });
  }

  if (type === "spiralmmo") {
    if (normalized === "hover") {
      emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.HOVER, map);
      publishMapEventPinV0(node, normalized, "spiral_preview");
      return Object.freeze({ ok: true, route: "spiralmmo_preview" });
    }

    const generated = generatePinEventsV1(pinId, normalized);
    emitCodexBusV0("MAP_EVENT_PIN", {
      pinId,
      pinType: type,
      continent: node.continent || "",
      interaction: normalized,
      generatorSeed: generated.pin?.seed,
      emits: generated.pin?.emits
    });
    emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.CLICK, map);
    publishMapEventPinV0(node, normalized, "spiral_awaken");
    return Object.freeze({ ok: true, route: "spiralmmo" });
  }

  emitCodexBusV0("MAP_EVENT_PIN", {
    pinId,
    pinType: type,
    label: node.label || node.name || "",
    interaction: normalized
  });

  const intentKind =
    normalized === "hover" ? SYMBYO_MAP_INTERACTION_V0.HOVER : SYMBYO_MAP_INTERACTION_V0.CLICK;
  emitV11MapIntentV0(node, intentKind, map);
  publishMapEventPinV0(node, normalized, "v11_intent");

  return Object.freeze({ ok: true, route: type || "generic" });
}

/**
 * Voice / nav warp with parity logging.
 */
export function dispatchV11MapVoiceWarpV0(node) {
  dispatchSovereignVoiceWarpV0(node);
  if (node) {
    emitCodexBusV0("MAP_EVENT_PIN", {
      pinId: node.id,
      pinType: node.type,
      interaction: "voice_warp"
    });
  }
}

function publishMapEventPinV0(node, interaction, route) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_MAP_EVENT_PIN_EVENT_V0, {
      detail: Object.freeze({
        schema: RHIZOH_MAP_EVENT_PIN_SCHEMA_V0,
        nodeId: node.id,
        nodeType: node.type,
        interaction,
        route,
        atMs: Date.now()
      })
    })
  );
}

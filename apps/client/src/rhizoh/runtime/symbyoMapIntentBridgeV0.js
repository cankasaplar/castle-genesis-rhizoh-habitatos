/**
 * Symbyo Map Intent Bridge v0.
 *
 * Map is an interaction surface, not a decision engine:
 * Renderer draws nodes; intent layer emits canonical intent; orchestrator bridge
 * returns normalized action candidates without touching Cesium/Leaflet/UI.
 */

import { createRhizohPayloadRefV0, rhizohChecksumStringV0 } from "@castle/protocol";

export const SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0 = "symbyo.map_intent_bridge.v0";

export const SYMBYO_MAP_INTERACTION_V0 = Object.freeze({
  CLICK: "click",
  HOVER: "hover",
  SELECT_REGION: "select_region"
});

export const SYMBYO_MAP_INTENT_TYPE_V0 = Object.freeze({
  ENTER_NODE: "ENTER_NODE",
  PREVIEW_NODE: "PREVIEW_NODE",
  LOAD_CONTEXT: "LOAD_CONTEXT"
});

export const SYMBYO_MAP_ACTION_V0 = Object.freeze({
  OPEN_MEDIA_PLAYER: "OPEN_MEDIA_PLAYER",
  LOAD_3D_SCENE: "LOAD_3D_SCENE",
  ATTACH_VOICE_STREAM: "ATTACH_VOICE_STREAM",
  OPEN_NODE_PANEL: "OPEN_NODE_PANEL",
  LOAD_CONTEXT: "LOAD_CONTEXT",
  NOOP: "NOOP"
});

const CAPABILITY_ALIAS_V0 = Object.freeze({
  BROADCAST: ["media"],
  ZONE: ["media", "3d"],
  HUB: ["media", "voice", "3d"],
  CASTLE: ["media", "voice", "3d", "inventory"],
  PORTAL: ["voice", "3d"],
  VAULT: ["inventory"],
  AI: ["voice"],
  AGENT: ["voice"],
  TOWER: ["voice", "3d"]
});

function normalizeCapabilityListV0(node = {}) {
  const raw = Array.isArray(node.capabilities)
    ? node.capabilities
    : CAPABILITY_ALIAS_V0[String(node.type || "").toUpperCase()] || [];
  return Object.freeze(
    [...new Set(raw.map((cap) => String(cap || "").trim().toLowerCase()).filter(Boolean))]
      .slice(0, 8)
  );
}

export function normalizeSymbyoMapNodeSurfaceV0(node = {}) {
  const id = String(node.id || "").trim().slice(0, 96);
  const type = String(node.type || "node").trim().toLowerCase().slice(0, 40);
  const capabilities = normalizeCapabilityListV0(node);
  return Object.freeze({
    schema: `${SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0}.node_surface`,
    entityRef: createRhizohPayloadRefV0(`symbyo_map_node:${id || type}`),
    nodeIdHash: rhizohChecksumStringV0(id || type),
    nodeType: type,
    capabilityRefs: Object.freeze(
      capabilities.map((cap) => createRhizohPayloadRefV0(`symbyo_map_cap:${id}:${cap}`))
    ),
    capabilities
  });
}

function intentTypeForInteractionV0(interaction) {
  const i = String(interaction || SYMBYO_MAP_INTERACTION_V0.CLICK);
  if (i === SYMBYO_MAP_INTERACTION_V0.HOVER) return SYMBYO_MAP_INTENT_TYPE_V0.PREVIEW_NODE;
  if (i === SYMBYO_MAP_INTERACTION_V0.SELECT_REGION) return SYMBYO_MAP_INTENT_TYPE_V0.LOAD_CONTEXT;
  return SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE;
}

export function createSymbyoMapIntentV0(input = {}) {
  const surface = normalizeSymbyoMapNodeSurfaceV0(input.node || {});
  const interaction = String(input.interaction || SYMBYO_MAP_INTERACTION_V0.CLICK);
  const intentType = intentTypeForInteractionV0(interaction);
  return Object.freeze({
    schema: `${SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0}.intent`,
    source: "symbyo_map_intent_layer",
    decisionAuthority: "orchestrator",
    rendererAuthority: false,
    intentType,
    interaction,
    entityRef: surface.entityRef,
    nodeType: surface.nodeType,
    capabilityKeys: surface.capabilities,
    capabilityRefs: surface.capabilityRefs,
    payloadRef: createRhizohPayloadRefV0(`${surface.entityRef}:${intentType}:${interaction}`),
    atMs: Date.now()
  });
}

export function normalizeSymbyoMapDecisionV0(action, confidence, refs = []) {
  return Object.freeze({
    schema: `${SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0}.normalized_decision`,
    decision: Object.values(SYMBYO_MAP_ACTION_V0).includes(action) ? action : SYMBYO_MAP_ACTION_V0.NOOP,
    confidence: Math.max(0, Math.min(1, Number(confidence) || 0)),
    refs: Object.freeze(refs.filter(Boolean).map((ref) => String(ref).slice(0, 96)))
  });
}

export function resolveSymbyoMapIntentDecisionV0(intent = {}) {
  const refs = [intent.entityRef, intent.payloadRef, ...(Array.isArray(intent.capabilityRefs) ? intent.capabilityRefs : [])];
  const caps = new Set((intent.capabilityKeys || []).map((cap) => String(cap || "").toLowerCase()));
  const hasCapability = (name) => caps.has(String(name || "").toLowerCase());

  if (intent.intentType === SYMBYO_MAP_INTENT_TYPE_V0.PREVIEW_NODE) {
    return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.OPEN_NODE_PANEL, 0.72, refs);
  }
  if (intent.intentType === SYMBYO_MAP_INTENT_TYPE_V0.LOAD_CONTEXT) {
    return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.LOAD_CONTEXT, 0.78, refs);
  }
  if (intent.intentType === SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE) {
    if (String(intent.nodeType || "") === "broadcast" || hasCapability("media")) {
      return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.OPEN_MEDIA_PLAYER, 0.86, refs);
    }
    if (String(intent.nodeType || "") === "portal") {
      return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.ATTACH_VOICE_STREAM, 0.74, refs);
    }
    return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.OPEN_NODE_PANEL, 0.68, refs);
  }
  return normalizeSymbyoMapDecisionV0(SYMBYO_MAP_ACTION_V0.NOOP, 0, refs);
}

export function routeSymbyoMapInteractionToOrchestratorV0(input = {}) {
  const intent = createSymbyoMapIntentV0(input);
  const normalizedDecision = resolveSymbyoMapIntentDecisionV0(intent);
  return Object.freeze({
    schema: SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0,
    intent,
    normalizedDecision,
    sideEffects: Object.freeze([]),
    note: "Map produced intent only; orchestrator owns execution."
  });
}

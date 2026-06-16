/**
 * Symbyo Map Intent Bridge v0.
 *
 * Map is an interaction surface, not a decision engine:
 * Renderer draws nodes; intent layer emits canonical intent; orchestrator bridge
 * returns normalized action candidates without touching Cesium/Leaflet/UI.
 */

import { createRhizohPayloadRefV0, rhizohChecksumStringV0 } from "@castle/protocol";

export const SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0 = "symbyo.map_intent_bridge.v0";
export const SYMBYO_MAP_INTENT_SCHEMA_V0 = Object.freeze(["intent", "nodeId", "context"]);
export const RHIZOH_V11_MAP_INTENT_EVENT_V0 = "rhizoh:v11-map-intent-v0";
export const RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0 = "rhizoh:v11-map-clear-preview-v0";
export const RHIZOH_OPEN_WORKSPACE_EVENT_V1 = "RHIZOH_OPEN_WORKSPACE";
export const RHIZOH_OPEN_LIBRARY_EVENT_V1 = "RHIZOH_OPEN_LIBRARY";
export const RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 = "RHIZOH_OPEN_CHESS_ARENA";
export const RHIZOH_OPEN_CASTLE_EVENT_V1 = "RHIZOH_OPEN_CASTLE";
export const RHIZOH_SHOW_INFO_EVENT_V1 = "RHIZOH_SHOW_INFO";

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

export const RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1 = "RHIZOH_OPEN_TOWER_PORTAL";

export const ORCHESTRATOR_ACTION_REGISTRY_V0 = Object.freeze({
  OPEN_MEDIA_PLAYER: "OPEN_MEDIA_PLAYER",
  OPEN_WORKSPACE: "OPEN_WORKSPACE",
  OPEN_LIBRARY: "OPEN_LIBRARY",
  OPEN_CHESS_ARENA: "OPEN_CHESS_ARENA",
  OPEN_TOWER_PORTAL: "OPEN_TOWER_PORTAL",
  OPEN_SPIRAL_MMO: "OPEN_SPIRAL_MMO",
  ENTER_CASTLE: "ENTER_CASTLE",
  LOAD_WORLD_NODE: "LOAD_WORLD_NODE",
  ATTACH_VOICE_STREAM: "ATTACH_VOICE_STREAM"
});

const CAPABILITY_ALIAS_V0 = Object.freeze({
  BROADCAST: ["media"],
  ZONE: ["media", "3d"],
  HUB: ["media", "voice", "3d"],
  CASTLE: ["media", "voice", "3d", "inventory"],
  PORTAL: ["voice", "3d"],
  VAULT: ["inventory"],
  AI: ["voice"],
  GHOST: ["voice"],
  AGENT: ["voice"],
  TOWER: ["voice", "3d", "media"],
  hub: ["media", "voice", "3d"],
  ghost: ["voice"],
  zone: ["media", "3d"],
  vault: ["inventory"],
  agent: ["voice"],
  broadcast: ["media"],
  portal: ["voice", "3d"],
  tower: ["voice", "3d", "media"],
  castle: ["media", "voice", "3d"],
  spiralmmo: []
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
    intent: intentType,
    nodeId: surface.nodeIdHash,
    context: `map:${surface.nodeType}:${interaction}`
  });
}

export function normalizeSymbyoMapDecisionV0(action, confidence, refs = []) {
  const allowed = Object.values(ORCHESTRATOR_ACTION_REGISTRY_V0);
  return Object.freeze({
    schema: `${SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0}.normalized_decision`,
    decision: allowed.includes(action) ? action : ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE,
    confidence: Math.max(0, Math.min(1, Number(confidence) || 0)),
    refs: Object.freeze(refs.filter(Boolean).map((ref) => String(ref).slice(0, 96)))
  });
}

export function resolveSymbyoMapIntentDecisionV0(intent = {}, surface = {}, node = {}) {
  const refs = [
    surface.entityRef,
    createRhizohPayloadRefV0(`${intent.nodeId}:${intent.intent}:${intent.context}`),
    ...(Array.isArray(surface.capabilityRefs) ? surface.capabilityRefs : [])
  ];
  const caps = new Set((surface.capabilities || []).map((cap) => String(cap || "").toLowerCase()));
  const hasCapability = (name) => caps.has(String(name || "").toLowerCase());
  const nodeId = String(node.id || "").trim().toLowerCase();
  const nodeType = String(surface.nodeType || node.type || "").toLowerCase();

  if (intent.intent === SYMBYO_MAP_INTENT_TYPE_V0.PREVIEW_NODE) {
    return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE, 0.72, refs);
  }
  if (intent.intent === SYMBYO_MAP_INTENT_TYPE_V0.LOAD_CONTEXT) {
    return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE, 0.78, refs);
  }
  if (intent.intent === SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE) {
    if (nodeId === "my_castle") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER, 0.9, refs);
    }
    if (nodeId === "chess_arena") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_CHESS_ARENA, 0.92, refs);
    }
    if (nodeId === "rhizoh_portal" || nodeType === "portal") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_TOWER_PORTAL, 0.9, refs);
    }
    if (nodeId === "library" || nodeType === "vault") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_LIBRARY, 0.9, refs);
    }
    if (nodeType === "castle") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.ENTER_CASTLE, 0.8, refs);
    }
    if (nodeType === "tower") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_WORKSPACE, 0.88, refs);
    }
    if (nodeType === "spiralmmo" || nodeId.includes("spiralmmo")) {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_SPIRAL_MMO, 0.9, refs);
    }
    if (nodeType === "broadcast" || nodeType === "zone" || nodeType === "hub") {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER, 0.86, refs);
    }
    if (hasCapability("media")) {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER, 0.82, refs);
    }
    if (nodeType === "portal" || hasCapability("voice")) {
      return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.ATTACH_VOICE_STREAM, 0.74, refs);
    }
  }
  return normalizeSymbyoMapDecisionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE, 0.2, refs);
}

export function routeSymbyoMapInteractionToOrchestratorV0(input = {}) {
  const surface = normalizeSymbyoMapNodeSurfaceV0(input.node || {});
  const intent = createSymbyoMapIntentV0(input);
  const normalizedDecision = resolveSymbyoMapIntentDecisionV0(intent, surface, input.node || {});
  return Object.freeze({
    schema: SYMBYO_MAP_INTENT_BRIDGE_SCHEMA_V0,
    intent,
    normalizedDecision,
    sideEffects: Object.freeze([]),
    note: "Map produced intent only; orchestrator owns execution."
  });
}

/**
 * Emit canonical v11 map intent (window + document) with optional Leaflet screen anchor.
 * @param {object} node
 * @param {string} interaction
 * @param {object | null} [map]
 */
export function emitV11MapIntentV0(node, interaction, map = null) {
  const routed = routeSymbyoMapInteractionToOrchestratorV0({ node, interaction });
  let screenAnchor = null;
  if (map && Number.isFinite(node?.lat) && Number.isFinite(node?.lon)) {
    try {
      const pt = map.latLngToContainerPoint([node.lat, node.lon]);
      const rect = map.getContainer()?.getBoundingClientRect?.();
      if (rect) {
        screenAnchor = Object.freeze({
          left: rect.left + pt.x,
          top: rect.top + pt.y
        });
      }
    } catch {
      /* noop */
    }
  }
  const detail = Object.freeze({
    ...routed,
    screenAnchor,
    nodeView: Object.freeze({
      id: node.id,
      label: node.label,
      name: node.name,
      type: node.type,
      color: node.color,
      lat: node.lat,
      lon: node.lon,
      description: node.description,
      provider: node.provider,
      continent: node.continent
    })
  });
  if (typeof window !== "undefined") {
    try {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.v11MapLastIntent = detail;
      window.dispatchEvent(
        new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
          detail
        })
      );
      document.dispatchEvent(
        new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
          detail
        })
      );
    } catch {
      /* noop */
    }
  }
  return detail;
}

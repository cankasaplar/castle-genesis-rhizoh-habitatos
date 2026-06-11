/**
 * Rhizoh Map Brain v1 — command selection layer, not a camera executor.
 *
 * Input: conversation/map/entity state.
 * Output: ranked next actions that existing map routers can execute.
 */

export const RHIZOH_MAP_BRAIN_SCHEMA_V1 = "rhizoh.map_brain.v1";

const COMMANDS_V1 = Object.freeze({
  MAP_TOOL: "set_map_tool",
  CESIUM_OP: "cesium_op"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeIntentV1(input) {
  return String(input?.lastIntent || input?.intent || input?.userIntent || "")
    .trim()
    .toLowerCase();
}

function normalizeActionV1(action) {
  return Object.freeze({
    schema: RHIZOH_MAP_BRAIN_SCHEMA_V1,
    id: String(action.id || ""),
    labelTr: String(action.labelTr || action.label || ""),
    labelEn: String(action.labelEn || action.label || ""),
    command: String(action.command || ""),
    confidence: Math.round(clamp01(action.confidence) * 100) / 100,
    reason: String(action.reason || ""),
    mapTool: action.mapTool ? String(action.mapTool) : null,
    op: action.op ? String(action.op) : null,
    geo: action.geo || null
  });
}

function uniqTopActionsV1(actions, limit = 3) {
  const seen = new Set();
  return actions
    .map(normalizeActionV1)
    .filter((action) => {
      if (!action.id || seen.has(action.id)) return false;
      seen.add(action.id);
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, Math.max(1, Math.min(5, Number(limit) || 3)));
}

/**
 * @param {{
 *   conversationState?: {
 *     lastIntent?: string,
 *     activeThreads?: string[],
 *     unresolvedTasks?: string[],
 *     emotionalState?: string
 *   },
 *   mapState?: {
 *     active?: boolean,
 *     activeMapTool?: string,
 *     hasActiveCastle?: boolean,
 *     memoryNodeCount?: number,
 *     hasUserLocation?: boolean,
 *     worldDataReady?: boolean
 *   },
 *   limit?: number
 * }} input
 */
export function buildRhizohMapBrainActionsV1(input = {}) {
  const conversation = input.conversationState || {};
  const map = input.mapState || {};
  const intent = normalizeIntentV1(conversation);
  const activeTool = String(map.activeMapTool || "city_map");
  const mapActive = map.active !== false;
  const hasCastle = map.hasActiveCastle === true;
  const memoryNodeCount = Math.max(0, Number(map.memoryNodeCount) || 0);
  const hasLocation = map.hasUserLocation === true;
  const worldDataReady = map.worldDataReady === true;
  const unresolvedCount =
    (Array.isArray(conversation.activeThreads) ? conversation.activeThreads.length : 0) +
    (Array.isArray(conversation.unresolvedTasks) ? conversation.unresolvedTasks.length : 0);

  /** @type {object[]} */
  const actions = [];

  if (!mapActive || activeTool === "globe") {
    actions.push({
      id: "show_city_map",
      labelTr: "Şehir haritasını aç",
      labelEn: "Open city map",
      command: COMMANDS_V1.MAP_TOOL,
      mapTool: "city_map",
      confidence: mapActive ? 0.78 : 0.94,
      reason: mapActive ? "globe_needs_actionable_surface" : "map_not_active"
    });
  }

  actions.push({
    id: "return_to_core",
    labelTr: "Rhizoh Core'a dön",
    labelEn: "Return to Rhizoh Core",
    command: COMMANDS_V1.CESIUM_OP,
    op: "calibration_root",
    confidence: intent.includes("nerede") || intent.includes("where") ? 0.88 : 0.72,
    reason: "root_anchor_is_safe_default"
  });

  if (hasCastle) {
    actions.push({
      id: "focus_active_castle",
      labelTr: "Castle'a odaklan",
      labelEn: "Focus Castle",
      command: COMMANDS_V1.CESIUM_OP,
      op: "focus_castle",
      confidence: intent.includes("castle") || intent.includes("kale") ? 0.94 : 0.86,
      reason: "active_castle_is_actionable"
    });
  } else {
    actions.push({
      id: "choose_anchor_place",
      labelTr: "Başlangıç konumu seç",
      labelEn: "Choose start place",
      command: COMMANDS_V1.MAP_TOOL,
      mapTool: "anchor_map",
      confidence: hasLocation ? 0.68 : 0.82,
      reason: "no_active_castle_anchor"
    });
  }

  if (memoryNodeCount > 0 || unresolvedCount > 0) {
    actions.push({
      id: "show_memory_nodes",
      labelTr: "Memory node'ları göster",
      labelEn: "Show memory nodes",
      command: COMMANDS_V1.MAP_TOOL,
      mapTool: "anchor_map",
      confidence: memoryNodeCount > 0 ? 0.83 : 0.74,
      reason: memoryNodeCount > 0 ? "memory_nodes_available" : "conversation_has_open_loops"
    });
  }

  if (activeTool !== "satellite" && worldDataReady) {
    actions.push({
      id: "switch_satellite",
      labelTr: "Uydu katmanına geç",
      labelEn: "Switch to satellite",
      command: COMMANDS_V1.MAP_TOOL,
      mapTool: "satellite",
      confidence: intent.includes("gör") || intent.includes("show") ? 0.7 : 0.56,
      reason: "world_data_ready"
    });
  }

  actions.push({
    id: "zoom_in_context",
    labelTr: "Yakınlaştır",
    labelEn: "Zoom in",
    command: COMMANDS_V1.CESIUM_OP,
    op: "zoom_in",
    confidence: hasCastle || memoryNodeCount > 0 ? 0.66 : 0.48,
    reason: "map_camera_available"
  });

  return Object.freeze({
    schema: RHIZOH_MAP_BRAIN_SCHEMA_V1,
    intent,
    actions: Object.freeze(uniqTopActionsV1(actions, input.limit ?? 3))
  });
}

export function formatRhizohMapBrainActionLabelV1(action, locale = "tr") {
  return String(locale) === "tr" ? action?.labelTr || "" : action?.labelEn || "";
}

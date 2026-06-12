/**
 * Rhizoh Map Brain v1 — command selection layer, not a camera executor.
 *
 * Input: conversation/map/entity state.
 * Output: ranked next actions that existing map routers can execute.
 */

export const RHIZOH_MAP_BRAIN_SCHEMA_V1 = "rhizoh.map_brain.v1";
export const RHIZOH_MAP_BRAIN_FEEDBACK_SCHEMA_V1 = "rhizoh.map_brain.feedback.v1";

const FEEDBACK_STORAGE_KEY_V1 = "rhizoh.map_brain.feedback.v1";
const FEEDBACK_MAX_ACTIONS_V1 = 32;

const COMMANDS_V1 = Object.freeze({
  MAP_TOOL: "set_map_tool",
  CESIUM_OP: "cesium_op"
});

export const RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1 = Object.freeze({
  conversation: 0.42,
  map: 0.35,
  entity: 0.23
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
    baseConfidence: Math.round(clamp01(action.baseConfidence ?? action.confidence) * 100) / 100,
    feedbackBias: Math.round((Number(action.feedbackBias) || 0) * 100) / 100,
    contextSource: String(action.contextSource || "map"),
    contextWeight: Math.round(clamp01(action.contextWeight) * 100) / 100,
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

function emptyFeedbackV1() {
  return Object.freeze({
    schema: RHIZOH_MAP_BRAIN_FEEDBACK_SCHEMA_V1,
    actions: Object.freeze({}),
    updatedAtMs: 0
  });
}

function normalizeFeedbackV1(raw) {
  if (!raw || typeof raw !== "object") return emptyFeedbackV1();
  const rows = raw.actions && typeof raw.actions === "object" ? raw.actions : raw;
  /** @type {Record<string, object>} */
  const actions = {};
  for (const [id, value] of Object.entries(rows).slice(-FEEDBACK_MAX_ACTIONS_V1)) {
    if (!id || !value || typeof value !== "object") continue;
    actions[id] = Object.freeze({
      impressions: Math.max(0, Math.floor(Number(value.impressions) || 0)),
      selections: Math.max(0, Math.floor(Number(value.selections) || 0)),
      successes: Math.max(0, Math.floor(Number(value.successes) || 0)),
      failures: Math.max(0, Math.floor(Number(value.failures) || 0)),
      dismissals: Math.max(0, Math.floor(Number(value.dismissals) || 0)),
      lastAtMs: Math.max(0, Number(value.lastAtMs) || 0)
    });
  }
  return Object.freeze({
    schema: RHIZOH_MAP_BRAIN_FEEDBACK_SCHEMA_V1,
    actions: Object.freeze(actions),
    updatedAtMs: Math.max(0, Number(raw.updatedAtMs) || 0)
  });
}

export function readRhizohMapBrainFeedbackV1() {
  if (typeof localStorage === "undefined") return emptyFeedbackV1();
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY_V1);
    return normalizeFeedbackV1(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyFeedbackV1();
  }
}

function writeRhizohMapBrainFeedbackV1(feedback) {
  const normalized = normalizeFeedbackV1(feedback);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY_V1, JSON.stringify(normalized));
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.mapBrainFeedback = normalized;
  }
  return normalized;
}

/**
 * @param {{ actionId?: string, kind?: "impression" | "selected" | "result" | "dismissed", ok?: boolean }} event
 */
export function recordRhizohMapBrainFeedbackV1(event = {}) {
  const actionId = String(event.actionId || "").trim();
  if (!actionId) return readRhizohMapBrainFeedbackV1();
  const kind = String(event.kind || "impression");
  const prev = readRhizohMapBrainFeedbackV1();
  const row = prev.actions[actionId] || {};
  const nextRow = {
    impressions: Math.max(0, Number(row.impressions) || 0),
    selections: Math.max(0, Number(row.selections) || 0),
    successes: Math.max(0, Number(row.successes) || 0),
    failures: Math.max(0, Number(row.failures) || 0),
    dismissals: Math.max(0, Number(row.dismissals) || 0),
    lastAtMs: Date.now()
  };

  if (kind === "impression") nextRow.impressions += 1;
  else if (kind === "selected") nextRow.selections += 1;
  else if (kind === "dismissed") nextRow.dismissals += 1;
  else if (kind === "result") {
    if (event.ok === true) nextRow.successes += 1;
    else nextRow.failures += 1;
  }

  return writeRhizohMapBrainFeedbackV1({
    schema: RHIZOH_MAP_BRAIN_FEEDBACK_SCHEMA_V1,
    actions: Object.freeze({ ...prev.actions, [actionId]: Object.freeze(nextRow) }),
    updatedAtMs: Date.now()
  });
}

export function resetRhizohMapBrainFeedbackForTestV1() {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY_V1);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.mapBrainFeedback;
  }
}

function contextSourceForActionV1(action) {
  const id = String(action.id || "");
  if (id.includes("memory")) return "conversation";
  if (id.includes("castle") || id.includes("anchor")) return "entity";
  return "map";
}

function feedbackBiasForActionV1(actionId, feedback) {
  const row = feedback?.actions?.[actionId];
  if (!row) return 0;
  const impressions = Math.max(0, Number(row.impressions) || 0);
  const selections = Math.max(0, Number(row.selections) || 0);
  const successes = Math.max(0, Number(row.successes) || 0);
  const failures = Math.max(0, Number(row.failures) || 0);
  const dismissals = Math.max(0, Number(row.dismissals) || 0);
  const selectionRate = impressions > 0 ? selections / impressions : selections > 0 ? 1 : 0;
  const resultTotal = successes + failures;
  const resultRate = resultTotal > 0 ? (successes - failures) / resultTotal : 0;
  const dismissalRate = impressions > 0 ? dismissals / impressions : 0;
  return Math.max(-0.12, Math.min(0.12, selectionRate * 0.08 + resultRate * 0.06 - dismissalRate * 0.06));
}

function applyFeedbackAndContextV1(actions, feedback) {
  return actions.map((action) => {
    const contextSource = contextSourceForActionV1(action);
    const contextWeight = RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1[contextSource] || 0.33;
    const feedbackBias = feedbackBiasForActionV1(action.id, feedback);
    return {
      ...action,
      baseConfidence: action.confidence,
      confidence: clamp01(Number(action.confidence) + feedbackBias),
      feedbackBias,
      contextSource,
      contextWeight
    };
  });
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
 *     cesiumReady?: boolean,
 *     activeMapTool?: string,
 *     hasActiveCastle?: boolean,
 *     memoryNodeCount?: number,
 *     hasUserLocation?: boolean,
 *     worldDataReady?: boolean
 *   },
 *   feedbackState?: ReturnType<typeof readRhizohMapBrainFeedbackV1>,
 *   limit?: number
 * }} input
 */
export function buildRhizohMapBrainActionsV1(input = {}) {
  const conversation = input.conversationState || {};
  const map = input.mapState || {};
  const intent = normalizeIntentV1(conversation);
  const activeTool = String(map.activeMapTool || "city_map");
  const mapActive = map.active !== false;
  const cesiumReady = map.cesiumReady === true;
  const hasCastle = map.hasActiveCastle === true;
  const memoryNodeCount = Math.max(0, Number(map.memoryNodeCount) || 0);
  const hasLocation = map.hasUserLocation === true;
  const worldDataReady = map.worldDataReady === true;
  const unresolvedCount =
    (Array.isArray(conversation.activeThreads) ? conversation.activeThreads.length : 0) +
    (Array.isArray(conversation.unresolvedTasks) ? conversation.unresolvedTasks.length : 0);
  const feedback = input.feedbackState || readRhizohMapBrainFeedbackV1();

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

  if (cesiumReady) {
    actions.push({
      id: "return_to_core",
      labelTr: "Rhizoh Core'a dön",
      labelEn: "Return to Rhizoh Core",
      command: COMMANDS_V1.CESIUM_OP,
      op: "calibration_root",
      confidence: intent.includes("nerede") || intent.includes("where") ? 0.88 : 0.72,
      reason: "root_anchor_is_safe_default"
    });
  }

  if (hasCastle && cesiumReady) {
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

  if (cesiumReady) {
    actions.push({
      id: "zoom_in_context",
      labelTr: "Yakınlaştır",
      labelEn: "Zoom in",
      command: COMMANDS_V1.CESIUM_OP,
      op: "zoom_in",
      confidence: hasCastle || memoryNodeCount > 0 ? 0.66 : 0.48,
      reason: "map_camera_available"
    });
  }

  return Object.freeze({
    schema: RHIZOH_MAP_BRAIN_SCHEMA_V1,
    intent,
    contextWeights: RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1,
    feedbackUpdatedAtMs: feedback.updatedAtMs || 0,
    actions: Object.freeze(uniqTopActionsV1(applyFeedbackAndContextV1(actions, feedback), input.limit ?? 3))
  });
}

export function formatRhizohMapBrainActionLabelV1(action, locale = "tr") {
  return String(locale) === "tr" ? action?.labelTr || "" : action?.labelEn || "";
}

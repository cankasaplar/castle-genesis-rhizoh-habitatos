/**
 * T0 habitat focus — single visual hierarchy per moment (conversation · navigation · world).
 * RESEARCH-ONLY surface policy; does not alter execution graph.
 */

export const HABITAT_FOCUS_MODE_V0 = Object.freeze({
  CONVERSATION: "conversation",
  NAVIGATION: "navigation",
  WORLD: "world"
});

const CHAT_BUSY_FIELD_STATES_V0 = new Set([
  "LISTENING",
  "INTERPRETING",
  "GENERATING",
  "EXECUTING",
  "THINKING"
]);

/**
 * @param {{
 *   fieldState?: string,
 *   hasReply?: boolean,
 *   hasDraft?: boolean,
 *   voiceListening?: boolean,
 *   worldMapTool?: string,
 *   productSurface?: string,
 *   realityMode?: string
 * }} [input]
 * @returns {"conversation" | "navigation" | "world"}
 */
export function resolveRhizohHabitatFocusModeV0(input = {}) {
  const fieldState = String(input.fieldState || "IDLE").toUpperCase();
  const hasReply = input.hasReply === true;
  const hasDraft = String(input.hasDraft || "").trim().length > 0;
  const voiceListening = input.voiceListening === true;
  const worldMapTool = String(input.worldMapTool || "globe").toLowerCase();
  const productSurface = String(input.productSurface || "world").toLowerCase();
  const realityMode = String(input.realityMode || "GLOBE").toUpperCase();

  const chatEngaged =
    hasReply ||
    hasDraft ||
    voiceListening ||
    CHAT_BUSY_FIELD_STATES_V0.has(fieldState);

  if (chatEngaged) return HABITAT_FOCUS_MODE_V0.CONVERSATION;

  const worldImmersive =
    productSurface === "world" &&
    (realityMode === "REAL_MAP" || worldMapTool === "satellite" || worldMapTool === "map");

  if (worldImmersive) return HABITAT_FOCUS_MODE_V0.WORLD;

  return HABITAT_FOCUS_MODE_V0.NAVIGATION;
}

/**
 * @param {"conversation" | "navigation" | "world"} mode
 */
export function resolveRhizohHabitatFocusVisualsV0(mode) {
  switch (mode) {
    case HABITAT_FOCUS_MODE_V0.CONVERSATION:
      return Object.freeze({
        wheelOpacity: 0.22,
        wheelScale: 0.52,
        wheelPointerEvents: "none",
        wheelZIndex: 62,
        showMapStrip: false,
        chatScale: 1,
        chatOpacity: 1,
        chatZIndex: 72,
        octoHeightPx: 108,
        octoHeightMaxPx: 124,
        suppressWheelWhisper: true
      });
    case HABITAT_FOCUS_MODE_V0.WORLD:
      return Object.freeze({
        wheelOpacity: 0.48,
        wheelScale: 0.5,
        wheelPointerEvents: "none",
        wheelZIndex: 66,
        showMapStrip: false,
        chatScale: 0.86,
        chatOpacity: 0.78,
        chatZIndex: 64,
        octoHeightPx: 104,
        octoHeightMaxPx: 118,
        suppressWheelWhisper: true
      });
    case HABITAT_FOCUS_MODE_V0.NAVIGATION:
    default:
      return Object.freeze({
        wheelOpacity: 1,
        wheelScale: 0.68,
        wheelPointerEvents: "none",
        wheelZIndex: 68,
        showMapStrip: false,
        chatScale: 0.94,
        chatOpacity: 0.92,
        chatZIndex: 64,
        octoHeightPx: 96,
        octoHeightMaxPx: 110,
        suppressWheelWhisper: false
      });
  }
}

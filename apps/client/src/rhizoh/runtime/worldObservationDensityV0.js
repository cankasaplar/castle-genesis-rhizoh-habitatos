/**
 * UI event density limiter — dampens strip/HUD flood; ingress queue still receives all publishes.
 */

const WINDOW_MS = 5000;
const MAX_UI_EVENTS_PER_WINDOW = 14;
const AGENT_SPOKE_MIN_INTERVAL_MS = 1500;
const WORLD_TICK_UI_MIN_INTERVAL_MS = 3500;

let windowStart = 0;
let windowCount = 0;
let lastAgentSpokeUiAt = 0;
let lastWorldTickUiAt = 0;

/**
 * @param {string} type
 * @returns {{ allow: boolean, reason?: string }}
 */
export function shouldEmitWorldObservationToUiV0(type) {
  const t = String(type || "");
  const now = Date.now();
  if (!windowStart || now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }

  if (t === "agent.spoke") {
    if (now - lastAgentSpokeUiAt < AGENT_SPOKE_MIN_INTERVAL_MS) {
      return { allow: false, reason: "agent_spoke_throttle" };
    }
    lastAgentSpokeUiAt = now;
  }
  if (t === "world.tick") {
    if (now - lastWorldTickUiAt < WORLD_TICK_UI_MIN_INTERVAL_MS) {
      return { allow: false, reason: "world_tick_throttle" };
    }
    lastWorldTickUiAt = now;
  }

  if (windowCount >= MAX_UI_EVENTS_PER_WINDOW) {
    return { allow: false, reason: "density_cap" };
  }
  windowCount += 1;
  return { allow: true };
}

/** Important events always visible in CLEAN/ZEN modes */
export function isPriorityWorldObservationV0(type, payload) {
  const t = String(type || "");
  if (t === "agent.spoke") return true;
  if (t.startsWith("genesis.")) {
    const gt = String(payload?.genesisType || t.replace("genesis.", ""));
    return gt === "SealIssued" || gt === "WorldObservation" || gt === "TickAdvanced";
  }
  return false;
}

export function resetWorldObservationDensityForTestV0() {
  windowStart = 0;
  windowCount = 0;
  lastAgentSpokeUiAt = 0;
  lastWorldTickUiAt = 0;
}

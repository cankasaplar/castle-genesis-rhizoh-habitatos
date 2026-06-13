/**
 * Rhizoh Tower live status v0 — ONLINE / SYNCING / OFFLINE / THINKING
 */

export const TOWER_LIVE_STATUS_V0 = Object.freeze({
  ONLINE: "ONLINE",
  SYNCING: "SYNCING",
  OFFLINE: "OFFLINE",
  THINKING: "THINKING"
});

export const RHIZOH_TOWER_LIVE_STATUS_EVENT_V0 = "rhizoh:tower-live-status-v0";

/**
 * @param {{
 *   gatewayReachable?: boolean,
 *   syncActive?: boolean,
 *   llmInFlight?: boolean,
 *   towerId?: string
 * }} input
 */
export function resolveTowerLiveStatusV0(input = {}) {
  if (input.llmInFlight === true) return TOWER_LIVE_STATUS_V0.THINKING;
  if (input.syncActive === true) return TOWER_LIVE_STATUS_V0.SYNCING;
  if (input.gatewayReachable === false) return TOWER_LIVE_STATUS_V0.OFFLINE;
  return TOWER_LIVE_STATUS_V0.ONLINE;
}

const statusColorV0 = Object.freeze({
  [TOWER_LIVE_STATUS_V0.ONLINE]: "#34d399",
  [TOWER_LIVE_STATUS_V0.SYNCING]: "#38bdf8",
  [TOWER_LIVE_STATUS_V0.OFFLINE]: "#94a3b8",
  [TOWER_LIVE_STATUS_V0.THINKING]: "#fbbf24"
});

/**
 * @param {string} status
 */
export function towerLiveStatusColorV0(status) {
  return statusColorV0[status] || statusColorV0[TOWER_LIVE_STATUS_V0.OFFLINE];
}

let llmInFlightCountV0 = 0;
let syncActiveV0 = false;
let gatewayReachableV0 = true;

export function setRhizohTowerGatewayReachableV0(reachable) {
  gatewayReachableV0 = reachable !== false;
  publishTowerLiveStatusV0();
}

export function setRhizohTowerSyncActiveV0(active) {
  syncActiveV0 = active === true;
  publishTowerLiveStatusV0();
}

export function beginRhizohTowerLlmFlightV0() {
  llmInFlightCountV0 += 1;
  publishTowerLiveStatusV0();
}

export function endRhizohTowerLlmFlightV0() {
  llmInFlightCountV0 = Math.max(0, llmInFlightCountV0 - 1);
  publishTowerLiveStatusV0();
}

/**
 * @param {string} [towerId]
 */
export function readRhizohTowerLiveStatusV0(towerId = "default") {
  return Object.freeze({
    schema: "castle.rhizoh.tower_live_status.v0",
    towerId,
    status: resolveTowerLiveStatusV0({
      gatewayReachable: gatewayReachableV0,
      syncActive: syncActiveV0,
      llmInFlight: llmInFlightCountV0 > 0
    }),
    gatewayReachable: gatewayReachableV0,
    syncActive: syncActiveV0,
    llmInFlight: llmInFlightCountV0 > 0,
    atMs: Date.now()
  });
}

export function publishTowerLiveStatusV0(towerId = "default") {
  if (typeof window === "undefined") return readRhizohTowerLiveStatusV0(towerId);
  const snapshot = readRhizohTowerLiveStatusV0(towerId);
  try {
    window.__RHIZOH_TOWER_LIVE_STATUS__ = snapshot;
    window.dispatchEvent(new CustomEvent(RHIZOH_TOWER_LIVE_STATUS_EVENT_V0, { detail: snapshot }));
  } catch {
    /* noop */
  }
  return snapshot;
}

export function resetRhizohTowerLiveStatusForTestV0() {
  llmInFlightCountV0 = 0;
  syncActiveV0 = false;
  gatewayReachableV0 = true;
}

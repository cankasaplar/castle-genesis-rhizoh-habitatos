/**
 * Default subscribers — Castle "nervous system" wiring.
 * Idempotent install (safe if module evaluated more than once in HMR).
 */

import { subscribeRealityTransition } from "./realityEventBus.js";
import {
  appendCodexDiscoveryNode,
  recordRealityHeatmap,
  rhizohRememberReality,
  syncBroadcastPresence,
  touchGhostPetReality,
  touchGhostPetRealityFailure,
  trackRealityAnalytics
} from "./realityNerveEffects.js";

let installed = false;

function wire(payload) {
  trackRealityAnalytics(payload);
  recordRealityHeatmap(payload);
  rhizohRememberReality(payload);
  if (payload.success) {
    touchGhostPetReality(payload);
  } else {
    touchGhostPetRealityFailure(payload);
  }
  appendCodexDiscoveryNode(payload);
  syncBroadcastPresence(payload);
}

export function installDefaultRealityNerve() {
  if (installed) return;
  installed = true;
  subscribeRealityTransition(wire);
}

installDefaultRealityNerve();

/**
 * SpiralMMO countdown complete → V11 map restore + greenroom / 8-camera lab handoff.
 */

import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { handleProductShellSelectV0 } from "./rhizohDrawerStateMachineV0.js";
import { RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 } from "./spiralMMOAwakeningCycleV0.js";
import { dispatchWorldSpaceMapFlyV0 } from "./worldSpaceMapCommandFacadeV0.js";
import { resolveMapViewportHomeV0 } from "./worldMapViewportBootstrapV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { isReplayModeActiveV0, isCatchUpSettlingV0 } from "./temporalBridgeV0.js";
import { isRhizohCatchUpReplayActiveV0 } from "./rhizohCatchUpGuardV0.js";

export const SPIRAL_MMO_COUNTDOWN_HANDOFF_SCHEMA_V1 = "castle.spiral_mmo_countdown_handoff.v1";
export const RHIZOH_SPIRAL_MMO_COUNTDOWN_HANDOFF_EVENT_V1 = "rhizoh:spiral-mmo-countdown-handoff-v1";

function delayMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const HANDOFF_DEDUPE_MS_V1 = 8000;
let lastHandoffAtMsV1 = 0;

/**
 * End immersion, return to V11 city map, open greenroom drawer (Octo lab is opt-in).
 * Staged to avoid UI lock (immersion CSS + drawer competing).
 * @param {{ source?: string, uiLocale?: string }} [opts]
 */
export async function handoffSpiralCountdownToWaitingRoomV1(opts = {}) {
  if (typeof window === "undefined") return false;

  const source = opts.source || "spiral_countdown_handoff";
  if (isReplayModeActiveV0() || isRhizohCatchUpReplayActiveV0() || isCatchUpSettlingV0()) {
    logCastleLifecycleV0("spiral_handoff_skipped", {
      reason: isReplayModeActiveV0() ? "catch_up_replay" : "catch_up_settling",
      source
    });
    return false;
  }
  const now = Date.now();
  if (now - lastHandoffAtMsV1 < HANDOFF_DEDUPE_MS_V1) {
    logCastleLifecycleV0("spiral_handoff_skipped", { reason: "deduped", source });
    return false;
  }
  lastHandoffAtMsV1 = now;

  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0));
    logCastleLifecycleV0("spiral_handoff_stage", { stage: "immersion_end" });

    await delayMs(120);
    await applyRhizohWorldMapToolV0("city_map", {
      leafletOnly: true,
      source: opts.source || "SPIRAL_COUNTDOWN_HANDOFF"
    });

    const home = resolveMapViewportHomeV0();
    dispatchWorldSpaceMapFlyV0({
      lat: home.lat,
      lon: home.lon,
      zoom: home.zoom,
      source: opts.source || "spiral_countdown_handoff"
    });
    logCastleLifecycleV0("spiral_handoff_stage", { stage: "v11_recenter", ...home });

    await delayMs(900);
    handleProductShellSelectV0("greenroom", {
      source: opts.source || "spiral_countdown_handoff",
      inPlace: true
    });

    window.dispatchEvent(
      new CustomEvent(RHIZOH_SPIRAL_MMO_COUNTDOWN_HANDOFF_EVENT_V1, {
        detail: Object.freeze({
          schema: SPIRAL_MMO_COUNTDOWN_HANDOFF_SCHEMA_V1,
          atMs: Date.now(),
          source: opts.source || "spiral_countdown_handoff"
        })
      })
    );
    logCastleLifecycleV0("spiral_handoff_complete", { source: opts.source || "spiral_countdown_handoff" });
    return true;
  } catch {
    return false;
  }
}

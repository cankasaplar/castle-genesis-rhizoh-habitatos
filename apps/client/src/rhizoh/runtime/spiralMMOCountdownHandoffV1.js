/**
 * SpiralMMO countdown complete → V11 map restore + greenroom / 8-camera lab handoff.
 */

import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { handleProductShellSelectV0 } from "./rhizohDrawerStateMachineV0.js";
import { openOctoYuvaEightCameraLabV1 } from "./octoYuvaMediaLabBridgeV1.js";
import { RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 } from "./spiralMMOAwakeningCycleV0.js";
import { dispatchWorldSpaceMapFlyV0 } from "./worldSpaceMapCommandFacadeV0.js";
import { resolveMapViewportHomeV0 } from "./worldMapViewportBootstrapV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";

export const SPIRAL_MMO_COUNTDOWN_HANDOFF_SCHEMA_V1 = "castle.spiral_mmo_countdown_handoff.v1";
export const RHIZOH_SPIRAL_MMO_COUNTDOWN_HANDOFF_EVENT_V1 = "rhizoh:spiral-mmo-countdown-handoff-v1";

function delayMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * End immersion, return to V11 city map, open greenroom drawer + Octo eight-camera lab.
 * Staged to avoid UI lock (immersion CSS + drawer + lab competing).
 * @param {{ source?: string, uiLocale?: string }} [opts]
 */
export async function handoffSpiralCountdownToWaitingRoomV1(opts = {}) {
  if (typeof window === "undefined") return false;

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

    await delayMs(350);
    openOctoYuvaEightCameraLabV1({
      source: opts.source || "spiral_countdown_handoff",
      title: opts.uiLocale === "tr" ? "Octo Lab · Bekleme odası" : "Octo Lab · Waiting room"
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

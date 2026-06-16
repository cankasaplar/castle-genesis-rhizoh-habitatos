/**
 * SpiralMMO countdown complete → V11 map restore + greenroom / 8-camera lab handoff.
 */

import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { handleProductShellSelectV0 } from "./rhizohDrawerStateMachineV0.js";
import { openOctoYuvaEightCameraLabV1 } from "./octoYuvaMediaLabBridgeV1.js";
import { RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 } from "./spiralMMOAwakeningCycleV0.js";

export const SPIRAL_MMO_COUNTDOWN_HANDOFF_SCHEMA_V1 = "castle.spiral_mmo_countdown_handoff.v1";
export const RHIZOH_SPIRAL_MMO_COUNTDOWN_HANDOFF_EVENT_V1 = "rhizoh:spiral-mmo-countdown-handoff-v1";

/**
 * End immersion, return to V11 city map, open greenroom drawer + Octo eight-camera lab.
 * @param {{ source?: string, uiLocale?: string }} [opts]
 */
export function handoffSpiralCountdownToWaitingRoomV1(opts = {}) {
  if (typeof window === "undefined") return false;

  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0));
    void applyRhizohWorldMapToolV0("city_map", {
      leafletOnly: true,
      source: opts.source || "SPIRAL_COUNTDOWN_HANDOFF"
    });
    handleProductShellSelectV0("greenroom", {
      source: opts.source || "spiral_countdown_handoff",
      inPlace: true
    });
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
    return true;
  } catch {
    return false;
  }
}

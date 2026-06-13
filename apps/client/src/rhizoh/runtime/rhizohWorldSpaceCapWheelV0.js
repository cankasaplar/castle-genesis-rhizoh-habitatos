/**
 * World · Space capability wheel — direct map actions (no voice seed flood).
 */

import { dispatchLocalCommandHandlerV0 } from "./rhizohLocalCommandHandlersV0.js";
import {
  applyRhizohWorldMapToolV0,
  cycleRhizohWorldSpaceLeafletMapToolV0,
  readRhizohWorldMapToolV0
} from "./rhizohWorldMapToolV0.js";

/**
 * @param {{ id?: string, seedIntent?: string } | null | undefined} node
 */
export function handleWorldSpaceCapWheelNodeV0(node) {
  const id = String(node?.id || "").trim();
  if (!id) return;

  if (id === "zoom_in") {
    dispatchLocalCommandHandlerV0("map_zoom_in", { traceId: `world-wheel-${Date.now()}` });
    return;
  }
  if (id === "zoom_out") {
    dispatchLocalCommandHandlerV0("map_zoom_out", { traceId: `world-wheel-${Date.now()}` });
    return;
  }
  if (id === "view_3d") {
    const tool = readRhizohWorldMapToolV0();
    const next = tool === "city_map" ? "streets" : "city_map";
    void applyRhizohWorldMapToolV0(next, { leafletOnly: true, source: "WORLD_SPACE_CAP_WHEEL" });
    return;
  }
  if (id === "layers") {
    void applyRhizohWorldMapToolV0(cycleRhizohWorldSpaceLeafletMapToolV0(), {
      leafletOnly: true,
      source: "WORLD_SPACE_CAP_WHEEL"
    });
    return;
  }
  if (id === "fog") {
    dispatchLocalCommandHandlerV0("map_zoom_out", { traceId: `world-wheel-${Date.now()}` });
    return;
  }
  if (id === "archive") {
    try {
      window.dispatchEvent(
        new CustomEvent("RHIZOH_OPEN_LIBRARY", {
          detail: Object.freeze({
            node: Object.freeze({
              id: "library",
              label: "LIBRARY",
              name: "Codex Vault",
              type: "vault",
              color: "#f59e0b"
            }),
            source: "cap_wheel"
          })
        })
      );
    } catch {
      /* noop */
    }
  }
}

/**
 * World · Space capability wheel — direct map actions (no voice seed flood).
 */

import { routeCesiumCommandV0 } from "../../castleFlight/cesiumCommandRouterV0.js";
import { setRealityMode } from "../../reality/realityDirector.js";
import { dispatchLocalCommandHandlerV0 } from "./rhizohLocalCommandHandlersV0.js";
import {
  applyRhizohWorldMapToolV0,
  cycleRhizohWorldMapToolV0,
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
    void applyRhizohWorldMapToolV0(next, { setRealityMode, source: "WORLD_SPACE_CAP_WHEEL" });
    return;
  }
  if (id === "layers") {
    void applyRhizohWorldMapToolV0(cycleRhizohWorldMapToolV0(), {
      setRealityMode,
      source: "WORLD_SPACE_CAP_WHEEL"
    });
    return;
  }
  if (id === "fog") {
    routeCesiumCommandV0({
      op: "bootstrap_viewport",
      source: "world_space_cap_wheel",
      meta: Object.freeze({ ingress: "RhizohWorldSpaceCapWheelV0", node: id })
    });
    return;
  }
  if (id === "archive") {
    console.info("[world:space] archive map — research-only (not wired in preview)");
  }
}

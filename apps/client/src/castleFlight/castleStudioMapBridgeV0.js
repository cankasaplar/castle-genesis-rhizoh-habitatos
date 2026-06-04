/**
 * Map → Studio bridge: anchors become observable binding events (timeline/log only).
 */

import { emitProductBindingActionV0 } from "../rhizoh/runtime/rhizohProductBindingV0.js";
import { CASTLE_WORLD_ANCHOR_EVENT_V0 } from "./castleWorldAnchorV0.js";
import { getCastleWorldDataStateV2 } from "./castleWorldDataProviderV2.js";

let installed = false;

/**
 * @returns {() => void}
 */
export function installCastleStudioMapBridgeV0() {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  const onAnchor = (ev) => {
    const anchor = ev?.detail;
    if (!anchor) return;
    const wd = getCastleWorldDataStateV2();
    try {
      emitProductBindingActionV0({
        source: "world_map",
        mode: "anchor",
        action: "ANCHOR_CREATED",
        payload: Object.freeze({
          surface: "world",
          anchorId: anchor.id,
          lat: anchor.lat,
          lon: anchor.lon,
          label: anchor.label,
          worldFeed: wd.feed,
          worldRepresentation: wd.representation
        })
      });
    } catch {
      /* noop */
    }
    if (typeof console !== "undefined" && console.info) {
      console.info("[CASTLE_STUDIO_MAP_BRIDGE]", {
        anchorId: anchor.id,
        feed: wd.feed,
        representation: wd.representation
      });
    }
  };

  window.addEventListener(CASTLE_WORLD_ANCHOR_EVENT_V0, onAnchor);
  return () => {
    installed = false;
    window.removeEventListener(CASTLE_WORLD_ANCHOR_EVENT_V0, onAnchor);
  };
}

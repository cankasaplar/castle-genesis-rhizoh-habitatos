/**
 * World map marker layer visibility — HUD filter toggles (non-destructive hide).
 */

const STORAGE_KEY_V0 = "rhizoh.world.map_marker_layers.v0";
export const WORLD_MAP_MARKER_LAYER_EVENT_V0 = "rhizoh:world-map-marker-layers-v0";

export const WORLD_MAP_MARKER_LAYERS_V0 = Object.freeze([
  "systemAnchors",
  "ecosystemNodes",
  "userCastle",
  "ghostCastles",
  "coPresence",
  "epistemicPoi"
]);

const DEFAULT_STATE_V0 = Object.freeze({
  systemAnchors: true,
  ecosystemNodes: true,
  userCastle: true,
  ghostCastles: true,
  coPresence: true,
  epistemicPoi: true
});

/**
 * @returns {typeof DEFAULT_STATE_V0}
 */
export function readWorldMapMarkerLayerStateV0() {
  if (typeof localStorage === "undefined") return DEFAULT_STATE_V0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.freeze({
      systemAnchors: parsed.systemAnchors !== false,
      ecosystemNodes: parsed.ecosystemNodes !== false,
      userCastle: parsed.userCastle !== false,
      ghostCastles: parsed.ghostCastles !== false,
      coPresence: parsed.coPresence !== false,
      epistemicPoi: parsed.epistemicPoi !== false
    });
  } catch {
    return DEFAULT_STATE_V0;
  }
}

/**
 * @param {Partial<typeof DEFAULT_STATE_V0>} patch
 */
export function writeWorldMapMarkerLayerStateV0(patch) {
  const prev = readWorldMapMarkerLayerStateV0();
  const next = Object.freeze({ ...prev, ...patch });
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORLD_MAP_MARKER_LAYER_EVENT_V0, {
        detail: Object.freeze({ state: next })
      })
    );
  }
  return next;
}

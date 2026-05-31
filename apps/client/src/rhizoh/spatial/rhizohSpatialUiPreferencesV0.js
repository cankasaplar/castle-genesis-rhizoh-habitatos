/**
 * Spatial shell UI preferences — localStorage, immersion-first defaults (copy off).
 */

export const RHIZOH_SPATIAL_UI_PREFS_SCHEMA_V0 = "castle.rhizoh.spatial_ui_prefs.v0";
const STORAGE_KEY_V0 = "rhizoh_spatial_ui_prefs_v0.2";

/** @typedef {{
 *   copyPanelOpen: boolean,
 *   soundEnabled: boolean,
 *   flightHudOpen: boolean,
 *   gatewayDetailOpen: boolean,
 *   conversationDockOpen: boolean,
 *   offlineMap: boolean,
 *   sections: {
 *     hero: boolean,
 *     ftue: boolean,
 *     actionClosure: boolean,
 *     continuity: boolean,
 *     worldState: boolean,
 *     actions: boolean,
 *     technicalMeta: boolean
 *   }
 * }} RhizohSpatialUiPrefsV0 */

/** @returns {RhizohSpatialUiPrefsV0} */
export function defaultRhizohSpatialUiPrefsV0() {
  return {
    copyPanelOpen: false,
    haloOpen: true,
    soundEnabled: false,
    flightHudOpen: false,
    gatewayDetailOpen: false,
    conversationDockOpen: true,
    offlineMap: false,
    sections: {
      hero: false,
      ftue: false,
      actionClosure: true,
      continuity: false,
      worldState: false,
      actions: true,
      technicalMeta: false
    }
  };
}

/**
 * @param {Partial<RhizohSpatialUiPrefsV0>} patch
 * @returns {RhizohSpatialUiPrefsV0}
 */
export function mergeRhizohSpatialUiPrefsV0(patch) {
  const base = defaultRhizohSpatialUiPrefsV0();
  if (!patch || typeof patch !== "object") return base;
  return {
    ...base,
    ...patch,
    sections: {
      ...base.sections,
      ...(patch.sections && typeof patch.sections === "object" ? patch.sections : {})
    }
  };
}

/** @returns {RhizohSpatialUiPrefsV0} */
export function readRhizohSpatialUiPrefsV0() {
  if (typeof localStorage === "undefined") return defaultRhizohSpatialUiPrefsV0();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return defaultRhizohSpatialUiPrefsV0();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultRhizohSpatialUiPrefsV0();
    return mergeRhizohSpatialUiPrefsV0(parsed);
  } catch {
    return defaultRhizohSpatialUiPrefsV0();
  }
}

/** @param {RhizohSpatialUiPrefsV0} prefs */
export function writeRhizohSpatialUiPrefsV0(prefs) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY_V0,
      JSON.stringify({
        schema: RHIZOH_SPATIAL_UI_PREFS_SCHEMA_V0,
        ...mergeRhizohSpatialUiPrefsV0(prefs)
      })
    );
  } catch {
    /* noop */
  }
}

/** @param {RhizohSpatialUiPrefsV0["sections"]} sections */
export function spatialSectionsToCopyVisibilityV0(sections) {
  const s = sections || defaultRhizohSpatialUiPrefsV0().sections;
  return {
    hero: !!s.hero,
    ftue: !!s.ftue,
    actionClosure: !!s.actionClosure,
    continuity: !!s.continuity,
    worldState: !!s.worldState,
    actions: !!s.actions,
    technicalMeta: !!s.technicalMeta
  };
}

/** @param {string} gatewayPhase @param {{ offlineMap?: boolean, dev?: boolean, worldLayerEnabled?: boolean }} [opts] */
export function resolveSpatialMapSurfaceActiveV0(gatewayPhase, opts = {}) {
  if (opts.worldLayerEnabled === false) return false;
  // World layer on → Cesium mounts (OSM imagery). Gateway gates live mesh / LLM, not the globe.
  return true;
}

/** Test helper */
export function clearRhizohSpatialUiPrefsForTestV0() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_V0);
  } catch {
    /* noop */
  }
}

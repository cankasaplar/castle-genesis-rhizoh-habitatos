/**
 * Map / camera real binding hooks — Cesium + device camera (App consumes bindings).
 */

export const RHIZOH_LOCAL_COMMAND_BINDING_SCHEMA_V0 = "castle.local_command_app_binding.v0";

/**
 * @param {{ canonical: string, action: string, layer: string }} payload
 */
export function applyLocalCommandAppBindingV0(payload) {
  const canonical = String(payload.canonical || "");
  const action = String(payload.action || "");
  const layer = String(payload.layer || "");
  const binding = Object.freeze({
    schema: RHIZOH_LOCAL_COMMAND_BINDING_SCHEMA_V0,
    canonical,
    action,
    layer,
    target: resolveBindingTargetV0(canonical, layer),
    cesium: resolveCesiumBindingV0(canonical, action),
    camera: resolveCameraBindingV0(canonical, action),
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.pendingLocalCommandBinding = binding;
    window.__CASTLE_PENDING_LOCAL_BINDING__ = binding;
    window.dispatchEvent(
      new CustomEvent("rhizoh:local-command-binding", { detail: binding })
    );
  }
  return binding;
}

/**
 * @param {string} canonical
 * @param {string} layer
 */
function resolveBindingTargetV0(canonical, layer) {
  if (layer === "map" || layer === "world") return "cesium";
  if (layer === "camera") return "camera";
  if (layer === "media") return "media";
  if (layer === "audio") return "tts";
  return "system";
}

/**
 * @param {string} canonical
 * @param {string} action
 */
function resolveCesiumBindingV0(canonical, action) {
  const mapActions = new Set([
    "open",
    "close",
    "zoom_in",
    "zoom_out",
    "center",
    "follow",
    "show_locations",
    "toggle_layers",
    "enter_castle",
    "exit_castle",
    "room_library",
    "room_garden",
    "room_lab",
    "ghosts_show",
    "ghosts_hide",
    "freeze",
    "resume_world",
    "world_state",
    "log_spatial"
  ]);
  if (!mapActions.has(action) && !canonical.startsWith("map_") && !canonical.startsWith("castle_")) {
    return null;
  }
  return Object.freeze({
    engine: "cesium",
    op: action || canonical.replace(/^map_/, ""),
    canonical
  });
}

/**
 * @param {string} canonical
 * @param {string} action
 */
function resolveCameraBindingV0(canonical, action) {
  if (
    !canonical.startsWith("camera_") &&
    !canonical.startsWith("vision_") &&
    canonical !== "ghost_vision_mode"
  ) {
    return null;
  }
  return Object.freeze({
    engine: "browser_media",
    op: action,
    canonical
  });
}

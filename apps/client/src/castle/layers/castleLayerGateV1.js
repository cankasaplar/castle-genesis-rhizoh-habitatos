import {
  CASTLE_LAYER_REGISTRY_V1,
  CASTLE_LAYER_REGISTRY_SCHEMA_V1,
  T0_SHELL_SLOT_IDS_V1
} from "./castleLayerRegistryV1.js";
import { isRhizohT0FirstMatchIdentityV0 } from "../../rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js";

const FIRST_MATCH_BLOCKED_LAYER_IDS_V1 = new Set([
  "debug_overlay_panels",
  "t0_slot_layer_toggle",
  "t0_capability_wheel",
  "gateway_banner_panel",
  "first_interaction_chips",
  "trust_strip_expanded"
]);

/**
 * @param {string} layerId
 * @param {{ advancedOpen?: boolean, ignoreEnvGate?: boolean, firstMatchIdentity?: boolean }} [ctx]
 */
export function isCastleLayerRenderableV1(layerId, ctx = {}) {
  const layer = CASTLE_LAYER_REGISTRY_V1[String(layerId || "")];
  if (!layer) return false;

  const firstMatch =
    ctx.firstMatchIdentity === true ||
    (ctx.firstMatchIdentity !== false && isRhizohT0FirstMatchIdentityV0());
  if (firstMatch && FIRST_MATCH_BLOCKED_LAYER_IDS_V1.has(String(layerId))) {
    return false;
  }

  if (layer.envGate && !ctx.ignoreEnvGate && typeof import.meta !== "undefined") {
    const [key, val] = String(layer.envGate).split("=");
    const actual = String(import.meta.env?.[key] ?? "").trim();
    const want = String(val ?? "").trim();
    if (want && actual !== want && actual !== "1" && actual !== "true") {
      return false;
    }
  }

  if (layer.status === "active") {
    if (layer.render) return true;
    if (layer.renderInAdvanced && ctx.advancedOpen) return true;
    return false;
  }

  if (layer.status === "deprecated") {
    if (layer.render) return true;
    if (layer.renderInAdvanced && ctx.advancedOpen) return true;
    return false;
  }

  return layer.render === true;
}

/** @returns {string[]} */
export function getT0ShellSlotIdsV1() {
  return T0_SHELL_SLOT_IDS_V1.filter((id) => isCastleLayerRenderableV1(id));
}

/**
 * Dev / Metehan observability — registry vs UI flags (no execution authority).
 * @param {{ advancedOpen?: boolean, mounted?: Record<string, boolean> }} snapshot
 */
export function publishCastleLayerAuditV1(snapshot = {}) {
  const rows = Object.entries(CASTLE_LAYER_REGISTRY_V1).map(([id, layer]) => {
    const shouldRender = isCastleLayerRenderableV1(id, { advancedOpen: snapshot.advancedOpen });
    const mounted = snapshot.mounted?.[id];
    return Object.freeze({
      id,
      status: layer.status,
      shouldRender,
      mounted: mounted === true,
      mismatch: mounted === true && !shouldRender,
      replacedBy: layer.replacedBy ?? null
    });
  });
  const payload = Object.freeze({
    schema: CASTLE_LAYER_REGISTRY_SCHEMA_V1,
    atMs: Date.now(),
    advancedOpen: !!snapshot.advancedOpen,
    mismatches: rows.filter((r) => r.mismatch).map((r) => r.id),
    rows
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_LAYER_AUDIT__ = payload;
  }
  return payload;
}

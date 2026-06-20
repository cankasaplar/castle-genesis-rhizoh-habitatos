/**
 * Fly map camera to any inbox pin — peer, sim, tower, sovereign node.
 * RESEARCH-ONLY · perception only.
 */

import { dispatchWorldSpaceMapFlyV0 } from "./worldSpaceMapCommandFacadeV0.js";
import { readWorldSpaceSessionMapPinRowsV0 } from "./rhizohMapPinOwnerV0.js";
import { buildShadowPeerCastleSimNodeV0 } from "./shadowDataPlaneLoopV0.js";
import { listShadowRemoteCastlesV0, remoteCastlePinIdV0, resolveShadowReactionTargetV0 } from "./shadowCastlePeerRegistryV0.js";
import { findSovereignMapNodeByIdForViewV0 } from "./sovereignWorldMapNodesV0.js";

/**
 * @param {string} pinId
 */
export function resolveMapPinGeoByIdV0(pinId) {
  const id = String(pinId || "").trim();
  if (!id) return null;

  const sovereignNode = findSovereignMapNodeByIdForViewV0(id);
  if (sovereignNode && Number.isFinite(Number(sovereignNode.lat)) && Number.isFinite(Number(sovereignNode.lon))) {
    return Object.freeze({
      lat: Number(sovereignNode.lat),
      lon: Number(sovereignNode.lon),
      pinId: id,
      nodeType: String(sovereignNode.type || ""),
      label: sovereignNode.name || sovereignNode.label || id,
      source: "sovereign_node_lookup"
    });
  }

  const rows = readWorldSpaceSessionMapPinRowsV0({ applySpiralFilter: false });
  const sovereign = rows.find((p) => String(p.id) === id);
  if (sovereign && Number.isFinite(Number(sovereign.lat)) && Number.isFinite(Number(sovereign.lon))) {
    return Object.freeze({
      lat: Number(sovereign.lat),
      lon: Number(sovereign.lon),
      pinId: id,
      nodeType: String(sovereign.type || sovereign.pinType || ""),
      label: sovereign.name || sovereign.label || id,
      source: "sovereign_map_pin"
    });
  }

  const sim = buildShadowPeerCastleSimNodeV0();
  if (sim && sim.id === id) {
    return Object.freeze({
      lat: Number(sim.lat),
      lon: Number(sim.lon),
      pinId: id,
      nodeType: "remote_castle",
      label: sim.name || sim.label,
      source: "shadow_sim_pin"
    });
  }

  for (const remote of listShadowRemoteCastlesV0()) {
    const remotePinId = remoteCastlePinIdV0(remote.id);
    if (remotePinId === id && Number.isFinite(Number(remote.lat)) && Number.isFinite(Number(remote.lon))) {
      return Object.freeze({
        lat: Number(remote.lat),
        lon: Number(remote.lon),
        pinId: id,
        nodeType: "remote_castle",
        label: remote.displayName || remotePinId,
        source: "remote_castle_registry"
      });
    }
  }

  const shadowTarget = resolveShadowReactionTargetV0({ toCastleId: id });
  if (shadowTarget?.pinId === id && Number.isFinite(shadowTarget.lat) && Number.isFinite(shadowTarget.lon)) {
    return Object.freeze({
      lat: Number(shadowTarget.lat),
      lon: Number(shadowTarget.lon),
      pinId: id,
      nodeType: shadowTarget.isSim ? "remote_castle" : "remote_castle",
      label: shadowTarget.displayName || id,
      source: "shadow_reaction_target"
    });
  }

  return null;
}

/**
 * @param {object} item — inbox row
 * @param {{ zoom?: number }} [opts]
 */
export function flyToInboxItemPinV0(item, opts = {}) {
  const zoom = Number(opts.zoom) || 14;
  const pinId = String(item?.pinId || "").trim();

  if (Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lon))) {
    dispatchWorldSpaceMapFlyV0({
      lat: Number(item.lat),
      lon: Number(item.lon),
      zoom,
      source: "shadow_inbox_item_geo"
    });
    return Object.freeze({
      ok: true,
      pinId: pinId || null,
      lat: Number(item.lat),
      lon: Number(item.lon),
      source: "inbox_item_geo"
    });
  }

  const resolved = pinId ? resolveMapPinGeoByIdV0(pinId) : null;
  if (resolved) {
    dispatchWorldSpaceMapFlyV0({
      lat: resolved.lat,
      lon: resolved.lon,
      zoom,
      source: "shadow_inbox_pin_lookup"
    });
    return Object.freeze({ ok: true, ...resolved });
  }

  const fallback = resolveShadowReactionTargetV0();
  if (Number.isFinite(fallback.lat) && Number.isFinite(fallback.lon)) {
    dispatchWorldSpaceMapFlyV0({
      lat: fallback.lat,
      lon: fallback.lon,
      zoom,
      source: "shadow_inbox_fallback_target"
    });
    return Object.freeze({
      ok: true,
      pinId: fallback.pinId,
      lat: fallback.lat,
      lon: fallback.lon,
      source: "shadow_fallback_target"
    });
  }

  return Object.freeze({ ok: false, reason: "pin_geo_unresolved" });
}

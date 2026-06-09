/**
 * World map camera bootstrap — Serencebey seed → user geo → castle anchors (not Sarıyer calib / Fatih default).
 */

import { listCastleWorldAnchorsV0 } from "../../castleFlight/castleWorldAnchorV0.js";
import { ISTANBUL_POI } from "../../castleFlight/geo.js";
import { getOriginSeedAnchorV0 } from "./memoryAnchorSystemV0.js";

/**
 * @returns {{ lat: number, lon: number, label?: string, source: string } | null}
 */
export function readCastleNexusGeoV0() {
  if (typeof window === "undefined") return null;
  const geo = window.__CASTLE_NEXUS_GEO__;
  if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lon)) {
    return Object.freeze({
      lat: Number(geo.lat),
      lon: Number(geo.lon),
      label: "Konumun",
      source: String(geo.source || "nexus_geo")
    });
  }
  return null;
}

/**
 * @returns {{ lat: number, lon: number, label?: string, source: string } | null}
 */
export function readUserCastleAnchorGeoV0() {
  const list = listCastleWorldAnchorsV0();
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const row = list[i];
    if (Number.isFinite(row?.lat) && Number.isFinite(row?.lon)) {
      return Object.freeze({
        lat: Number(row.lat),
        lon: Number(row.lon),
        label: String(row.label || "Kale"),
        source: `castle_anchor:${row.source || "pick"}`
      });
    }
  }
  return null;
}

/**
 * Primary map bootstrap geo — user/device first, then Serencebey seed.
 * @returns {{ lat: number, lon: number, label: string, source: string }}
 */
export function resolveWorldMapBootstrapGeoV0() {
  const nexus = readCastleNexusGeoV0();
  if (nexus) {
    return Object.freeze({
      lat: nexus.lat,
      lon: nexus.lon,
      label: nexus.label || "Konumun",
      source: nexus.source
    });
  }

  const castle = readUserCastleAnchorGeoV0();
  if (castle) {
    return Object.freeze({
      lat: castle.lat,
      lon: castle.lon,
      label: castle.label || "Kale",
      source: castle.source
    });
  }

  const seed = getOriginSeedAnchorV0();
  if (seed?.location && Number.isFinite(seed.location.lat) && Number.isFinite(seed.location.lon)) {
    return Object.freeze({
      lat: Number(seed.location.lat),
      lon: Number(seed.location.lon),
      label: String(seed.label || "Serencebey Castle"),
      source: "origin_seed_serencebey"
    });
  }

  return Object.freeze({
    lat: ISTANBUL_POI.BESIKTAS.lat,
    lon: ISTANBUL_POI.BESIKTAS.lon,
    label: ISTANBUL_POI.BESIKTAS.label,
    source: "besiktas_fallback"
  });
}

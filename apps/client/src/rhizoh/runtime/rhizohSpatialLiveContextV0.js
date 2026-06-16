/**
 * Spatial live context — verified nearby POI + anti-hallucination directive for voice/LLM.
 * Mirrors rhizohSportsLiveContextV0 pattern; does not invent places when feed is empty.
 */

import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";
import {
  getCastleWorldDataStateV2,
  peekCastleWorldPoiRowsV2
} from "../../castleFlight/castleWorldDataProviderV2.js";
import { readUserConsentedGeoForLocalFeedsV0 } from "./rhizohUserGeoConsentV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { isDataPlaneActiveV0 } from "../ingress/phase1ActivationGateV0.js";

export const RHIZOH_SPATIAL_LIVE_CONTEXT_SCHEMA_V0 = "castle.rhizoh.spatial_live_context.v0";

const SPATIAL_LEXICON_RE_V0 =
  /\b(etraf\w*|yakın\w*|yakinda\w*|nearby|around\s*me|neredeyim|where\s*am\s*i|cevre\w*|çevre\w*|anlat\w*|describe\s*(the\s*)?(area|surroundings)|what\s*is\s*around)\b/i;

/**
 * @param {string} raw
 */
export function probeSpatialBriefingQueryV0(raw) {
  const n = foldCanonicalSurfaceV1(String(raw || "").trim());
  if (!n) {
    return Object.freeze({ active: false, reason: "empty" });
  }
  if (!SPATIAL_LEXICON_RE_V0.test(n)) {
    return Object.freeze({ active: false, reason: "none" });
  }
  return Object.freeze({ active: true, reason: "spatial_lexicon" });
}

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 */
export function haversineMetersV0(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * @param {{ lat: number, lon: number }} geo
 * @param {number} [radiusM]
 */
export function readNearbyVerifiedPoiLinesV0(geo, radiusM = 450) {
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) {
    return Object.freeze({ lines: [], poiCount: 0, feed: "none" });
  }
  const state = getCastleWorldDataStateV2();
  const rows = peekCastleWorldPoiRowsV2();
  const nearby = rows
    .filter((r) => Number.isFinite(r?.lat) && Number.isFinite(r?.lon))
    .map((r) => ({
      ...r,
      distM: haversineMetersV0(geo.lat, geo.lon, Number(r.lat), Number(r.lon))
    }))
    .filter((r) => r.distM <= radiusM)
    .sort((a, b) => a.distM - b.distM)
    .slice(0, 8);

  const lines = nearby.map((r) => {
    const name = String(r.name || r.tags?.name || "Unnamed").trim();
    const dist = Math.round(r.distM);
    return `${name} (~${dist}m)`;
  });

  return Object.freeze({
    lines: Object.freeze(lines),
    poiCount: nearby.length,
    feed: String(state?.feed || "unknown"),
    representation: String(state?.representation || "unknown")
  });
}

/**
 * @param {string} message
 * @param {{ locale?: string }} [opts]
 */
export function buildSpatialLiveContextBoostV0(message, opts = {}) {
  const probe = probeSpatialBriefingQueryV0(message);
  if (!probe.active) return null;

  const tr = String(opts.locale || "tr").toLowerCase().startsWith("tr");
  const geo =
    readUserConsentedGeoForLocalFeedsV0() ||
    resolveWorldMapBootstrapGeoV0() ||
    null;
  const label = String(geo?.label || "Konumun").trim();
  const poi = readNearbyVerifiedPoiLinesV0(geo);
  const dataPlaneOff = !isDataPlaneActiveV0();

  const dataPlaneClause = dataPlaneOff
    ? tr
      ? "Veri düzlemi kapalı — canlı dünya ingest yetkisi yok."
      : "Data-plane inactive — no live world-ingest authority."
    : "";

  const promptDirective = tr
    ? [
        "Yakın çevre sorularında yanıtı YALNIZCA VERIFIED_NEARBY_POI satırlarından türet.",
        "Park, heykel, sokak, mahalle veya ilçe adı UYDURMA.",
        "Doğrulanmış POI yoksa yalnızca konum etiketini söyle ve dürüstçe bilmediğini belirt.",
        dataPlaneClause
      ]
        .filter(Boolean)
        .join(" ")
    : [
        "For nearby-area questions, ground answers ONLY in VERIFIED_NEARBY_POI lines.",
        "Do not invent parks, statues, streets, districts, or venues.",
        "If no verified POIs, state only the location label and admit uncertainty honestly.",
        dataPlaneClause
      ]
        .filter(Boolean)
        .join(" ");

  const emptyLabel = tr
    ? `Doğrulanmış yakın yer verisi yok. Sadece konum etiketi: ${label}. Park, heykel veya sokak adı söyleme.`
    : `No verified nearby places. Location label only: ${label}. Do not name parks, statues, or streets.`;

  return Object.freeze({
    schema: RHIZOH_SPATIAL_LIVE_CONTEXT_SCHEMA_V0,
    active: true,
    reason: probe.reason,
    locationLabel: label,
    geo: geo
      ? Object.freeze({
          lat: geo.lat,
          lon: geo.lon,
          source: String(geo.source || "unknown")
        })
      : null,
    dataPlaneActive: !dataPlaneOff,
    poiFeed: poi.feed,
    poiRepresentation: poi.representation,
    lines: poi.lines,
    promptDirective,
    emptyLabel
  });
}

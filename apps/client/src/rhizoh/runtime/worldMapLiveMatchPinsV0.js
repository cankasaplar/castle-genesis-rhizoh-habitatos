/**
 * Live match map pins — ephemeral nodes from gateway sports feed.
 * RESEARCH-ONLY venue coords until API-Sports venue lat/lon is normalized.
 */

import {
  formatSportMatchChipV0,
  getWorldMapLiveFeedSnapshotV0,
  refreshWorldMapLiveFeedIfStaleV0
} from "./worldMapLiveFeedV0.js";

export const RHIZOH_LIVE_MATCH_PINS_EVENT_V0 = "rhizoh:live-match-pins-v0";

/** @type {ReadonlyArray<object>} */
let _activePins = Object.freeze([]);

/** Approximate home-city / venue anchors for live pin placement. */
const VENUE_ANCHORS_V0 = Object.freeze([
  { keys: ["galatasaray", "rams park", "nef"], lat: 41.103, lon: 28.991, city: "Istanbul" },
  { keys: ["fenerbah", "ükrü şükrü", "sukru"], lat: 40.987, lon: 29.037, city: "Istanbul" },
  { keys: ["beşiktaş", "besiktas", "vodafone park"], lat: 41.039, lon: 29.005, city: "Istanbul" },
  { keys: ["lakers", "crypto.com", "staples"], lat: 34.043, lon: -118.267, city: "Los Angeles" },
  { keys: ["celtics", "td garden"], lat: 42.366, lon: -71.062, city: "Boston" },
  { keys: ["warriors", "chase center"], lat: 37.768, lon: -122.388, city: "San Francisco" },
  { keys: ["knicks", "madison square"], lat: 40.75, lon: -73.993, city: "New York" },
  { keys: ["real madrid", "bernabéu", "bernabeu"], lat: 40.453, lon: -3.688, city: "Madrid" },
  { keys: ["barcelona", "camp nou", "spotify"], lat: 41.381, lon: 2.122, city: "Barcelona" },
  { keys: ["manchester united", "old trafford"], lat: 53.463, lon: -2.291, city: "Manchester" },
  { keys: ["liverpool", "anfield"], lat: 53.431, lon: -2.961, city: "Liverpool" },
  { keys: ["arsenal", "emirates"], lat: 51.555, lon: -0.108, city: "London" },
  { keys: ["psg", "paris saint", "parc des princes"], lat: 48.841, lon: 2.253, city: "Paris" },
  { keys: ["bayern", "allianz"], lat: 48.219, lon: 11.625, city: "Munich" },
  { keys: ["inter", "san siro", "giuseppe meazza"], lat: 45.478, lon: 9.124, city: "Milan" },
  { keys: ["juventus", "allianz stadium torino"], lat: 45.109, lon: 7.641, city: "Turin" }
]);

/**
 * @param {string} teamName
 */
export function resolveSportVenueAnchorV0(teamName) {
  const hay = String(teamName || "").toLowerCase();
  for (const row of VENUE_ANCHORS_V0) {
    if (row.keys.some((k) => hay.includes(k))) {
      return Object.freeze({ lat: row.lat, lon: row.lon, city: row.city });
    }
  }
  return null;
}

/**
 * @param {import('./worldMapLiveFeedV0.js').normalizeWorldMapLiveFeedV0 extends (...args: any) => infer R ? R : never} feed
 * @param {string} [locale]
 */
export function buildLiveMatchMapPinsV0(feed, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const live = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];
  /** @type {object[]} */
  const pins = [];
  const seen = new Set();

  for (const match of live) {
    const home = String(match?.homeName || "");
    const away = String(match?.awayName || "");
    const anchor = resolveSportVenueAnchorV0(home) || resolveSportVenueAnchorV0(away);
    if (!anchor) continue;
    const key = `${match.id}:${anchor.lat}:${anchor.lon}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const chip = formatSportMatchChipV0(match, locale);
    const sport = String(match.sport || "");
    const color = sport === "basketball" ? "#f59e0b" : sport === "football" ? "#22c55e" : "#06b6d4";
    pins.push(
      Object.freeze({
        id: `live_match:${match.id}`,
        name: chip,
        label: sport === "basketball" ? "NBA/LIVE" : "MATCH",
        type: "broadcast",
        lat: anchor.lat,
        lon: anchor.lon,
        color,
        owner: anchor.city,
        description: tr ? `Canlı maç pini · ${chip}` : `Live match pin · ${chip}`,
        liveMatch: match
      })
    );
  }
  return Object.freeze(pins);
}

export function getLiveMatchMapPinsV0() {
  return _activePins;
}

/**
 * @param {ReadonlyArray<object>} pins
 */
export function setLiveMatchMapPinsV0(pins) {
  _activePins = Object.freeze([...(pins || [])]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_LIVE_MATCH_PINS_EVENT_V0, {
        detail: Object.freeze({ pins: _activePins, count: _activePins.length })
      })
    );
  }
  return _activePins;
}

/**
 * @param {{ locale?: string, force?: boolean }} [opts]
 */
export async function refreshAndPublishLiveMatchPinsV0(opts = {}) {
  const feed =
    (await refreshWorldMapLiveFeedIfStaleV0({ force: opts.force, locale: opts.locale })) ||
    getWorldMapLiveFeedSnapshotV0();
  const pins = buildLiveMatchMapPinsV0(feed, opts.locale);
  return setLiveMatchMapPinsV0(pins);
}

/**
 * @param {string} text
 * @param {{ locale?: string }} [opts]
 */
export function tryShowLiveMatchPinsFromTextV0(text, opts = {}) {
  const raw = String(text || "").toLowerCase();
  const tr = String(opts.locale || "tr").toLowerCase().startsWith("tr");
  const hit =
    /(canl[ıi]\s+maç|maç\s+pin|live\s+match|nba\s+pin|futbol\s+pin|spor\s+pin|maçları\s+göster|maç pinlerini)/u.test(
      raw
    );
  if (!hit) return null;
  void refreshAndPublishLiveMatchPinsV0({ locale: opts.locale, force: true });
  return Object.freeze({
    ok: true,
    kind: "LIVE_MATCH_PINS",
    reply: tr
      ? "Canlı maç pinleri haritaya çiziliyor — bilinen salon/kent eşleşmeleriyle."
      : "Drawing live match pins on the map — known venue/city anchors."
  });
}

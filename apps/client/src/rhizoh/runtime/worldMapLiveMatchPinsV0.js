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
  { keys: ["juventus", "allianz stadium torino"], lat: 45.109, lon: 7.641, city: "Turin" },
  // NBA / basketball (extended)
  { keys: ["heat", "miami"], lat: 25.781, lon: -80.188, city: "Miami" },
  { keys: ["nuggets", "denver"], lat: 39.748, lon: -105.007, city: "Denver" },
  { keys: ["bucks", "milwaukee"], lat: 43.045, lon: -87.917, city: "Milwaukee" },
  { keys: ["suns", "phoenix"], lat: 33.445, lon: -112.071, city: "Phoenix" },
  { keys: ["mavericks", "dallas"], lat: 32.79, lon: -96.81, city: "Dallas" },
  // International football — national teams / World Cup (capital or primary host city)
  { keys: ["morocco", "maroc"], lat: 33.573, lon: -7.589, city: "Casablanca" },
  { keys: ["haiti", "haïti"], lat: 18.594, lon: -72.307, city: "Port-au-Prince" },
  { keys: ["scotland"], lat: 55.86, lon: -4.251, city: "Glasgow" },
  { keys: ["brazil", "brasil"], lat: -22.906, lon: -43.172, city: "Rio de Janeiro" },
  { keys: ["mexico", "méxico"], lat: 19.432, lon: -99.133, city: "Mexico City" },
  { keys: ["germany", "deutschland"], lat: 52.52, lon: 13.405, city: "Berlin" },
  { keys: ["japan", "nippon"], lat: 35.676, lon: 139.65, city: "Tokyo" },
  { keys: ["netherlands", "holland", "nederland"], lat: 52.367, lon: 4.904, city: "Amsterdam" },
  { keys: ["turkey", "türkiye", "turkiye"], lat: 41.008, lon: 28.978, city: "Istanbul" },
  { keys: ["united states", "usa", "u.s.a"], lat: 38.907, lon: -77.036, city: "Washington DC" },
  { keys: ["south korea", "korea republic", "republic of korea"], lat: 37.566, lon: 126.978, city: "Seoul" },
  { keys: ["ecuador"], lat: -0.18, lon: -78.467, city: "Quito" },
  { keys: ["czechia", "czech republic", "czech"], lat: 50.075, lon: 14.437, city: "Prague" },
  { keys: ["south africa"], lat: -25.747, lon: 28.229, city: "Pretoria" },
  { keys: ["ivory coast", "côte d'ivoire", "cote d'ivoire", "curaçao", "curacao"], lat: 5.36, lon: -4.008, city: "Abidjan" },
  { keys: ["tunisia"], lat: 36.806, lon: 10.181, city: "Tunis" },
  { keys: ["sweden"], lat: 59.329, lon: 18.068, city: "Stockholm" },
  { keys: ["paraguay"], lat: -25.263, lon: -57.575, city: "Asunción" },
  { keys: ["australia"], lat: -35.28, lon: 149.13, city: "Canberra" },
  { keys: ["france"], lat: 48.856, lon: 2.352, city: "Paris" },
  { keys: ["argentina"], lat: -34.603, lon: -58.381, city: "Buenos Aires" },
  { keys: ["england"], lat: 51.556, lon: -0.279, city: "London" },
  { keys: ["spain", "españa", "espana"], lat: 40.416, lon: -3.703, city: "Madrid" },
  { keys: ["portugal"], lat: 38.722, lon: -9.139, city: "Lisbon" },
  { keys: ["belgium"], lat: 50.85, lon: 4.351, city: "Brussels" },
  { keys: ["croatia"], lat: 45.815, lon: 15.981, city: "Zagreb" },
  { keys: ["switzerland"], lat: 46.948, lon: 7.447, city: "Bern" },
  { keys: ["canada"], lat: 45.421, lon: -75.697, city: "Ottawa" },
  { keys: ["uruguay"], lat: -34.901, lon: -56.164, city: "Montevideo" },
  { keys: ["colombia"], lat: 4.711, lon: -74.072, city: "Bogotá" },
  { keys: ["chile"], lat: -33.448, lon: -70.669, city: "Santiago" },
  { keys: ["poland"], lat: 52.229, lon: 21.012, city: "Warsaw" },
  { keys: ["austria"], lat: 48.208, lon: 16.373, city: "Vienna" },
  { keys: ["serbia"], lat: 44.786, lon: 20.448, city: "Belgrade" },
  { keys: ["denmark"], lat: 55.676, lon: 12.568, city: "Copenhagen" },
  { keys: ["norway"], lat: 59.913, lon: 10.752, city: "Oslo" },
  { keys: ["wales"], lat: 51.481, lon: -3.179, city: "Cardiff" },
  { keys: ["ireland"], lat: 53.349, lon: -6.26, city: "Dublin" },
  { keys: ["nigeria"], lat: 9.076, lon: 7.398, city: "Abuja" },
  { keys: ["senegal"], lat: 14.716, lon: -17.467, city: "Dakar" },
  { keys: ["cameroon"], lat: 3.848, lon: 11.502, city: "Yaoundé" },
  { keys: ["ghana"], lat: 5.603, lon: -0.187, city: "Accra" },
  { keys: ["iran"], lat: 35.689, lon: 51.389, city: "Tehran" },
  { keys: ["saudi arabia", "saudi"], lat: 24.713, lon: 46.675, city: "Riyadh" },
  { keys: ["qatar"], lat: 25.285, lon: 51.531, city: "Doha" },
  // Volleyball / FIVB common venues (city-level)
  { keys: ["volleyball", "fivb"], lat: 41.902, lon: 12.496, city: "Rome" }
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
    const color =
      sport === "basketball" ? "#f59e0b" : sport === "volleyball" ? "#a855f7" : sport === "football" ? "#22c55e" : "#06b6d4";
    pins.push(
      Object.freeze({
        id: `live_match:${match.id}`,
        name: chip,
        label:
          sport === "basketball" ? "NBA/LIVE" : sport === "volleyball" ? "VB/LIVE" : sport === "football" ? "FTB/LIVE" : "MATCH",
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

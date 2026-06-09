/**
 * World map news locale — UI language + map geo → NewsData country/language query.
 */

import { readCastleNexusGeoV0, readUserCastleAnchorGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { normalizeUiLocaleV0, readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

/** @type {ReadonlyArray<{ country: string, minLat: number, maxLat: number, minLon: number, maxLon: number }>} */
const GEO_COUNTRY_BOXES_V0 = Object.freeze([
  { country: "tr", minLat: 35.5, maxLat: 42.5, minLon: 25.5, maxLon: 45.5 },
  { country: "fi", minLat: 59.0, maxLat: 70.5, minLon: 19.0, maxLon: 32.0 },
  { country: "fr", minLat: 41.0, maxLat: 51.5, minLon: -5.5, maxLon: 9.5 },
  { country: "es", minLat: 35.5, maxLat: 44.0, minLon: -10.0, maxLon: 4.5 },
  { country: "gb", minLat: 49.5, maxLat: 61.0, minLon: -8.5, maxLon: 2.0 },
  { country: "de", minLat: 47.0, maxLat: 55.5, minLon: 5.0, maxLon: 15.5 },
  { country: "jp", minLat: 30.0, maxLat: 46.0, minLon: 129.0, maxLon: 146.0 },
  { country: "cn", minLat: 18.0, maxLat: 54.0, minLon: 73.0, maxLon: 135.0 },
  { country: "us", minLat: 24.0, maxLat: 50.0, minLon: -125.0, maxLon: -66.0 }
]);

/** @type {Readonly<Record<string, string>>} */
const LOCALE_DEFAULT_COUNTRY_V0 = Object.freeze({
  tr: "tr",
  en: "us",
  fi: "fi",
  fr: "fr",
  es: "es",
  zh: "cn",
  ja: "jp"
});

/** NewsData language codes supported by our launch locales. */
/** @type {Readonly<Record<string, string>>} */
const LOCALE_NEWS_LANGUAGE_V0 = Object.freeze({
  tr: "tr",
  en: "en",
  fi: "fi",
  fr: "fr",
  es: "es",
  zh: "zh",
  ja: "ja"
});

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {string | null}
 */
export function resolveNewsCountryFromGeoV0(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  for (const box of GEO_COUNTRY_BOXES_V0) {
    if (la >= box.minLat && la <= box.maxLat && lo >= box.minLon && lo <= box.maxLon) {
      return box.country;
    }
  }
  return null;
}

/**
 * @param {string} [uiLocale]
 * @returns {string}
 */
export function resolveNewsLanguageFromUiLocaleV0(uiLocale) {
  const locale = normalizeUiLocaleV0(uiLocale);
  return LOCALE_NEWS_LANGUAGE_V0[locale] || "en";
}

/**
 * @param {string} [uiLocale]
 * @returns {string}
 */
export function resolveNewsCountryFromUiLocaleV0(uiLocale) {
  const locale = normalizeUiLocaleV0(uiLocale);
  return LOCALE_DEFAULT_COUNTRY_V0[locale] || "us";
}

/**
 * News country uses only real user signals — never map bootstrap seeds (Serencebey/Istanbul).
 * @returns {{ lat: number, lon: number, source: string } | null}
 */
export function resolveNewsUserGeoV0() {
  const nexus = readCastleNexusGeoV0();
  if (nexus) {
    return Object.freeze({ lat: nexus.lat, lon: nexus.lon, source: nexus.source || "nexus_geo" });
  }
  const castle = readUserCastleAnchorGeoV0();
  if (castle) {
    return Object.freeze({ lat: castle.lat, lon: castle.lon, source: castle.source || "castle_anchor" });
  }
  return null;
}

/**
 * @param {{ locale?: string }} [opts]
 * @returns {{ country: string, language: string, source: string }}
 */
export function resolveWorldMapNewsFeedQueryV0(opts = {}) {
  const locale = opts.locale || readUiLocaleV0();
  const language = resolveNewsLanguageFromUiLocaleV0(locale);
  const userGeo = resolveNewsUserGeoV0();
  if (userGeo) {
    const geoCountry = resolveNewsCountryFromGeoV0(userGeo.lat, userGeo.lon);
    if (geoCountry) {
      return Object.freeze({ country: geoCountry, language, source: "user_geo" });
    }
  }
  return Object.freeze({
    country: resolveNewsCountryFromUiLocaleV0(locale),
    language,
    source: "ui_locale"
  });
}

/**
 * @param {{ country?: string, language?: string }} query
 * @returns {string}
 */
export function buildWorldMapNewsFeedQueryStringV0(query = {}) {
  const country = String(query.country || "").trim().toLowerCase();
  const language = String(query.language || "").trim().toLowerCase();
  const parts = [];
  if (country) parts.push(`country=${encodeURIComponent(country)}`);
  if (language) parts.push(`language=${encodeURIComponent(language)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

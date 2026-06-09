/**
 * Live sports bundle — football-data.org (primary) + optional API-Sports extras.
 */

import {
  normalizeApiSportsBasketballGamesV0,
  normalizeApiSportsFootballFixturesV0,
  normalizeApiSportsFormula1RacesV0,
  partitionSportMatchesV0
} from "./apiSportsNormalizeV0.js";
import {
  fetchFootballDataOrgBundleV0,
  isFootballDataOrgEnabledV0,
  readFootballDataOrgTokenV0
} from "./footballDataIngestV0.js";

const DEFAULT_CACHE_MS = 10 * 60 * 1000;
const LIVE_CACHE_MS = 5 * 60 * 1000;

/** @type {{ at: number, ttl: number, bundle: object } | null} */
let cache = null;

/**
 * @returns {string}
 */
export function readApiSportsKeyV0() {
  return String(process.env.API_SPORTS_KEY || process.env.CASTLE_API_SPORTS_KEY || "").trim();
}

/**
 * @returns {boolean}
 */
export function isLiveSportsBundleEnabledV0() {
  return isFootballDataOrgEnabledV0() || Boolean(readApiSportsKeyV0());
}

/**
 * @param {string} baseUrl
 * @param {string} pathQuery
 * @param {string} key
 */
async function fetchApiSportsV0(baseUrl, pathQuery, key) {
  const url = `${baseUrl.replace(/\/$/, "")}${pathQuery.startsWith("/") ? pathQuery : `/${pathQuery}`}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": key,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw new Error(`api_sports_http_${res.status}`);
  }
  return res.json();
}

/**
 * @param {string} key
 * @param {number} season
 */
export async function buildLiveSportsBundleV0(
  apiSportsKey = readApiSportsKeyV0(),
  season = new Date().getFullYear()
) {
  const footballToken = readFootballDataOrgTokenV0();
  if (!footballToken && !apiSportsKey) {
    return Object.freeze({
      schema: "castle.live.sports.bundle.v0",
      ok: false,
      source: "sports/unconfigured",
      fetchedAt: Date.now(),
      cacheTtlMs: DEFAULT_CACHE_MS,
      live: Object.freeze([]),
      upcoming: Object.freeze([]),
      bySport: Object.freeze({}),
      apiCalls: 0
    });
  }

  const now = Date.now();
  if (cache && now - cache.at < cache.ttl) {
    return cache.bundle;
  }

  let apiCalls = 0;
  /** @type {import("./apiSportsNormalizeV0.js").NormalizedSportMatchV0[]} */
  const all = [];
  const errors = [];
  const sources = [];

  if (footballToken) {
    const fd = await fetchFootballDataOrgBundleV0(footballToken);
    apiCalls += fd.apiCalls;
    all.push(...fd.rows);
    sources.push("football-data.org");
    errors.push(...fd.errors);
  }

  if (apiSportsKey) {
    const apiSportsTasks = [
      {
        sport: "basketball",
        run: async () => {
          const live = await fetchApiSportsV0(
            "https://v1.basketball.api-sports.io",
            "/games?live=all",
            apiSportsKey
          );
          apiCalls += 1;
          all.push(...normalizeApiSportsBasketballGamesV0(live));
          const next = await fetchApiSportsV0(
            "https://v1.basketball.api-sports.io",
            "/games?next=6",
            apiSportsKey
          );
          apiCalls += 1;
          all.push(...normalizeApiSportsBasketballGamesV0(next));
        }
      },
      {
        sport: "formula1",
        run: async () => {
          const races = await fetchApiSportsV0(
            "https://v1.formula-1.api-sports.io",
            `/races?season=${season}&next=4`,
            apiSportsKey
          );
          apiCalls += 1;
          all.push(...normalizeApiSportsFormula1RacesV0(races));
        }
      }
    ];
    if (!footballToken) {
      apiSportsTasks.unshift({
        sport: "football",
        run: async () => {
          const live = await fetchApiSportsV0(
            "https://v3.football.api-sports.io",
            "/fixtures?live=all",
            apiSportsKey
          );
          apiCalls += 1;
          all.push(...normalizeApiSportsFootballFixturesV0(live));
        }
      });
    }
    sources.push("api-sports");
    for (const task of apiSportsTasks) {
      try {
        await task.run();
      } catch (e) {
        errors.push(`${task.sport}:${String(e?.message || e)}`);
      }
    }
  }

  const dedup = new Map();
  for (const row of all) {
    if (!dedup.has(row.id)) dedup.set(row.id, row);
  }
  const unique = [...dedup.values()];
  const parts = partitionSportMatchesV0(unique, { liveLimit: 16, upcomingLimit: 16 });

  /** @type {Record<string, { live: unknown[], upcoming: unknown[] }>} */
  const bySport = {};
  for (const row of unique) {
    if (!bySport[row.sport]) bySport[row.sport] = { live: [], upcoming: [] };
    if (row.phase === "live" && bySport[row.sport].live.length < 8) bySport[row.sport].live.push(row);
    if (row.phase === "scheduled" && bySport[row.sport].upcoming.length < 8) {
      bySport[row.sport].upcoming.push(row);
    }
  }

  const hasLive = parts.live.length > 0;
  const bundle = Object.freeze({
    schema: "castle.live.sports.bundle.v0",
    ok: all.length > 0 || errors.length === 0,
    source: sources.join("+") || "none",
    fetchedAt: now,
    cacheTtlMs: hasLive ? LIVE_CACHE_MS : DEFAULT_CACHE_MS,
    live: parts.live,
    upcoming: parts.upcoming,
    bySport: Object.freeze(
      Object.fromEntries(
        Object.entries(bySport).map(([k, v]) => [k, Object.freeze({ live: Object.freeze(v.live), upcoming: Object.freeze(v.upcoming) })])
      )
    ),
    apiCalls,
    errors: errors.length ? Object.freeze(errors) : undefined
  });

  cache = { at: now, ttl: bundle.cacheTtlMs, bundle };
  return bundle;
}

export function resetLiveSportsBundleCacheForTestsV0() {
  cache = null;
}

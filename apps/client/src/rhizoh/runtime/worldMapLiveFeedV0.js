/**
 * World map live feed — sports (API-Sports via gateway) + news headlines.
 */

import { isWorldExecutionOffV0 } from "./worldExecutionGateV0.js";
import {
  buildWorldMapNewsFeedQueryStringV0,
  resolveWorldMapNewsFeedQueryV0
} from "./worldMapNewsLocaleV0.js";

const DEFAULT_POLL_MS = 5 * 60 * 1000;
const DEFAULT_TTL_MS = 4 * 60 * 1000;

/** @type {object | null} */
let _cached = null;
let _cacheValidUntil = 0;
/** @type {string} */
let _cacheQueryKey = "";
/** @type {Promise<object | null> | null} */
let _inFlight = null;

/**
 * @param {{ country?: string, language?: string }} [query]
 * @returns {string}
 */
export function resolveWorldMapLiveFeedHttpV0(query = {}) {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const explicit = String(env.VITE_LIVE_WORLD_FEED_HTTP || "").trim();
  const qs = buildWorldMapNewsFeedQueryStringV0(query);
  if (explicit) return `${explicit.replace(/\?.*$/, "")}${qs}`;
  const base = String(env.VITE_LIVE_GATEWAY_BASE || "").trim().replace(/\/+$/, "");
  if (base) return `${base}/rhizoh/live/world-feed${qs}`;
  const gh = String(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "").trim();
  if (!gh) return "";
  const root = gh.replace(/\/rhizoh\/llm\/?$/i, "").replace(/\/+$/, "");
  return root ? `${root}/rhizoh/live/world-feed${qs}` : "";
}

/**
 * @param {unknown} payload
 */
export function normalizeWorldMapLiveFeedV0(payload) {
  if (!payload || typeof payload !== "object") return null;
  const body = /** @type {Record<string, unknown>} */ (payload);
  const sports = body.sports && typeof body.sports === "object" ? body.sports : body.bundle?.sports;
  const news = body.news && typeof body.news === "object" ? body.news : body.bundle?.news;
  return Object.freeze({
    schema: "castle.live.world.feed.v0",
    fetchedAt: Number(body.fetchedAt) || Date.now(),
    sports: sports || null,
    news: news || null
  });
}

/** @returns {ReturnType<typeof normalizeWorldMapLiveFeedV0>} */
export function getWorldMapLiveFeedSnapshotV0() {
  return _cached;
}

export function resetWorldMapLiveFeedCacheForTestsV0() {
  _cached = null;
  _cacheValidUntil = 0;
  _cacheQueryKey = "";
  _inFlight = null;
}

/**
 * @param {{ locale?: string }} [opts]
 * @returns {{ country: string, language: string, source: string, key: string }}
 */
export function resolveWorldMapLiveFeedQueryV0(opts = {}) {
  const query = resolveWorldMapNewsFeedQueryV0({ locale: opts.locale });
  return Object.freeze({
    ...query,
    key: `${query.country}:${query.language}`
  });
}

/**
 * @param {{ force?: boolean, signal?: AbortSignal, ttlMs?: number, locale?: string }} [opts]
 */
export async function refreshWorldMapLiveFeedIfStaleV0(opts = {}) {
  if (isWorldExecutionOffV0()) return _cached;
  const feedQuery = resolveWorldMapLiveFeedQueryV0({ locale: opts.locale });
  const url = resolveWorldMapLiveFeedHttpV0(feedQuery);
  if (!url) return _cached;

  const ttl = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : DEFAULT_TTL_MS;
  const now = Date.now();
  if (feedQuery.key !== _cacheQueryKey) {
    _cached = null;
    _cacheValidUntil = 0;
    _cacheQueryKey = feedQuery.key;
  }
  if (!opts.force && now < _cacheValidUntil) return _cached;
  if (_inFlight) return _inFlight;

  _inFlight = (async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: opts.signal,
        headers: { Accept: "application/json" }
      });
      if (!res.ok) return _cached;
      const json = await res.json().catch(() => null);
      const normalized = normalizeWorldMapLiveFeedV0(json);
      if (normalized) {
        _cached = normalized;
        const sportsTtl = Number(normalized.sports?.cacheTtlMs);
        const newsTtl = Number(normalized.news?.cacheTtlMs);
        const backoff = Math.max(ttl, sportsTtl || 0, newsTtl || 0, DEFAULT_TTL_MS);
        _cacheValidUntil = Date.now() + backoff;
      }
      return _cached;
    } catch {
      _cacheValidUntil = Date.now() + 90_000;
      return _cached;
    } finally {
      _inFlight = null;
    }
  })();

  return _inFlight;
}

/**
 * @param {import("./apiSportsNormalizeV0.js").NormalizedSportMatchV0 | Record<string, unknown>} match
 * @param {string} [locale]
 */
export function formatSportMatchChipV0(match, locale = "tr") {
  if (!match) return "";
  const tr = String(locale).toLowerCase().startsWith("tr");
  const sport = String(match.sport || "");
  const icon = sport === "football" ? "⚽" : sport === "basketball" ? "🏀" : sport === "formula1" ? "🏎️" : "🏟️";
  const home = String(match.homeName || "");
  const away = String(match.awayName || "");
  const phase = String(match.phase || "");

  if (sport === "formula1" && phase === "scheduled") {
    return `${icon} ${home} · ${match.startTimeIso ? new Date(String(match.startTimeIso)).toLocaleDateString(tr ? "tr-TR" : "en-GB") : tr ? "yakında" : "soon"}`;
  }

  const hs = Number.isFinite(match.homeScore) ? match.homeScore : "-";
  const as = Number.isFinite(match.awayScore) ? match.awayScore : "-";
  const min =
    Number.isFinite(match.minute) && match.minute > 0
      ? ` (${match.minute}')`
      : phase === "live"
        ? tr
          ? " (canlı)"
          : " (live)"
        : "";
  return `${icon} ${home} ${hs}-${as} ${away}${min}`;
}

/**
 * @param {ReturnType<typeof normalizeWorldMapLiveFeedV0>} feed
 * @param {string} [locale]
 */
export function buildWorldMapSportsLinesV0(feed, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const sports = feed?.sports;
  const live = Array.isArray(sports?.live) ? sports.live : [];
  const upcoming = Array.isArray(sports?.upcoming) ? sports.upcoming : [];
  const sportChips = [...live, ...upcoming].slice(0, 8).map((m) => formatSportMatchChipV0(m, locale));

  return Object.freeze({
    sportChips,
    hasSports: sportChips.length > 0,
    sportsSource: String(sports?.source || "none"),
    emptySportsLabel: tr ? "Spor verisi yükleniyor…" : "Loading sports…"
  });
}

/**
 * @param {ReturnType<typeof normalizeWorldMapLiveFeedV0>} feed
 * @param {string} [locale]
 */
export function buildWorldMapNewsLinesV0(feed, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const news = feed?.news;
  const headlines = Array.isArray(news?.headlines) ? news.headlines : [];
  const newsLine = headlines
    .slice(0, 6)
    .map((h) => String(h?.title || "").trim())
    .filter(Boolean)
    .join(" · ");

  return Object.freeze({
    newsLine,
    hasNews: Boolean(newsLine),
    newsProvider: String(news?.provider || "none"),
    emptyNewsLabel: tr ? "Haber akışı yükleniyor…" : "Loading headlines…"
  });
}

/**
 * @param {ReturnType<typeof normalizeWorldMapLiveFeedV0>} feed
 * @param {string} [locale]
 */
export function buildWorldMapSportsNewsLinesV0(feed, locale = "tr") {
  const sports = buildWorldMapSportsLinesV0(feed, locale);
  const news = buildWorldMapNewsLinesV0(feed, locale);

  return Object.freeze({
    sportChips: sports.sportChips,
    newsLine: news.newsLine,
    hasSports: sports.hasSports,
    hasNews: news.hasNews,
    sportsSource: sports.sportsSource,
    newsProvider: news.newsProvider,
    emptySportsLabel: sports.emptySportsLabel,
    emptyNewsLabel: news.emptyNewsLabel
  });
}

/**
 * @param {{ locale?: string, intervalMs?: number, onUpdate?: (snap: ReturnType<typeof normalizeWorldMapLiveFeedV0>) => void, signal?: AbortSignal }} [opts]
 * @returns {() => void}
 */
export function startWorldMapLiveFeedPollingV0(opts = {}) {
  if (isWorldExecutionOffV0()) return () => {};

  const emit = () => {
    try {
      opts.onUpdate?.(getWorldMapLiveFeedSnapshotV0());
    } catch {
      /* noop */
    }
  };

  const tick = () => {
    void refreshWorldMapLiveFeedIfStaleV0({ signal: opts.signal, locale: opts.locale }).then(emit);
  };

  tick();
  const id = setInterval(tick, opts.intervalMs ?? DEFAULT_POLL_MS);
  return () => clearInterval(id);
}

/**
 * Live news headlines — NewsData.io primary, Guardian Open Platform fallback.
 */

const DEFAULT_CACHE_MS = 8 * 60 * 1000;
const NEWS_COUNTRY_RE_V0 = /^[a-z]{2}$/;
const NEWS_LANGUAGE_RE_V0 = /^[a-z]{2,3}$/;

/** @type {Map<string, { at: number, bundle: object }>} */
const cacheByLocale = new Map();

/**
 * @returns {{ newsDataKey: string, guardianKey: string, country: string, language: string }}
 */
export function readNewsProviderEnvV0() {
  return {
    newsDataKey: String(process.env.NEWSDATA_API_KEY || process.env.CASTLE_NEWSDATA_API_KEY || "").trim(),
    guardianKey: String(process.env.GUARDIAN_API_KEY || process.env.CASTLE_GUARDIAN_API_KEY || "").trim(),
    country: String(process.env.CASTLE_NEWS_COUNTRY || "us").trim().toLowerCase() || "us",
    language: String(process.env.CASTLE_NEWS_LANGUAGE || "en").trim().toLowerCase() || "en"
  };
}

/**
 * @param {URLSearchParams | { get: (key: string) => string | null }} [searchParams]
 * @returns {{ country: string, language: string }}
 */
export function resolveNewsFeedLocaleV0(searchParams) {
  const defaults = readNewsProviderEnvV0();
  const rawCountry = String(searchParams?.get?.("country") || "").trim().toLowerCase();
  const rawLanguage = String(searchParams?.get?.("language") || "").trim().toLowerCase();
  return {
    country: NEWS_COUNTRY_RE_V0.test(rawCountry) ? rawCountry : defaults.country,
    language: NEWS_LANGUAGE_RE_V0.test(rawLanguage) ? rawLanguage : defaults.language
  };
}

/**
 * @param {unknown} payload
 * @returns {object[]}
 */
export function normalizeNewsDataHeadlinesV0(payload) {
  const rows = Array.isArray(payload?.results) ? payload.results : [];
  return rows.slice(0, 8).map((row) =>
    Object.freeze({
      title: String(row?.title || "").trim(),
      url: row?.link ? String(row.link) : null,
      source: String(row?.source_name || row?.source_id || "NewsData"),
      publishedAt: row?.pubDate ? String(row.pubDate) : null
    })
  );
}

/**
 * @param {unknown} payload
 * @returns {object[]}
 */
export function normalizeGuardianHeadlinesV0(payload) {
  const rows = Array.isArray(payload?.response?.results) ? payload.response.results : [];
  return rows.slice(0, 8).map((row) =>
    Object.freeze({
      title: String(row?.webTitle || "").trim(),
      url: row?.webUrl ? String(row.webUrl) : null,
      source: "The Guardian",
      publishedAt: row?.webPublicationDate ? String(row.webPublicationDate) : null
    })
  );
}

/**
 * @param {string} url
 */
async function fetchJsonV0(url) {
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`news_http_${res.status}`);
  return res.json();
}

/**
 * @param {{ country?: string, language?: string }} [opts]
 */
export async function buildLiveNewsHeadlinesV0(opts = {}) {
  const defaults = readNewsProviderEnvV0();
  const country = NEWS_COUNTRY_RE_V0.test(String(opts.country || "").trim().toLowerCase())
    ? String(opts.country).trim().toLowerCase()
    : defaults.country;
  const language = NEWS_LANGUAGE_RE_V0.test(String(opts.language || "").trim().toLowerCase())
    ? String(opts.language).trim().toLowerCase()
    : defaults.language;
  const cacheKey = `${country}:${language}`;
  const now = Date.now();
  const cached = cacheByLocale.get(cacheKey);
  if (cached && now - cached.at < DEFAULT_CACHE_MS) return cached.bundle;

  const { newsDataKey, guardianKey } = readNewsProviderEnvV0();
  /** @type {object[]} */
  let headlines = [];
  let provider = "none";
  const errors = [];

  if (newsDataKey) {
    try {
      const url =
        `https://newsdata.io/api/1/latest?apikey=${encodeURIComponent(newsDataKey)}` +
        `&country=${encodeURIComponent(country)}&language=${encodeURIComponent(language)}` +
        "&category=world,sports,top&size=8";
      const json = await fetchJsonV0(url);
      headlines = normalizeNewsDataHeadlinesV0(json);
      provider = "newsdata";
    } catch (e) {
      errors.push(`newsdata:${String(e?.message || e)}`);
    }
  }

  if (!headlines.length && guardianKey) {
    try {
      const url =
        `https://content.guardianapis.com/search?order-by=newest&page-size=8` +
        `&show-fields=headline&api-key=${encodeURIComponent(guardianKey)}` +
        "&section=world|sport|football";
      const json = await fetchJsonV0(url);
      headlines = normalizeGuardianHeadlinesV0(json);
      provider = "guardian";
    } catch (e) {
      errors.push(`guardian:${String(e?.message || e)}`);
    }
  }

  const bundle = Object.freeze({
    schema: "castle.live.news.headlines.v0",
    ok: headlines.length > 0,
    provider,
    country,
    language,
    fetchedAt: now,
    cacheTtlMs: DEFAULT_CACHE_MS,
    headlines: Object.freeze(headlines),
    errors: errors.length ? Object.freeze(errors) : undefined
  });

  cacheByLocale.set(cacheKey, { at: now, bundle });
  return bundle;
}

export function resetLiveNewsHeadlinesCacheForTestsV0() {
  cacheByLocale.clear();
}

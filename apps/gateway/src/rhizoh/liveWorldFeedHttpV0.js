/**
 * HTTP handlers — live sports + news (gateway-cached, keys server-side only).
 */

import { buildLiveSportsBundleV0 } from "./liveSportsBundleV0.js";
import { buildLiveNewsHeadlinesV0, resolveNewsFeedLocaleV0 } from "./liveNewsHeadlinesV0.js";

/**
 * @param {import("http").IncomingMessage} [req]
 */
function readNewsLocaleFromRequestV0(req) {
  const url = new URL(req?.url || "", "http://local");
  return resolveNewsFeedLocaleV0(url.searchParams);
}

/**
 * GET /rhizoh/live/sports-bundle
 */
export async function handleLiveSportsBundleGetV0() {
  try {
    const bundle = await buildLiveSportsBundleV0();
    return { status: 200, body: { ok: true, bundle } };
  } catch (e) {
    return {
      status: 502,
      body: { ok: false, error: "sports_bundle_failed", detail: String(e?.message || e) }
    };
  }
}

/**
 * GET /rhizoh/live/news-headlines
 * @param {import("http").IncomingMessage} [req]
 */
export async function handleLiveNewsHeadlinesGetV0(req) {
  try {
    const locale = readNewsLocaleFromRequestV0(req);
    const bundle = await buildLiveNewsHeadlinesV0(locale);
    return { status: 200, body: { ok: true, bundle } };
  } catch (e) {
    return {
      status: 502,
      body: { ok: false, error: "news_headlines_failed", detail: String(e?.message || e) }
    };
  }
}

/**
 * GET /rhizoh/live/world-feed — combined payload for map HUD (1 round-trip).
 * @param {import("http").IncomingMessage} [req]
 */
export async function handleLiveWorldFeedGetV0(req) {
  try {
    const locale = readNewsLocaleFromRequestV0(req);
    const [sports, news] = await Promise.all([
      buildLiveSportsBundleV0(),
      buildLiveNewsHeadlinesV0(locale)
    ]);
    return {
      status: 200,
      body: Object.freeze({
        ok: true,
        schema: "castle.live.world.feed.v0",
        fetchedAt: Date.now(),
        sports,
        news
      })
    };
  } catch (e) {
    return {
      status: 502,
      body: { ok: false, error: "world_feed_failed", detail: String(e?.message || e) }
    };
  }
}

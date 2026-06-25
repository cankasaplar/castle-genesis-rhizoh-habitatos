/**
 * WorldSports media tube wire v0 — pin → gateway feed → media tube surface.
 * RESEARCH-ONLY — observation framing; no execution authority.
 */

import {
  formatSportMatchChipV0,
  getWorldMapLiveFeedSnapshotV0,
  refreshWorldMapLiveFeedIfStaleV0
} from "./worldMapLiveFeedV0.js";
import {
  getLiveMatchMapPinsV0,
  refreshAndPublishLiveMatchPinsV0
} from "./worldMapLiveMatchPinsV0.js";
import { RHIZOH_WORLDSPORTS_CHANNEL_ID_V0 } from "./worldSpaceMediaChannelsV0.js";
import { dispatchOpenMediaTubeV0 } from "./sovereignWorldMapNodesV0.js";

export const WORLD_SPORTS_MEDIA_TUBE_WIRE_SCHEMA_V0 = "castle.rhizoh.world_sports_media_tube_wire.v0";

/**
 * @param {ReadonlyArray<object>} matches
 * @param {string | null | undefined} sportFilter
 */
function filterSportMatchesV0(matches, sportFilter) {
  const list = Array.isArray(matches) ? matches : [];
  const filter = String(sportFilter || "").trim();
  if (!filter) return list;
  return list.filter((m) => String(m?.sport || "") === filter);
}

/**
 * Refresh gateway world-feed + publish live match pins when WorldSports tube opens.
 * @param {{ locale?: string, force?: boolean, sportFilter?: string | null }} [opts]
 */
export async function wireWorldSportsMediaTubeV0(opts = {}) {
  const feed =
    (await refreshWorldMapLiveFeedIfStaleV0({
      force: opts.force === true,
      locale: opts.locale
    })) || getWorldMapLiveFeedSnapshotV0();
  const pins = await refreshAndPublishLiveMatchPinsV0({
    locale: opts.locale,
    force: opts.force === true
  });
  const liveAll = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];
  const upcomingAll = Array.isArray(feed?.sports?.upcoming) ? feed.sports.upcoming : [];
  const live = filterSportMatchesV0(liveAll, opts.sportFilter);
  const upcoming = filterSportMatchesV0(upcomingAll, opts.sportFilter);
  const pinCount = opts.sportFilter
    ? pins.filter((p) => String(p?.liveMatch?.sport || "") === opts.sportFilter).length
    : pins.length;

  return Object.freeze({
    schema: WORLD_SPORTS_MEDIA_TUBE_WIRE_SCHEMA_V0,
    ok: true,
    liveMatchCount: live.length,
    upcomingMatchCount: upcoming.length,
    pinCount,
    sportFilter: opts.sportFilter || null,
    feedFetchedAt: feed?.fetchedAt ?? null,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/**
 * @param {{ locale?: string, sportFilter?: string | null }} [opts]
 */
export function getWorldSportsTubeSnapshotV0(opts = {}) {
  const feed = getWorldMapLiveFeedSnapshotV0();
  const pins = getLiveMatchMapPinsV0();
  const locale = String(opts.locale || "tr");
  const sportFilter = opts.sportFilter || null;
  const liveAll = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];
  const upcomingAll = Array.isArray(feed?.sports?.upcoming) ? feed.sports.upcoming : [];
  const live = filterSportMatchesV0(liveAll, sportFilter);
  const upcoming = filterSportMatchesV0(upcomingAll, sportFilter);
  const pinCount = sportFilter
    ? pins.filter((p) => String(p?.liveMatch?.sport || "") === sportFilter).length
    : pins.length;
  const liveChips = live.slice(0, 8).map((m) => formatSportMatchChipV0(m, locale));
  const upcomingChips = upcoming.slice(0, 8).map((m) => formatSportMatchChipV0(m, locale));
  const recentChips = Object.freeze([...liveChips, ...upcomingChips].slice(0, 8));

  return Object.freeze({
    schema: `${WORLD_SPORTS_MEDIA_TUBE_WIRE_SCHEMA_V0}.snapshot`,
    liveMatchCount: live.length,
    upcomingMatchCount: upcoming.length,
    pinCount,
    sportFilter,
    liveChips: Object.freeze(liveChips),
    upcomingChips: Object.freeze(upcomingChips),
    recentChips,
    feedFetchedAt: feed?.fetchedAt ?? null,
    atMs: Date.now(),
    interpretationOnly: true
  });
}

/**
 * Open WorldSports media tube from worldsports map pin (pin → feed → tube).
 */
export function dispatchOpenWorldSportsMediaTubeV0(payload = {}) {
  void wireWorldSportsMediaTubeV0({ locale: payload.locale, force: true });
  dispatchOpenMediaTubeV0({
    ...payload,
    node: payload.node || {
      id: "worldsports",
      label: "WORLDSPORTS",
      type: "zone",
      color: "#22c55e"
    },
    source: payload.source || "worldsports_pin",
    initialChannelId: RHIZOH_WORLDSPORTS_CHANNEL_ID_V0
  });
}

export function ensureWorldSportsMediaTubeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldSportsTube = () => getWorldSportsTubeSnapshotV0();
  window.__rhizoh.wireWorldSportsTube = (opts) => wireWorldSportsMediaTubeV0(opts);
  return window.__rhizoh.worldSportsTube;
}

/** @internal vitest */
export function resetWorldSportsMediaTubeWireForTestV0() {
  /* stateless — noop */
}

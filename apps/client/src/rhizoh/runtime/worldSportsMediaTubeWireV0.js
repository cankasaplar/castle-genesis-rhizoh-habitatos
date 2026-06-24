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
 * Refresh gateway world-feed + publish live match pins when WorldSports tube opens.
 * @param {{ locale?: string, force?: boolean }} [opts]
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
  const live = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];

  return Object.freeze({
    schema: WORLD_SPORTS_MEDIA_TUBE_WIRE_SCHEMA_V0,
    ok: true,
    liveMatchCount: live.length,
    pinCount: pins.length,
    feedFetchedAt: feed?.fetchedAt ?? null,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function getWorldSportsTubeSnapshotV0(opts = {}) {
  const feed = getWorldMapLiveFeedSnapshotV0();
  const pins = getLiveMatchMapPinsV0();
  const locale = String(opts.locale || "tr");
  const live = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];
  const chips = live.slice(0, 8).map((m) => formatSportMatchChipV0(m, locale));

  return Object.freeze({
    schema: `${WORLD_SPORTS_MEDIA_TUBE_WIRE_SCHEMA_V0}.snapshot`,
    liveMatchCount: live.length,
    pinCount: pins.length,
    recentChips: Object.freeze(chips),
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

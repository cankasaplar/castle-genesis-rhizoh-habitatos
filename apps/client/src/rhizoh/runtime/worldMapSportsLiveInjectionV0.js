/**
 * Sports live injection — feed → live match pins + optional arena SPORTS pin.
 * Istanbul GS/FB/BJK venue mapping via resolveSportVenueAnchorV0.
 * RESEARCH-ONLY
 */

import {
  bindArenaEntityV0,
  ARENA_TYPE_V0,
  computeArenaPersistentHashV0
} from "./arenaBindingLayerV0.js";
import { getAuthorityEpochIdV1 } from "./authorityEpochBoundaryV1.js";
import { populateSportsArenaV0 } from "./arenaPopulationLayerV0.js";
import {
  getPrismCubeMapPinRowsV0,
  setPrismCubeMapPinsV0
} from "./cesiumWorldCommitV0.js";
import {
  buildLiveMatchMapPinsV0,
  refreshAndPublishLiveMatchPinsV0,
  resolveSportVenueAnchorV0
} from "./worldMapLiveMatchPinsV0.js";
import { getWorldMapLiveFeedSnapshotV0 } from "./worldMapLiveFeedV0.js";

export const WORLD_MAP_SPORTS_LIVE_PULSE_EVENT_V0 = "rhizoh:world-map-sports-live-pulse-v0";

const ISTANBUL_TEAM_KEYS_V0 = Object.freeze([
  "galatasaray",
  "fenerbah",
  "beşiktaş",
  "besiktas"
]);

/**
 * @param {string} teamName
 */
export function isIstanbulSportsTeamV0(teamName) {
  const hay = String(teamName || "").toLowerCase();
  return ISTANBUL_TEAM_KEYS_V0.some((k) => hay.includes(k));
}

/**
 * @param {object} match
 * @returns {string}
 */
function sportsEntityIdForMatchV0(match) {
  return `sports_live:${String(match?.id || match?.homeName || "unknown")}`;
}

/**
 * @param {object} match
 */
function ensureSportsArenaEntityForMatchV0(match) {
  const entityId = sportsEntityIdForMatchV0(match);
  const bound = bindArenaEntityV0({
    arenaType: ARENA_TYPE_V0.SPORTS,
    epochId: getAuthorityEpochIdV1(),
    sealRef: computeArenaPersistentHashV0({
      semanticClass: "sports_live_feed",
      partitionKey: String(match?.id || "")
    }),
    timestamp: Date.now(),
    entity: {
      entityId,
      persistentHash: computeArenaPersistentHashV0({
        semanticClass: "sports_live_feed",
        partitionKey: String(match?.id || "")
      }),
      semanticClass: "sports_live_feed"
    },
    payload: Object.freeze({
      homeName: match?.homeName || null,
      awayName: match?.awayName || null,
      sport: match?.sport || null
    })
  });
  return bound?.entityId || bound?.entity?.entityId || entityId;
}

/**
 * @param {{ feed?: object, locale?: string, force?: boolean }} [opts]
 */
export async function ingestSportsLiveFeedV0(opts = {}) {
  const feed = opts.feed || getWorldMapLiveFeedSnapshotV0();
  const locale = opts.locale || "tr";
  const livePins = opts.force
    ? buildLiveMatchMapPinsV0(feed, locale)
    : await refreshAndPublishLiveMatchPinsV0({ locale, force: opts.force });

  const live = Array.isArray(feed?.sports?.live) ? feed.sports.live : [];
  /** @type {object[]} */
  const arenaPins = [];

  for (const match of live.slice(0, 8)) {
    const home = String(match?.homeName || "");
    const away = String(match?.awayName || "");
    const anchor = resolveSportVenueAnchorV0(home) || resolveSportVenueAnchorV0(away);
    if (!anchor) continue;

    const entityId = ensureSportsArenaEntityForMatchV0(match);
    const arena = populateSportsArenaV0({
      entityId,
      eventData: Object.freeze({
        delta: match,
        venue: anchor.city,
        istanbul: anchor.city === "Istanbul" || isIstanbulSportsTeamV0(home) || isIstanbulSportsTeamV0(away)
      })
    });
    if (arena?.ok && arena.pin) {
      arenaPins.push(arena.pin);
    }
  }

  if (arenaPins.length) {
    const existing = getPrismCubeMapPinRowsV0();
    const sportsIds = new Set(arenaPins.map((p) => p.id));
    const merged = [
      ...existing.filter((p) => !sportsIds.has(p.id) && !String(p.id || "").startsWith("sports:")),
      ...arenaPins
    ];
    setPrismCubeMapPinsV0(merged);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORLD_MAP_SPORTS_LIVE_PULSE_EVENT_V0, {
        detail: Object.freeze({
          liveMatchCount: livePins?.length ?? 0,
          arenaPinCount: arenaPins.length,
          istanbulPulse: live.some(
            (m) =>
              isIstanbulSportsTeamV0(m?.homeName) || isIstanbulSportsTeamV0(m?.awayName)
          ),
          atMs: Date.now()
        })
      })
    );
  }

  return Object.freeze({
    ok: true,
    liveMatchPins: livePins,
    arenaPins: Object.freeze(arenaPins)
  });
}

/**
 * @param {{ locale?: string, intervalMs?: number }} [opts]
 * @returns {() => void}
 */
export function startSportsLiveInjectionV0(opts = {}) {
  if (typeof window === "undefined") return () => {};

  const tick = () => {
    void ingestSportsLiveFeedV0({ locale: opts.locale });
  };

  tick();
  const id = window.setInterval(tick, opts.intervalMs ?? 90_000);
  return () => window.clearInterval(id);
}

/**
 * WorldSports Observation Short v0 — capture manifest when feed live.
 * RESEARCH-ONLY
 */

import { getWorldSportsTubeSnapshotV0 } from "./worldSportsMediaTubeWireV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";

export const RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_SCHEMA_V0 =
  "castle.rhizoh.world_sports_observation_short.v0";

/**
 * @param {"en"|"tr"} locale
 * @param {object} digest
 */
function buildShotListV0(locale, digest) {
  const tr = locale === "tr";
  const topLabel = digest.topChipLabel || (tr ? "canlı maç" : "live match");

  return Object.freeze([
    Object.freeze({
      id: "opening",
      beat: 1,
      durationSec: 5,
      scene: tr ? "Studio · WorldSports kamera" : "Studio · WorldSports camera",
      captureUrl: "/studio",
      consoleHook: "__rhizoh.studioVisibility()",
      narratorLine: tr ? "Rhizoh dünya sporlarını gözlemler." : "Rhizoh observes world sports."
    }),
    Object.freeze({
      id: "wire_feed",
      beat: 2,
      durationSec: 15,
      scene: tr ? "Gateway beslemesi" : "Gateway feed",
      captureUrl: "/world/space?channel=world_sports",
      consoleHook: "await __rhizoh.wireWorldSportsTube()",
      narratorLine: tr
        ? `${digest.liveMatchCount} canlı · ${digest.pinCount} pin`
        : `${digest.liveMatchCount} live · ${digest.pinCount} pins`
    }),
    Object.freeze({
      id: "live_chips",
      beat: 3,
      durationSec: 25,
      scene: tr ? "Canlı maç şeridi" : "Live match strip",
      captureUrl: "/world/space?channel=world_sports",
      consoleHook: "__rhizoh.worldSportsTube()",
      narratorLine: topLabel
    }),
    Object.freeze({
      id: "close",
      beat: 4,
      durationSec: 5,
      scene: tr ? "Dürüst kapanış" : "Honest close",
      captureUrl: "/academy/observe",
      consoleHook: "__rhizoh.lifeOsStatus()",
      narratorLine: tr
        ? "Yalnızca gözlem · yürütme yok."
        : "Observation only · no execution."
    })
  ]);
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildRhizohWorldSportsObservationShortCaptureV0(opts = {}) {
  const locale = opts.locale === "tr" ? "tr" : "en";
  const sports = getWorldSportsTubeSnapshotV0({ locale });
  const studio = buildRhizohStudioVisibilitySnapshotV0();
  const live = sports.liveMatchCount ?? 0;
  const pins = sports.pinCount ?? 0;
  const readyToRecord = live > 0 || pins > 0;

  const digest = Object.freeze({
    liveMatchCount: live,
    pinCount: pins,
    upcomingMatchCount: sports.upcomingMatchCount ?? 0,
    topChipLabel: sports.recentChips?.[0]?.label ?? null,
    feedFetchedAt: sports.feedFetchedAt,
    feedEmpty: !readyToRecord,
    lifeOsStatus: studio.lifeOsStatus
  });

  const suggestions = Object.freeze(
    [
      !readyToRecord
        ? locale === "tr"
          ? "Gateway anahtarı + await __rhizoh.wireWorldSportsTube({ force: true })"
          : "Gateway keys + await __rhizoh.wireWorldSportsTube({ force: true })"
        : null
    ].filter(Boolean)
  );

  return Object.freeze({
    schema: RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_SCHEMA_V0,
    interpretationOnly: true,
    title: "Rhizoh WorldSports Observation #001",
    locale,
    durationSecTarget: 50,
    readyToRecord,
    digest,
    shotList: buildShotListV0(locale, digest),
    suggestions,
    atMs: Date.now()
  });
}

export function formatWorldSportsObservationShortBriefV0(capture) {
  return [
    `# ${capture.title}`,
    `ready: ${capture.readyToRecord ? "YES" : "NO"} · live ${capture.digest.liveMatchCount} · pins ${capture.digest.pinCount}`,
    "",
    "## Shot list",
    ...capture.shotList.map(
      (s) =>
        `${s.beat}. [${s.durationSec}s] ${s.scene}\n   ${s.captureUrl}\n   ${s.consoleHook}\n   > ${s.narratorLine}`
    ),
    "",
    ...(capture.suggestions.length
      ? [`## Suggestions`, ...capture.suggestions.map((s) => `- ${s}`)]
      : [])
  ].join("\n");
}

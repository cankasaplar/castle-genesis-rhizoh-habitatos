/**
 * CASTLE_AWARENESS_FIELD_V1 — Phase B: persistent normalized world awareness slices.
 * Feeds worldSignal only; does not create new attention axes.
 */

import { readCanonicalLiveSnapshotV1 } from "./rhizohCanonicalLiveSnapshotV1.js";

export const CASTLE_AWARENESS_FIELD_SCHEMA_V1 = "castle.rhizoh.castle_awareness_field.v1";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

/**
 * Normalize live-world feeds into stable 0–1 awareness slices.
 * @param {number} [atMs]
 */
export function readCastleAwarenessFieldV1(atMs = Date.now()) {
  let snap = null;
  try {
    snap = readCanonicalLiveSnapshotV1(atMs);
  } catch {
    snap = null;
  }

  let weatherAwareness = 0.12;
  const weather = snap?.weather;
  if (weather) {
    const desc = String(weather.description || "").toLowerCase();
    if (/(storm|fırtına|thunder|extreme)/u.test(desc)) weatherAwareness = 0.72;
    else if (/(rain|yağmur|snow|kar)/u.test(desc)) weatherAwareness = 0.38;
    else weatherAwareness = 0.18;
  }

  let trafficAwareness = 0.1;
  const traffic = snap?.traffic;
  if (traffic) {
    const intensity = clamp01(traffic.intensity);
    const level = String(traffic.level || "").toLowerCase();
    if (level === "heavy" || level === "severe" || intensity > 0.7) trafficAwareness = 0.68;
    else if (intensity > 0.4) trafficAwareness = 0.42;
    else trafficAwareness = 0.2;
  }

  let sportsAwareness = 0.08;
  const liveMatches = snap?.sports?.liveMatches;
  if (Array.isArray(liveMatches) && liveMatches.length > 0) {
    sportsAwareness = Math.min(0.55, 0.2 + liveMatches.length * 0.08);
  }

  let newsAwareness = 0.1;
  const headlines = snap?.news?.headlines;
  if (Array.isArray(headlines) && headlines.length > 0) {
    newsAwareness = 0.22;
    for (const h of headlines.slice(0, 5)) {
      const title = String(h?.title || "").toLowerCase();
      if (/(deprem|war|savaş|crisis|kriz|breaking|acil)/u.test(title)) {
        newsAwareness = 0.92;
        break;
      }
    }
  }

  return Object.freeze({
    schema: CASTLE_AWARENESS_FIELD_SCHEMA_V1,
    role: "awareness_feed_only",
    generatedAt: Number(atMs) || Date.now(),
    weatherAwareness: round3(weatherAwareness),
    trafficAwareness: round3(trafficAwareness),
    sportsAwareness: round3(sportsAwareness),
    newsAwareness: round3(newsAwareness),
    socialAwareness: 0,
    narrativeAwareness: 0
  });
}

/**
 * Collapse awareness slices into a single world feed for FOX worldSignal.
 * @param {ReturnType<typeof readCastleAwarenessFieldV1>} awareness
 */
export function worldSignalFromAwarenessV1(awareness) {
  const a = awareness && typeof awareness === "object" ? awareness : {};
  return round3(
    Math.max(
      clamp01(a.weatherAwareness),
      clamp01(a.trafficAwareness),
      clamp01(a.sportsAwareness),
      clamp01(a.newsAwareness),
      clamp01(a.socialAwareness),
      clamp01(a.narrativeAwareness)
    )
  );
}

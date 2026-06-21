/**
 * Matchmaking Engine v0 — compatibility scoring + AI fallback (shadow rehearsal).
 * Server-authoritative in spec · client-local scoring for dev rehearsal only.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import {
  getMatchBeaconRegistrySnapshotV0,
  MATCH_MODE_V0
} from "./matchmakingBeaconRegistryV0.js";
import { createMatchSessionV0, MATCH_SESSION_STATE_V0 } from "./matchSessionLifecycleV0.js";

export const MATCHMAKING_ENGINE_SCHEMA_V0 = "castle.rhizoh.matchmaking_engine.v0";

export const MATCH_COMPAT_WEIGHTS_V0 = Object.freeze({
  mode: 0.35,
  timeControl: 0.25,
  rating: 0.25,
  entropy: 0.1,
  freshness: 0.05
});

export const MATCH_PAIR_THRESHOLD_V0 = 0.62;
export const MATCH_AI_FALLBACK_MS_V0 = 45_000;

/**
 * @param {number} a
 * @param {number} b
 * @param {number} tolerance
 */
function proximityScoreV0(a, b, tolerance) {
  const diff = Math.abs(a - b);
  return Math.max(0, 1 - diff / Math.max(1, tolerance));
}

/**
 * @param {[number, number] | undefined} a
 * @param {[number, number] | undefined} b
 */
function ratingOverlapScoreV0(a, b) {
  if (!a || !b) return 0.5;
  const overlapMin = Math.max(a[0], b[0]);
  const overlapMax = Math.min(a[1], b[1]);
  if (overlapMax < overlapMin) return 0;
  const spanA = Math.max(1, a[1] - a[0]);
  const spanB = Math.max(1, b[1] - b[0]);
  return Math.min(1, (overlapMax - overlapMin) / Math.min(spanA, spanB));
}

/**
 * @param {object} left
 * @param {object} right
 */
export function scoreBeaconPairV0(left, right) {
  if (!left || !right || left.userId === right.userId) {
    return Object.freeze({ score: 0, breakdown: Object.freeze({}) });
  }

  const modeMatch = left.mode === right.mode ? 1 : 0;
  const tcScore = proximityScoreV0(left.timeControlMs, right.timeControlMs, Math.max(left.timeControlMs, 1) * 0.5);
  const ratingScore = ratingOverlapScoreV0(left.ratingRange, right.ratingRange);
  const entropyA = left.entropyTag ?? 0.5;
  const entropyB = right.entropyTag ?? 0.5;
  const entropyScore = 1 - Math.abs(entropyA - entropyB);
  const ageMs = Math.max(0, Date.now() - Math.min(left.createdAtMs, right.createdAtMs));
  const freshnessScore = Math.max(0, 1 - ageMs / MATCH_AI_FALLBACK_MS_V0);

  const score =
    MATCH_COMPAT_WEIGHTS_V0.mode * modeMatch +
    MATCH_COMPAT_WEIGHTS_V0.timeControl * tcScore +
    MATCH_COMPAT_WEIGHTS_V0.rating * ratingScore +
    MATCH_COMPAT_WEIGHTS_V0.entropy * entropyScore +
    MATCH_COMPAT_WEIGHTS_V0.freshness * freshnessScore;

  return Object.freeze({
    score: Math.round(score * 1000) / 1000,
    breakdown: Object.freeze({
      modeMatch,
      tcScore: Math.round(tcScore * 1000) / 1000,
      ratingScore: Math.round(ratingScore * 1000) / 1000,
      entropyScore: Math.round(entropyScore * 1000) / 1000,
      freshnessScore: Math.round(freshnessScore * 1000) / 1000
    })
  });
}

/**
 * @param {{ mode?: string, aiFallback?: boolean }} [opts]
 */
export function tryMatchFromBeaconsV0(opts = {}) {
  const registry = getMatchBeaconRegistrySnapshotV0();
  const mode = opts.mode || MATCH_MODE_V0.KINETIC;
  const beacons = registry.beacons.filter((b) => b.mode === mode);
  const now = Date.now();

  let bestPair = null;
  let bestScore = 0;

  for (let i = 0; i < beacons.length; i++) {
    for (let j = i + 1; j < beacons.length; j++) {
      const scored = scoreBeaconPairV0(beacons[i], beacons[j]);
      if (scored.score > bestScore) {
        bestScore = scored.score;
        bestPair = Object.freeze({
          left: beacons[i],
          right: beacons[j],
          score: scored.score,
          breakdown: scored.breakdown
        });
      }
    }
  }

  if (bestPair && bestScore >= MATCH_PAIR_THRESHOLD_V0) {
    const session = createMatchSessionV0({
      mode: bestPair.left.mode,
      players: [
        { userId: bestPair.left.userId, color: "white", kind: "human" },
        { userId: bestPair.right.userId, color: "black", kind: "human" }
      ],
      timeControlMs: Math.round((bestPair.left.timeControlMs + bestPair.right.timeControlMs) / 2),
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      opponentKind: "human"
    });

    return Object.freeze({
      schema: MATCHMAKING_ENGINE_SCHEMA_V0,
      ok: true,
      matched: true,
      aiFallback: false,
      pair: bestPair,
      session,
      shadowRehearsal: true,
      serverAuthoritative: false,
      interpretationOnly: true
    });
  }

  const stale = beacons.find((b) => now - b.createdAtMs >= MATCH_AI_FALLBACK_MS_V0);
  if (opts.aiFallback !== false && stale) {
    const session = createMatchSessionV0({
      mode: stale.mode,
      players: [{ userId: stale.userId, color: "white", kind: "human" }],
      timeControlMs: stale.timeControlMs,
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      opponentKind: "ai_stockfish"
    });

    return Object.freeze({
      schema: MATCHMAKING_ENGINE_SCHEMA_V0,
      ok: true,
      matched: true,
      aiFallback: true,
      beacon: stale,
      session,
      shadowRehearsal: true,
      serverAuthoritative: false,
      interpretationOnly: true
    });
  }

  return Object.freeze({
    schema: MATCHMAKING_ENGINE_SCHEMA_V0,
    ok: true,
    matched: false,
    reason: beacons.length < 2 ? "insufficient_beacons" : "below_threshold",
    bestScore,
    shadowRehearsal: true,
    interpretationOnly: true
  });
}

export function mountMatchmakingEngineConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchmaking = window.__rhizoh.matchmaking || {};
  window.__rhizoh.matchmaking.tryMatch = tryMatchFromBeaconsV0;
  window.__rhizoh.matchmaking.scorePair = scoreBeaconPairV0;
}

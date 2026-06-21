import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMatchBeaconRegistryForTestV0,
  emitMatchBeaconV0,
  getMatchBeaconRegistrySnapshotV0
} from "../matchmakingBeaconRegistryV0.js";
import { scoreBeaconPairV0, tryMatchFromBeaconsV0 } from "../matchmakingEngineV0.js";
import {
  clearMatchSessionForTestV0,
  createMatchSessionV0,
  isLegalSessionTransitionV0,
  MATCH_SESSION_STATE_V0,
  transitionMatchSessionV0
} from "../matchSessionLifecycleV0.js";
import {
  buildMatchCodexSnapshotV0,
  publishMatchFinishedToCodexV0
} from "../matchmakingCodexBridgeV0.js";
import { onCodexBusV0, __resetCodexBusForTestV0 } from "../../../core/CodexBusV0.js";

describe("matchmaking core v0", () => {
  beforeEach(() => {
    clearMatchBeaconRegistryForTestV0();
    clearMatchSessionForTestV0();
    __resetCodexBusForTestV0();
  });

  it("indexes beacons with rate limit metadata", () => {
    const out = emitMatchBeaconV0({
      userId: "user_a",
      mode: "KINETIC",
      timeControlMs: 180000,
      ratingRange: [1200, 1400]
    });
    expect(out.ok).toBe(true);
    expect(out.beacon.mode).toBe("KINETIC");
    expect(getMatchBeaconRegistrySnapshotV0().count).toBe(1);
  });

  it("scores compatible beacon pairs above threshold", () => {
    const a = emitMatchBeaconV0({
      userId: "user_a",
      mode: "KINETIC",
      timeControlMs: 180000,
      ratingRange: [1200, 1400],
      entropyTag: 0.4
    }).beacon;
    const b = emitMatchBeaconV0({
      userId: "user_b",
      mode: "KINETIC",
      timeControlMs: 180000,
      ratingRange: [1250, 1450],
      entropyTag: 0.45
    }).beacon;

    const scored = scoreBeaconPairV0(a, b);
    expect(scored.score).toBeGreaterThan(0.62);
  });

  it("creates human session when pair threshold met", () => {
    emitMatchBeaconV0({ userId: "user_a", mode: "KINETIC", timeControlMs: 180000, ratingRange: [1200, 1400] });
    emitMatchBeaconV0({ userId: "user_b", mode: "KINETIC", timeControlMs: 180000, ratingRange: [1250, 1450] });

    const match = tryMatchFromBeaconsV0({ mode: "KINETIC" });
    expect(match.matched).toBe(true);
    expect(match.aiFallback).toBe(false);
    expect(match.session.players.length).toBe(2);
  });

  it("enforces legal session lifecycle transitions", () => {
    expect(isLegalSessionTransitionV0(MATCH_SESSION_STATE_V0.SESSION_ACTIVE, MATCH_SESSION_STATE_V0.SESSION_FINISHED)).toBe(
      true
    );
    expect(isLegalSessionTransitionV0(MATCH_SESSION_STATE_V0.SESSION_FINISHED, MATCH_SESSION_STATE_V0.SESSION_ACTIVE)).toBe(
      false
    );
  });

  it("publishes match_finished snapshot to CODEX bus", () => {
    let received = null;
    onCodexBusV0("match_finished_event", (payload) => {
      received = payload;
    });

    createMatchSessionV0({
      mode: "KINETIC",
      players: [{ userId: "user_a", color: "white" }],
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE
    });
    const finished = transitionMatchSessionV0(MATCH_SESSION_STATE_V0.SESSION_FINISHED, { result: "1-0" });

    const out = publishMatchFinishedToCodexV0(finished.session);
    expect(out.ok).toBe(true);
    expect(received?.sessionId).toBe(finished.session.sessionId);
    expect(received?.influencesExecution).toBe(false);
    expect(buildMatchCodexSnapshotV0(finished.session).moveCount).toBe(0);
  });
});

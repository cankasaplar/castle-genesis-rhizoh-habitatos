import { describe, expect, it } from "vitest";
import {
  blendCastlePresenceEnergy01V0,
  detectCastleSimultaneousSpeechConflictV0,
  resolveCastleInterruptionRequestV0,
  resolveCastleSpeechOverlapV0
} from "../castleSpeechConflictEngineV0.js";

describe("resolveCastleSpeechOverlapV0", () => {
  it("earliest ts wins; tie-break by userId", () => {
    const r = resolveCastleSpeechOverlapV0([
      { userId: "b", ts: 5 },
      { userId: "a", ts: 5 }
    ]);
    expect(r.focus?.userId).toBe("a");
    expect(r.shadowListeners.map((s) => s.userId)).toContain("b");
  });
});

describe("resolveCastleInterruptionRequestV0", () => {
  it("blocks low tier during min hold", () => {
    const r = resolveCastleInterruptionRequestV0({
      currentFocus: { userId: "alice", sinceTs: 100 },
      incoming: { userId: "bob", ts: 150, tier: "TICK_DRIFT_AMBIENT" },
      minHoldMs: 1_000
    });
    expect(r.allowed).toBe(false);
  });

  it("allows USER_HARD even during min hold", () => {
    const r = resolveCastleInterruptionRequestV0({
      currentFocus: { userId: "alice", sinceTs: 100 },
      incoming: { userId: "bob", ts: 150, tier: "USER_HARD" },
      minHoldMs: 1_000
    });
    expect(r.allowed).toBe(true);
    expect(r.nextFocus?.userId).toBe("bob");
  });
});

describe("detectCastleSimultaneousSpeechConflictV0", () => {
  it("true only when same timestamp has 2+ speakers", () => {
    expect(detectCastleSimultaneousSpeechConflictV0([{ userId: "a", ts: 1 }, { userId: "b", ts: 2 }])).toBe(false);
    expect(detectCastleSimultaneousSpeechConflictV0([{ userId: "a", ts: 5 }, { userId: "b", ts: 5 }])).toBe(true);
  });
});

describe("blendCastlePresenceEnergy01V0", () => {
  it("averages finite energy hints", () => {
    expect(
      blendCastlePresenceEnergy01V0([
        { userId: "a", energy01: 0.4 },
        { userId: "b", energy01: 0.8 }
      ])
    ).toBe(0.6);
  });
});

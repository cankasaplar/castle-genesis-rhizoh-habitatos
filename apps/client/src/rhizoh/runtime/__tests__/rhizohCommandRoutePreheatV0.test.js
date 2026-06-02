import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetCommandRoutePreheatForTestV0,
  isCommandRoutingPreheatedV0,
  prewarmCommandRoutingV0
} from "../rhizohCommandRoutePreheatV0.js";
import { __resetCommandStateMachineForTestV0 } from "../rhizohCommandStateMachineV0.js";

describe("rhizohCommandRoutePreheatV0", () => {
  beforeEach(() => {
    __resetCommandRoutePreheatForTestV0();
    __resetCommandStateMachineForTestV0();
  });

  it("prewarms alias index and state machine", () => {
    const snap = prewarmCommandRoutingV0();
    expect(isCommandRoutingPreheatedV0()).toBe(true);
    expect(snap.registrySize).toBeGreaterThanOrEqual(50);
    expect(snap.aliasSize).toBeGreaterThan(50);
    expect(snap.latencyMs).toBeLessThan(50);
  });
});

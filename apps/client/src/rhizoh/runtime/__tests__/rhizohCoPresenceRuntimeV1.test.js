import { describe, expect, it, beforeEach } from "vitest";
import {
  CO_PRESENCE_SPIKE_KIND_V1,
  __resetCoPresenceRuntimeForTestV1,
  computeCoPresenceUtilityV1,
  resolveAdaptiveSpikeThresholdV1,
  shouldCoPresenceRespondV1,
  noteCoPresenceSpikeResponseV1
} from "../rhizohCoPresenceRuntimeV1.js";

describe("rhizohCoPresenceRuntimeV1", () => {
  beforeEach(() => {
    __resetCoPresenceRuntimeForTestV1();
  });

  it("computes utility with silence penalty", () => {
    const u = computeCoPresenceUtilityV1({
      relevance: 0.7,
      contextAwareness: 0.5,
      kind: CO_PRESENCE_SPIKE_KIND_V1.QUESTION
    });
    expect(u).toBeCloseTo(0.27, 2);
  });

  it("emergency bypasses adaptive tau", () => {
    const d = shouldCoPresenceRespondV1({
      kind: CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY,
      relevance: 0.5,
      contextAwareness: 0.3
    });
    expect(d.respond).toBe(true);
    expect(d.tau).toBe(0);
  });

  it("raises tau under spike flooding", () => {
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      noteCoPresenceSpikeResponseV1({
        respond: true,
        kind: CO_PRESENCE_SPIKE_KIND_V1.QUESTION,
        atMs: now - i * 1000
      });
    }
    const t = resolveAdaptiveSpikeThresholdV1(now);
    expect(t.tauAdaptive).toBeGreaterThan(t.tauBase);
    expect(t.recentRespondCount).toBe(6);
  });
});

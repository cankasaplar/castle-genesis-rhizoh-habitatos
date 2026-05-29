import { describe, it, expect } from "vitest";
import {
  deriveEpistemicKeyV0,
  composeEpistemicKeyInputV0,
  deriveEpistemicKeyFromWorldPresenceSliceV0,
  epistemicAmbientKeyRegistryV0
} from "../deriveEpistemicKeyV0.js";
import { buildWorldPresenceStateV0 } from "../worldPresenceRuntimeV0.js";

describe("deriveEpistemicKeyV0", () => {
  it("priority: HIGH_INTERACTION wins over drift / low visibility", () => {
    expect(
      deriveEpistemicKeyV0({
        luminosity: 0.81,
        driftBloom: 0.99,
        visibility: 0.1
      })
    ).toBe("HIGH_INTERACTION");
  });

  it("DRIFT_BLOOM when drift high but luminosity not > 0.8", () => {
    expect(
      deriveEpistemicKeyV0({
        luminosity: 0.5,
        driftBloom: 0.61,
        visibility: 0.9
      })
    ).toBe("DRIFT_BLOOM");
  });

  it("DIVERGENCE when visibility low and prior rules false", () => {
    expect(
      deriveEpistemicKeyV0({
        luminosity: 0.5,
        driftBloom: 0.5,
        visibility: 0.39
      })
    ).toBe("DIVERGENCE");
  });

  it("STABILITY default", () => {
    expect(
      deriveEpistemicKeyV0({
        luminosity: 0.5,
        driftBloom: 0.5,
        visibility: 0.5
      })
    ).toBe("STABILITY");
  });

  it("boundary: luminosity 0.8 is not HIGH_INTERACTION", () => {
    expect(
      deriveEpistemicKeyV0({
        luminosity: 0.8,
        driftBloom: 0.61,
        visibility: 0.5
      })
    ).toBe("DRIFT_BLOOM");
  });

  it("composeEpistemicKeyInputV0 maps world presence ambient + atmosphere", () => {
    const s = buildWorldPresenceStateV0();
    const input = composeEpistemicKeyInputV0(s);
    expect(input).toMatchObject({
      luminosity: expect.any(Number),
      driftBloom: expect.any(Number),
      visibility: expect.any(Number)
    });
    expect(input.visibility).toBe(s.atmosphere.visibilityBudget);
  });

  it("deriveEpistemicKeyFromWorldPresenceSliceV0 is deterministic for same slice", () => {
    const s = buildWorldPresenceStateV0();
    const a = deriveEpistemicKeyFromWorldPresenceSliceV0(s);
    const b = deriveEpistemicKeyFromWorldPresenceSliceV0(s);
    expect(a).toBe(b);
    expect(epistemicAmbientKeyRegistryV0[a]).toBeDefined();
  });
});

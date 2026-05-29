import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../castleDebugGateV0.js", () => ({
  isCastleDebugGranularFlagEnabled: vi.fn(() => false)
}));

import { witnessRhizohAuthorityV0 } from "../rhizohAuthorityWitnessV0.js";
import { isCastleDebugGranularFlagEnabled } from "../castleDebugGateV0.js";

describe("rhizohAuthorityWitnessV0", () => {
  beforeEach(() => {
    vi.mocked(isCastleDebugGranularFlagEnabled).mockReturnValue(false);
  });

  it("does not log when debug gate is false", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    witnessRhizohAuthorityV0({ signal: "test_signal" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("emits structured console.debug when gate is true", () => {
    vi.mocked(isCastleDebugGranularFlagEnabled).mockReturnValue(true);
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    witnessRhizohAuthorityV0({
      signal: "relational_overlay_for_llm",
      decision: "skipped",
      reason: "TCEE_PRE_BREATH_RELATIONAL_OVERLAY_GATED"
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const [label, payload] = spy.mock.calls[0];
    expect(label).toBe("[rhizoh.authority.witness]");
    expect(payload.signal).toBe("relational_overlay_for_llm");
    expect(payload.schemaVersion).toBe("rhizoh.authority_witness.v0");
    expect(typeof payload.ts).toBe("number");
    spy.mockRestore();
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { clearObserverTraceForTestV0, observeV0 } from "../observerReadOnlyHookV0.js";
import { clearMeaningResonanceLedgerForTestV0 } from "../meaningResonanceLedgerV0.js";
import { proposeNarrativeBridgeV0 } from "../narrativeBridgeV0.js";

function seedStableMapChessPatternV0() {
  const base = Date.now() - 120_000;
  for (let i = 0; i < 4; i += 1) {
    observeV0({
      type: "map_hover",
      target: "pin_42",
      meta: { surface: "map", focus: 0.5 }
    });
    observeV0({
      type: "chess_open",
      target: "e4",
      meta: { surface: "chess", focus: 0.4 }
    });
    // Spread timestamps via manual patch on last entries is not available;
    // validation uses density when span is low — 4+ repeats still pass invariance.
    void base;
  }
}

describe("narrativeBridgeV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearMeaningResonanceLedgerForTestV0();
  });

  it("rejects proposal when pattern stability is insufficient", () => {
    observeV0({ type: "map_hover", target: "pin_once", meta: { surface: "map" } });
    const result = proposeNarrativeBridgeV0({ locale: "en" });
    expect(result.status).toBe("rejected");
    expect(result.ledgerRecord).toBeNull();
  });

  it("records to meaning ledger when axioms pass", () => {
    seedStableMapChessPatternV0();
    const result = proposeNarrativeBridgeV0({ locale: "en" });
    expect(result.status).toBe("recorded");
    expect(result.meaningEmergesAgencyNever).toBe(true);
    expect(result.ledgerRecord?.influencesCausalGraph).toBe(false);
    expect(result.ledgerRecord?.learns).toBe(false);
  });
});

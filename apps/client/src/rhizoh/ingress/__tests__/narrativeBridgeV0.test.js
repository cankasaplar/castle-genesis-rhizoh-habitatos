import { describe, expect, it, beforeEach } from "vitest";
import {
  clearObserverTraceForTestV0,
  getObserverTraceSnapshotV0,
  injectObserverTraceEntriesForTestV0
} from "../observerReadOnlyHookV0.js";
import { clearMeaningResonanceLedgerForTestV0 } from "../meaningResonanceLedgerV0.js";
import { proposeNarrativeBridgeV0 } from "../narrativeBridgeV0.js";

const STABLE_TRACE_ROWS = [
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
];

describe("narrativeBridgeV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearMeaningResonanceLedgerForTestV0();
  });

  it("rejects proposal when pattern stability is insufficient", () => {
    injectObserverTraceEntriesForTestV0([
      { type: "map_hover", target: "pin_once", meta: { surface: "map" } }
    ]);
    const result = proposeNarrativeBridgeV0({ locale: "en" });
    expect(result.status).toBe("rejected");
    expect(result.ledgerRecord).toBeNull();
  });

  it("records to ledger without amplifying observer trace (single consume pass)", () => {
    injectObserverTraceEntriesForTestV0(STABLE_TRACE_ROWS);
    const countBefore = getObserverTraceSnapshotV0().count;
    const result = proposeNarrativeBridgeV0({ locale: "en" });
    const countAfter = getObserverTraceSnapshotV0().count;
    expect(result.status).toBe("recorded");
    expect(result.meaningEmergesAgencyNever).toBe(true);
    expect(result.invocationAsymmetry).toBe(true);
    expect(result.echoGuard.echoLoopDetected).toBe(false);
    expect(result.ledgerRecord?.learns).toBe(false);
    expect(countAfter).toBe(countBefore);
  });
});

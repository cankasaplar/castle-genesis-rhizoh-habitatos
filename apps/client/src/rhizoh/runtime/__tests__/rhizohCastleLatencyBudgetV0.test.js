import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetCastleLatencyBudgetForTestV0,
  CASTLE_LATENCY_BUDGET_MS_V0,
  enforceLatencyBudgetV0,
  readCastleLatencyViolationsV0,
  reportCastleLatencyViolationV0
} from "../rhizohCastleLatencyBudgetV0.js";

describe("rhizohCastleLatencyBudgetV0", () => {
  beforeEach(() => {
    __resetCastleLatencyBudgetForTestV0();
  });

  it("passes under budget", () => {
    const r = enforceLatencyBudgetV0("routing", 3, "TRC-LAT-1");
    expect(r.ok).toBe(true);
    expect(readCastleLatencyViolationsV0().length).toBe(0);
  });

  it("reports CASTLE_LATENCY_VIOLATION when over budget", () => {
    const r = enforceLatencyBudgetV0("routing", CASTLE_LATENCY_BUDGET_MS_V0.routing + 3, "TRC-LAT-2");
    expect(r.ok).toBe(false);
    expect(r.violation?.kind).toBe("CASTLE_LATENCY_VIOLATION");
    expect(readCastleLatencyViolationsV0().length).toBe(1);
  });

  it("reportCastleLatencyViolationV0 schema", () => {
    const v = reportCastleLatencyViolationV0({
      phase: "local_exec",
      elapsedMs: 20,
      budgetMs: 10,
      traceId: "TRC-X"
    });
    expect(v.violation?.schema).toContain("latency_violation");
  });
});

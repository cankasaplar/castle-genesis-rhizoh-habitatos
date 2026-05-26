import { describe, it, expect } from "vitest";
import { runControlledChaosV0, CHAOS_ANOMALY_MATRIX_V0 } from "../chaosHarnessV0.js";
import { createInMemoryContinuityAdapterV0 } from "./inMemoryContinuityAdapterV0.js";
import { SCOREBOARD_STATUS_V0 } from "../chaosScoreboardV0.js";

describe("chaosHarnessV0 (Hat B)", () => {
  it("runs 7 anomalies with deterministic quarantine scoreboard", async () => {
    const report = await runControlledChaosV0({
      createAdapter: (k) => createInMemoryContinuityAdapterV0(k),
      print: false
    });

    expect(CHAOS_ANOMALY_MATRIX_V0.length).toBe(7);
    expect(report.scoreboard.totalTests).toBe(7);
    expect(report.scoreboard.passed).toBe(7);
    expect(report.scoreboard.failed).toBe(0);
    expect(report.scoreboard.status).toBe(SCOREBOARD_STATUS_V0.SUBSTRATE_IMMUNE);
    expect(report.allPassed).toBe(true);

    const stale = report.scoreboard.entries.find((e) => e.anomalyId === 1);
    expect(stale?.pass).toBe(true);
    expect(String(stale?.statusLine)).toContain("[PASS]");
    expect(String(stale?.statusLine)).toContain("Monotonic Violation Blocked");

    const hash = report.scoreboard.entries.find((e) => e.anomalyId === 2);
    expect(hash?.pass).toBe(true);
    expect(String(hash?.statusLine)).toContain("HASH_CHAIN_MUTATION");

    const chrono = report.scoreboard.entries.find((e) => e.anomalyId === 5);
    expect(chrono?.pass).toBe(true);
    expect(String(chrono?.statusLine)).toContain("Chrono-Skew Isolation Successful");
  });

  it("banner includes SUBSTRATE IMMUNE when all pass", async () => {
    const report = await runControlledChaosV0({
      createAdapter: (k) => createInMemoryContinuityAdapterV0(k),
      print: false
    });
    expect(report.banner).toContain("SUBSTRATE IMMUNE");
    expect(report.banner).toContain("TOTAL: 7");
  });
});

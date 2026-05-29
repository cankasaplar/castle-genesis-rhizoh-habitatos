import { describe, expect, it } from "vitest";
import {
  runViolationSimulationSuiteV0,
  VIOLATION_SCENARIO_IDS_V0,
  VIOLATION_RESPONSE_MODE_V0
} from "../violationSimulationSuiteV0.js";

describe("violationSimulationSuiteV0 (law stress v0.1)", () => {
  it("runs all playbook scenarios", async () => {
    const report = await runViolationSimulationSuiteV0({ print: false });
    expect(VIOLATION_SCENARIO_IDS_V0.length).toBe(11);
    expect(report.total).toBe(11);
    expect(report.allPassed).toBe(true);
    expect(report.passed).toBe(11);
    expect(report.centralizedArbitrationBus).toBe(false);
  });

  it("maps ghost injection to REVOKE mode", async () => {
    const report = await runViolationSimulationSuiteV0({
      scenarioIds: ["ghost_bootstrap_injection"]
    });
    const row = report.scenarios[0];
    expect(row.pass).toBe(true);
    expect(row.actualMode).toBe(VIOLATION_RESPONSE_MODE_V0.REVOKE);
  });

  it("maps hash repair to CORRECTION_CHAIN mode", async () => {
    const report = await runViolationSimulationSuiteV0({
      scenarioIds: ["correction_hash_mutation_repair"]
    });
    expect(report.scenarios[0].pass).toBe(true);
    expect(report.scenarios[0].actualMode).toBe(VIOLATION_RESPONSE_MODE_V0.CORRECTION_CHAIN);
  });
});

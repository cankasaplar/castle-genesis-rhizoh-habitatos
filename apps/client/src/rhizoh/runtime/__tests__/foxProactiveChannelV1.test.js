import { describe, it, expect, beforeEach } from "vitest";
import {
  canFoxProactiveInitiateV1,
  buildFoxProactiveUtteranceV1,
  runFoxProactiveChannelTickV1,
  recordFoxProactiveInitiationV1,
  getFoxProactiveBudgetSnapshotV1,
  FOX_PROACTIVE_BUDGET_DEFAULT_V1,
  __resetFoxProactiveChannelForTestV1
} from "../foxProactiveChannelV1.js";
import {
  enqueueFoxInitiativeV1,
  __resetFoxBehaviorGateForTestV1
} from "../foxBehaviorGateV1.js";
import { __resetPersonaSchedulerForTestV0 } from "../rhizohPersonaLoopSchedulerV0.js";
import { __resetFoxProactiveAdaptationForTestV1 } from "../foxProactiveAdaptationV1.js";

describe("foxProactiveChannelV1", () => {
  beforeEach(() => {
    __resetFoxBehaviorGateForTestV1();
    __resetFoxProactiveChannelForTestV1();
    __resetFoxProactiveAdaptationForTestV1();
    __resetPersonaSchedulerForTestV0();
  });

  it("blocks when hourly budget exhausted", () => {
    const at = Date.now();
    recordFoxProactiveInitiationV1({ atMs: at - 1000, initiativeId: "a", source: "news" });
    recordFoxProactiveInitiationV1({ atMs: at - 500, initiativeId: "b", source: "traffic" });
    enqueueFoxInitiativeV1({ significance: 0.85, source: "news", reason: "test" });
    const gate = canFoxProactiveInitiateV1(at, { significance: 0.85 });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("hourly_limit");
  });

  it("blocks when cooldown active", () => {
    const at = Date.now();
    recordFoxProactiveInitiationV1({ atMs: at - 60_000, initiativeId: "a", source: "news" });
    enqueueFoxInitiativeV1({ significance: 0.88, source: "news", reason: "test" });
    const gate = canFoxProactiveInitiateV1(at, { significance: 0.88 });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("cooldown");
  });

  it("builds source-specific proactive utterance", () => {
    expect(buildFoxProactiveUtteranceV1({ source: "traffic", significance: 0.8 })).toContain("Trafik");
    expect(buildFoxProactiveUtteranceV1({ source: "news", significance: 0.8 })).toContain("gelişme");
  });

  it("dryRun plans initiative without speaking", () => {
    enqueueFoxInitiativeV1({
      significance: 0.82,
      source: "news",
      reason: "high_significance_and_world_salience"
    });
    const plan = runFoxProactiveChannelTickV1({
      traceId: "test_proactive",
      dryRun: true,
      userFocused: false
    });
    expect(plan.ok).toBe(true);
    expect(plan.phrase).toBeTruthy();
    expect(plan.pauseMs).toBeGreaterThan(0);
    expect(plan.initiativeId).toBeTruthy();
  });

  it("budget snapshot reflects defaults", () => {
    const snap = getFoxProactiveBudgetSnapshotV1(Date.now(), FOX_PROACTIVE_BUDGET_DEFAULT_V1);
    expect(snap.maxInitiationsPerHour).toBe(2);
    expect(snap.cooldownMinutes).toBe(20);
    expect(snap.dailyLimit).toBe(10);
  });
});

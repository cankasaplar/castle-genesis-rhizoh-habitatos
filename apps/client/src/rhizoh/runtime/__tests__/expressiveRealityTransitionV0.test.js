import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildExpressiveRealityTransitionPlanV0,
  extractPalAnchorFromLifeProjectionV0,
  resetExpressiveRealityTransitionSessionV0,
  RTL_PHASE_ENTRY_V0,
  RTL_PHASE_MAP_REVEAL_V0,
  runExpressiveRealityTransitionV0,
  shouldRunExpressiveRealityTransitionV0
} from "../expressiveRealityTransitionV0.js";

describe("expressiveRealityTransitionV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    resetExpressiveRealityTransitionSessionV0();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetExpressiveRealityTransitionSessionV0();
  });

  it("extracts PAL memory anchor from projection bundle", () => {
    const anchor = extractPalAnchorFromLifeProjectionV0({
      projections: [
        {
          projection_kind: "map_pin",
          label: "Metehan Kale",
          location: { lat: 39.9, lon: 32.8, place_name: "Ankara" },
          activation: { visible: true, stage: "anchored" }
        }
      ]
    });
    expect(anchor.visible).toBe(true);
    expect(anchor.label).toContain("Ankara");
    expect(anchor.memory_anchor).toContain("Bağlandığın yer");
  });

  it("builds phased transition plan", () => {
    const plan = buildExpressiveRealityTransitionPlanV0({
      threadId: "thr_rtl",
      lifeEntityProjection: {
        projections: [
          {
            projection_kind: "map_pin",
            label: "Castle",
            location: { place_name: "Istanbul street" },
            activation: { visible: false, stage: "hinted" }
          }
        ]
      }
    });
    expect(plan.experience_state).toBe("E2-X");
    expect(plan.phases[0].id).toBe(RTL_PHASE_ENTRY_V0);
    expect(plan.phases.some((p) => p.id === RTL_PHASE_MAP_REVEAL_V0)).toBe(true);
    expect(plan.thread_id).toBe("thr_rtl");
  });

  it("runs sequence and completes", async () => {
    const phases = [];
    await new Promise((resolve) => {
      const plan = buildExpressiveRealityTransitionPlanV0({});
      runExpressiveRealityTransitionV0(plan, {
        onPhase: (p) => phases.push(p.id),
        onComplete: () => resolve(null)
      });
    });
    expect(phases.length).toBeGreaterThan(3);
    expect(phases[phases.length - 1]).toBe("complete");
  });

  it("shouldRun is false after session complete", async () => {
    vi.useFakeTimers();
    expect(shouldRunExpressiveRealityTransitionV0()).toBe(true);
    const plan = buildExpressiveRealityTransitionPlanV0({});
    runExpressiveRealityTransitionV0(plan, { onComplete: () => {} });
    await vi.runAllTimersAsync();
    expect(shouldRunExpressiveRealityTransitionV0()).toBe(false);
    vi.useRealTimers();
  });
});

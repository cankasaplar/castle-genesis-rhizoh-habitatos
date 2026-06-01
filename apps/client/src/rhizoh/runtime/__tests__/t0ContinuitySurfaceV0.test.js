import { describe, it, expect } from "vitest";
import {
  buildT0ContinuitySurfaceObservationV0,
  T0_CONTINUITY_SURFACE_DEFINITION_V0,
  T0_PRODUCT_CORE_NO_EMPTY_RESTORE_V0,
  T0_SOFT_AFFORDANCES_V0
} from "../t0ContinuitySurfaceV0.js";

describe("t0ContinuitySurfaceV0", () => {
  it("locks T0 definition and no-empty-restore principle", () => {
    expect(T0_CONTINUITY_SURFACE_DEFINITION_V0).toMatch(/Continuity Surface/i);
    expect(T0_PRODUCT_CORE_NO_EMPTY_RESTORE_V0).toMatch(/never returns to an empty screen/i);
  });

  it("exposes three soft affordances across worlds", () => {
    expect(T0_SOFT_AFFORDANCES_V0.length).toBe(3);
    const worlds = new Set(T0_SOFT_AFFORDANCES_V0.map((a) => a.world));
    expect(worlds.has("narrative")).toBe(true);
    expect(worlds.has("real_world")).toBe(true);
  });

  it("buildT0ContinuitySurfaceObservation is observation-only", () => {
    const obs = buildT0ContinuitySurfaceObservationV0();
    expect(obs.observation_only).toBe(true);
    expect(obs.always_on).toContain("chat");
  });
});

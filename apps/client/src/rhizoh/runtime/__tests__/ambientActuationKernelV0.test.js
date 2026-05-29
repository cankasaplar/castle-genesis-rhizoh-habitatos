import { describe, it, expect } from "vitest";
import {
  computeExecutionCommandHashV0,
  stampExecutionCommandHashV0
} from "../executionCommandHashV0.js";
import { validateExecutionCommandV0 } from "../validateExecutionCommandV0.js";
import { executionRouterV0 } from "../executionRouterV0.js";

function baseCmd(over = {}) {
  return {
    namespace: "LIGHT_ACTUATOR",
    type: "SET_STATE",
    lane: "observer",
    provenance: { locked: true, source: "test" },
    payload: { x: 1 },
    ...over
  };
}

describe("executionCommandHashV0 + validateExecutionCommandV0", () => {
  it("same basis → same hash", () => {
    const a = computeExecutionCommandHashV0(baseCmd());
    const b = computeExecutionCommandHashV0(baseCmd());
    expect(a).toBe(b);
  });

  it("lane change changes hash", () => {
    const a = computeExecutionCommandHashV0(baseCmd({ lane: "observer" }));
    const b = computeExecutionCommandHashV0(baseCmd({ lane: "active" }));
    expect(a).not.toBe(b);
  });

  it("stampExecutionCommandHashV0 produces passing validateExecutionCommandV0", () => {
    const stamped = stampExecutionCommandHashV0(baseCmd());
    const v = validateExecutionCommandV0(stamped);
    expect(v).not.toBe(false);
    expect(/** @type {{ executionValidated?: boolean }} */ (v).executionValidated).toBe(true);
  });

  it("validate fails without locked provenance", () => {
    const stamped = stampExecutionCommandHashV0(
      baseCmd({ provenance: { locked: false, source: "x" } })
    );
    expect(validateExecutionCommandV0(stamped)).toBe(false);
  });

  it("validate fails without lane", () => {
    const stamped = stampExecutionCommandHashV0(baseCmd({ lane: "" }));
    expect(validateExecutionCommandV0(stamped)).toBe(false);
  });

  it("validate fails on hash tamper", () => {
    const stamped = stampExecutionCommandHashV0(baseCmd());
    expect(validateExecutionCommandV0({ ...stamped, executionHash: "hdeadbeef" })).toBe(false);
  });
});

describe("executionRouterV0", () => {
  it("routes LIGHT_ACTUATOR", () => {
    const out = executionRouterV0({
      namespace: "LIGHT_ACTUATOR",
      power: 1,
      color: "#ffeedd",
      brightness: 0.7,
      transition: 200
    });
    expect(out).toEqual({
      power: 1,
      color: "#ffeedd",
      brightness: 0.7,
      transition: 200,
      temperature: undefined
    });
  });

  it("routes MEDIA_ACTUATOR for OPEN_YOUTUBE_LIVE", () => {
    const out = executionRouterV0({
      namespace: "MEDIA_ACTUATOR",
      type: "OPEN_YOUTUBE_LIVE"
    });
    expect(out).toEqual({
      target: "SMART_TV",
      action: "OPEN_URL",
      payload: "https://www.youtube.com/@CastleGenesis/live"
    });
  });

  it("MEDIA_ACTUATOR ignores non-matching type", () => {
    expect(
      executionRouterV0({
        namespace: "MEDIA_ACTUATOR",
        type: "OTHER"
      })
    ).toBeNull();
  });

  it("unknown namespace → null", () => {
    expect(executionRouterV0({ namespace: "UNKNOWN" })).toBeNull();
  });
});

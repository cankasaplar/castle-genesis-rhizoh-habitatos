import { describe, expect, it, beforeEach } from "vitest";
import {
  clearEpistemicReturnFieldForTestV0,
  evaluateEpistemicReturnFieldV0,
  EPISTEMIC_RETURN_MODE_V0,
  setEpistemicReturnModeV0
} from "../epistemicReturnFieldV0.js";
import { clearObserverTraceForTestV0, observeV0 } from "../observerReadOnlyHookV0.js";
import { clearVisitorEpistemicTraceForTestV0, recordVisitorSurfaceV0 } from "../visitorEpistemicTraceV0.js";

describe("epistemicReturnFieldV0", () => {
  beforeEach(() => {
    clearEpistemicReturnFieldForTestV0();
    clearObserverTraceForTestV0();
    clearVisitorEpistemicTraceForTestV0();
    setEpistemicReturnModeV0(EPISTEMIC_RETURN_MODE_V0.EPISTEMIC_FAMILIARITY);
  });

  it("returns statistical continuity without memory", () => {
    observeV0({ type: "map_hover", target: "pin", meta: { surface: "map", focus: 0.5 } });
    recordVisitorSurfaceV0("map");

    const result = evaluateEpistemicReturnFieldV0();
    expect(result.memory).toBe(false);
    expect(result.continuity).toBe("none");
    expect(result.fingerprint.isMemory).toBe(false);
  });

  it("strict anonymous mode suppresses familiarity", () => {
    setEpistemicReturnModeV0(EPISTEMIC_RETURN_MODE_V0.STRICT_ANONYMOUS);
    observeV0({ type: "map_hover", target: "pin", meta: { surface: "map", focus: 0.5 } });

    const result = evaluateEpistemicReturnFieldV0();
    expect(result.familiarity).toBe(0);
    expect(result.recognition).toBe("none");
    expect(result.continuity).toBe("none");
  });

  it("increases familiarity on recurring pattern", () => {
    observeV0({ type: "map_hover", target: "pin", meta: { surface: "map", focus: 0.6 } });
    recordVisitorSurfaceV0("map");
    const first = evaluateEpistemicReturnFieldV0();

    observeV0({ type: "map_hover", target: "pin", meta: { surface: "map", focus: 0.6 } });
    const second = evaluateEpistemicReturnFieldV0({ sessions: 2, path: ["map"] });

    expect(second.familiarity).toBeGreaterThanOrEqual(first.familiarity);
    expect(second.memory).toBe(false);
  });
});

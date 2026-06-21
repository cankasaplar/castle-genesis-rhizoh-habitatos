import { describe, expect, it } from "vitest";
import {
  detectEpistemicEchoLoopV0,
  isEpistemicConsumeOnlyPassV0,
  runEpistemicConsumeOnlyPassV0
} from "../epistemicInvocationGuardV0.js";
import { observeV0, clearObserverTraceForTestV0 } from "../observerReadOnlyHookV0.js";

describe("epistemicInvocationGuardV0", () => {
  it("detects observer amplification as echo loop", () => {
    const echo = detectEpistemicEchoLoopV0({ observerCountBefore: 2, observerCountAfter: 5 });
    expect(echo.echoLoopDetected).toBe(true);
    expect(echo.attentionShapingRisk).toBe("elevated");
  });

  it("blocks observe during consume-only pass", () => {
    clearObserverTraceForTestV0();
    runEpistemicConsumeOnlyPassV0(() => {
      expect(isEpistemicConsumeOnlyPassV0()).toBe(true);
      const blocked = observeV0({ type: "map_hover", target: "x", meta: { surface: "map" } });
      expect(blocked.rejected).toBe(true);
      expect(blocked.reason).toBe("invocation_asymmetry");
    }, 0);
    expect(isEpistemicConsumeOnlyPassV0()).toBe(false);
  });
});

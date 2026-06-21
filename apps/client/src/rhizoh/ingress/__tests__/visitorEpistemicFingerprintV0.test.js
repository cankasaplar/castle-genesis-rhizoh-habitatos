import { describe, expect, it, beforeEach } from "vitest";
import { observeV0, clearObserverTraceForTestV0 } from "../observerReadOnlyHookV0.js";
import { buildVisitorEpistemicFingerprintV0 } from "../visitorEpistemicFingerprintV0.js";

describe("visitorEpistemicFingerprintV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
  });

  it("reconstructs attention pattern from observer trace", () => {
    observeV0({ type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.4 } });
    observeV0({ type: "chess_arena_open", target: "arena", meta: { surface: "chess", focus: 0.3 } });

    const fp = buildVisitorEpistemicFingerprintV0({
      visitor: { path: ["map", "chess"], sessions: 1, return_probability: 0.2 }
    });

    expect(fp.session_signature).toMatch(/^eps_/);
    expect(fp.attention_pattern.map).toBeGreaterThan(0);
    expect(fp.attention_pattern.chess).toBeGreaterThan(0);
    expect(fp.isMemory).toBe(false);
    expect(fp.reconstructionOnly).toBe(true);
  });
});

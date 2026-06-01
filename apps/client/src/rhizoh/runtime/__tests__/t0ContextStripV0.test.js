import { describe, it, expect, beforeEach } from "vitest";
import {
  inferT0UserIntentFromSurfaceV0,
  resolveT0ContextStripV0,
  resolveT0SurfaceForIntentV0,
  T0_INTENT_CONNECT_V0,
  T0_INTENT_PRODUCE_V0,
  writeT0UserIntentV0
} from "../t0ContextStripV0.js";

describe("t0ContextStripV0", () => {
  beforeEach(() => {
    try {
      sessionStorage.removeItem("rhizoh.t0.user_intent.v0");
    } catch {
      /* ignore */
    }
  });

  it("resolves exploration strip for world surface", () => {
    const ctx = resolveT0ContextStripV0({ activeSurface: "world", userIntent: "explore" });
    expect(ctx.strip).toMatch(/Keşif|Exploration/i);
    expect(ctx.intent).toBe("explore");
  });

  it("resolves creative studio strip when producing", () => {
    const ctx = resolveT0ContextStripV0({
      activeSurface: "studio",
      userIntent: T0_INTENT_PRODUCE_V0,
      creativeEnabled: true,
      expressiveMode: "E2-X"
    });
    expect(ctx.strip).toMatch(/Üretim|Creative/i);
    expect(ctx.strip).toMatch(/Stüdyo|Studio/i);
  });

  it("maps intent to surface", () => {
    expect(resolveT0SurfaceForIntentV0(T0_INTENT_CONNECT_V0)).toBe("broadcast");
    expect(resolveT0SurfaceForIntentV0(T0_INTENT_PRODUCE_V0)).toBe("studio");
  });

  it("persists user intent in session", () => {
    writeT0UserIntentV0(T0_INTENT_CONNECT_V0);
    expect(inferT0UserIntentFromSurfaceV0("world")).toBe(T0_INTENT_CONNECT_V0);
  });
});

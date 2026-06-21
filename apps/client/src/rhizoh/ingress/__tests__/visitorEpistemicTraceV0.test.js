import { describe, expect, it, beforeEach } from "vitest";
import {
  clearVisitorEpistemicTraceForTestV0,
  getVisitorEpistemicTraceV0,
  recordVisitorSurfaceV0
} from "../visitorEpistemicTraceV0.js";

describe("visitorEpistemicTraceV0", () => {
  beforeEach(() => {
    clearVisitorEpistemicTraceForTestV0();
  });

  it("records path without treating as memory", () => {
    recordVisitorSurfaceV0("invite");
    recordVisitorSurfaceV0("map");
    recordVisitorSurfaceV0("chess");
    const t = getVisitorEpistemicTraceV0();
    expect(t.visitor_session).toBe("anonymous");
    expect(t.path).toEqual(["invite", "map", "chess"]);
    expect(t.isMemory).toBe(false);
    expect(t.interpretationOnly).toBe(true);
    expect(t.engagement_vector).toBeGreaterThan(0);
  });

  it("dedupes consecutive same surface", () => {
    recordVisitorSurfaceV0("map");
    recordVisitorSurfaceV0("map");
    expect(getVisitorEpistemicTraceV0().path).toEqual(["map"]);
  });
});

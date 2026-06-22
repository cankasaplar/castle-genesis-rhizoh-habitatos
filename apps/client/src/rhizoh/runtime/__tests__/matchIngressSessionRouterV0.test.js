import { describe, it, expect } from "vitest";
import { parseMatchSessionFromLocationV0, buildMatchSessionShareUrlV0 } from "../matchIngressSessionRouterV0.js";

describe("matchIngressSessionRouterV0", () => {
  it("parses /match/:id path", () => {
    const p = parseMatchSessionFromLocationV0("https://rhizoh.com/match/sess_abc?role=player&playerId=u1");
    expect(p?.sessionId).toBe("sess_abc");
    expect(p?.role).toBe("player");
    expect(p?.source).toBe("path");
  });

  it("builds share url with session id", () => {
    if (typeof window === "undefined") return;
    const url = buildMatchSessionShareUrlV0({ sessionId: "sess_xyz" });
    expect(url).toContain("/match/sess_xyz");
  });
});

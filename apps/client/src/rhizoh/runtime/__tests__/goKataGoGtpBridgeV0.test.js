import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetGoKataGoGtpBridgeForTestV0,
  getGoKataGoEngineStatusV0,
  isGoKataGoGtpConfiguredV0,
  parseKataGoGtpAnalyzeLineV0,
  resolveGoKataGoGtpEndpointV0,
  resolveKataGoConfidenceFromAnalysisV0,
  xyToGoGtpCoordV0
} from "../goKataGoGtpBridgeV0.js";
import { listGoArenaStonesV0, resetGoArenaEngineForTestV0, applyGoArenaMoveV0 } from "../goArenaEngineV0.js";

describe("goKataGoGtpBridgeV0", () => {
  beforeEach(() => {
    __resetGoKataGoGtpBridgeForTestV0();
  });

  it("reports not_configured without env endpoint", () => {
    expect(resolveGoKataGoGtpEndpointV0()).toBeNull();
    expect(isGoKataGoGtpConfiguredV0()).toBe(false);
    expect(getGoKataGoEngineStatusV0()).toBe("not_configured");
  });

  it("maps grid coords to GTP (skip column i)", () => {
    expect(xyToGoGtpCoordV0(0, 0, 19)).toBe("a19");
    expect(xyToGoGtpCoordV0(8, 0, 19)).toBe("j19");
    expect(xyToGoGtpCoordV0(0, 18, 19)).toBe("a1");
  });

  it("parses kata analyze JSON lines", () => {
    const info = parseKataGoGtpAnalyzeLineV0(
      'info move Q16 visits 120 winrate 0.62 pv Q16 D4 {"winrate":0.62,"visits":120,"move":"Q16","pv":["Q16","D4"]}'
    );
    expect(info?.winrate).toBe(0.62);
    expect(info?.visits).toBe(120);
    expect(info?.bestMove).toBe("Q16");
  });

  it("maps winrate to confidence", () => {
    expect(resolveKataGoConfidenceFromAnalysisV0({ winrate: 0.62 })).toBe(0.62);
    expect(resolveKataGoConfidenceFromAnalysisV0({ winrate: null })).toBeNull();
  });
});

describe("goArenaEngineV0 kata export", () => {
  beforeEach(() => {
    resetGoArenaEngineForTestV0();
  });

  it("lists stones after demo moves", () => {
    applyGoArenaMoveV0({ x: 3, y: 3 });
    applyGoArenaMoveV0({ x: 4, y: 4 });
    expect(listGoArenaStonesV0()).toHaveLength(2);
    expect(listGoArenaStonesV0()[0].color).toBe("B");
  });
});

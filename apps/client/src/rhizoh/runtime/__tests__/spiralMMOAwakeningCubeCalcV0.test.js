import { describe, expect, it } from "vitest";
import {
  deriveSpiralMMOAwakeningCubeSpecV0,
  spiralMMOAwakeningCubeHtmlV0
} from "../spiralMMOAwakeningCubeCalcV0.js";

describe("spiralMMOAwakeningCubeCalcV0", () => {
  it("derives cube spec from route + seed", () => {
    const spec = deriveSpiralMMOAwakeningCubeSpecV0({
      colorClass: "blue",
      srcContinent: "europe",
      destContinent: "africa",
      routeLengthPct: 32,
      batchIndex: 1,
      isOrder: true,
      cycleSeed: 42
    });
    expect(spec.sizePx).toBeGreaterThan(24);
    expect(spec.renderScaleFactor).toBeGreaterThan(1);
    expect(spec.durationMs).toBeGreaterThan(2000);
    expect(spec.glowBlur).toBeGreaterThan(5);
    expect(spec.shadowBlur).toBeGreaterThan(3);
    expect(["rotateY", "rotateX", "rotateZ", "rotate3d"]).toContain(spec.axisType);
  });

  it("renders cube html with spin keyframes", () => {
    const spec = deriveSpiralMMOAwakeningCubeSpecV0({
      colorClass: "mirror",
      srcContinent: "asia",
      destContinent: "oceania",
      routeLengthPct: 20,
      batchIndex: 0,
      isOrder: false,
      cycleSeed: 99
    });
    const built = spiralMMOAwakeningCubeHtmlV0(spec);
    expect(built.html).toContain("rhizoh-spiral-flight-cube");
    expect(built.spinKeyframes).toContain("@keyframes");
  });
});

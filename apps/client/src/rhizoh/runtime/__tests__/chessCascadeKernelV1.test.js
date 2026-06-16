import { describe, expect, it } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import { reconcileCatchUpV1 } from "../../../core/cascadeReconciliationKernelV1.js";
import { deviceNeutralClockV1 } from "../../../core/deviceNeutralClockV1.js";
import { listSpiralPinFieldV1 } from "../../../core/spiralPinFieldV1.js";

describe("chessArenaEngineV0 UCI moves", () => {
  it("accepts Stockfish UCI e2e4", () => {
    const game = createChessArenaGameV0();
    const result = game.tryMove("e2e4");
    expect(result.ok).toBe(true);
    expect(result.move.san).toBe("e4");
  });
});

describe("cascadeReconciliationKernelV1", () => {
  it("reconcileCatchUpV1 produces parity layers", () => {
    const out = reconcileCatchUpV1([], 1, 4, 99821);
    expect(out.parity).toBe(true);
    expect(out.missingTicks).toBe(3);
    expect(out.cascade.length).toBe(3);
  });

  it("deviceNeutralClockV1 is stable", () => {
    expect(deviceNeutralClockV1(10, 0)).toBe(10);
    expect(deviceNeutralClockV1(10, 1)).toBe(9);
  });
});

describe("spiralPinFieldV1", () => {
  it("lists spiral anchors with emit contracts", () => {
    const pins = listSpiralPinFieldV1();
    expect(pins.length).toBeGreaterThan(0);
    expect(pins[0].type).toBe("SPIRAL_ANCHOR");
    expect(pins[0].emits).toContain("GHOST_SPAWN");
  });
});

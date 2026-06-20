import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetShadowCastleEventBusForTestV0,
  readShadowCastleEventRingV0,
  SHADOW_CASTLE_EVENT_TYPE_V0
} from "../shadowCastleEventBusV0.js";
import {
  __resetShadowChessUglBridgeForTestV0,
  bridgeUglEventToShadowCastleV0,
  demoChessShadowMoveEmitV0,
  emitShadowCastleEventFromUglV0,
  installShadowChessUglBridgeV0
} from "../shadowChessUglBridgeV0.js";
import {
  __resetShadowDataPlaneLoopForTestV0,
  demoChessShadowMoveV0,
  inspectShadowDataPlaneV0,
  startShadowDataPlaneLoopV0,
  stopShadowDataPlaneLoopV0
} from "../shadowDataPlaneLoopV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "../rhizohUglSchemaV0.js";

describe("shadowChessUglBridgeV0", () => {
  beforeEach(() => {
    __resetShadowCastleEventBusForTestV0();
    __resetShadowChessUglBridgeForTestV0();
    __resetShadowDataPlaneLoopForTestV0();
  });

  it("bridgeUglEventToShadowCastleV0 maps chess UGL move to shadow envelope", () => {
    const row = bridgeUglEventToShadowCastleV0({
      schema: "castle.rhizoh.ugl_event.v0",
      meta: { gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS, matchId: "m1", source: "arena_move" },
      a: { payload: { san: "e4" } },
      r: { total: 0.4 }
    });
    expect(row?.type).toBe(SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_MOVE);
    expect(row?.fromCastleId).toBe("my_castle");
    expect(row?.payload.san).toBe("e4");
  });

  it("ignores non-chess UGL events", () => {
    const row = bridgeUglEventToShadowCastleV0({
      meta: { gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS }
    });
    expect(row).toBeNull();
  });

  it("demoChessShadowMoveEmitV0 emits chess.move on shadow bus", () => {
    const event = demoChessShadowMoveEmitV0({ san: "Bb5" });
    expect(event?.type).toBe(SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_MOVE);
    expect(readShadowCastleEventRingV0(4)).toHaveLength(1);
  });

  it("demoChessShadowMoveV0 returns trace and pulseRemainingMs when loop active", () => {
    startShadowDataPlaneLoopV0();
    const out = demoChessShadowMoveV0({ san: "Qh5", flyToPeer: false });
    stopShadowDataPlaneLoopV0();
    expect(out.ok).toBe(true);
    expect(out.trace?.interpreted?.meaning).toContain("chess");
    expect(out.pulseRemainingMs).toBeGreaterThan(0);
    expect(out.inspect.lastReaction?.pulseActive).toBe(true);
  });

  it("installShadowChessUglBridgeV0 forwards UGL events when loop active", () => {
    startShadowDataPlaneLoopV0();
    installShadowChessUglBridgeV0();
    emitShadowCastleEventFromUglV0({
      schema: "castle.rhizoh.ugl_event.v0",
      meta: { gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS, matchId: "m2", source: "cluster_move" },
      a: { payload: { san: "Qh5" } },
      r: { total: 0.7 }
    });
    const inspect = inspectShadowDataPlaneV0();
    stopShadowDataPlaneLoopV0();
    expect(inspect.phase).toBe("B_soft");
    expect(inspect.lastTrace?.event.type).toBe(SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_MOVE);
    expect(inspect.chessBridge.installed).toBe(true);
  });
});

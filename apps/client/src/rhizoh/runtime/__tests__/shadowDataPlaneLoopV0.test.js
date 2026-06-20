import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  __resetShadowCastleEventBusForTestV0,
  emitShadowCastleEventV0,
  SHADOW_CASTLE_EVENT_TYPE_V0
} from "../shadowCastleEventBusV0.js";
import {
  __resetShadowDataPlaneLoopForTestV0,
  demoCastleToCastleEventLoopV0,
  inspectShadowDataPlaneV0,
  interpretShadowCastleEventV0,
  PEER_CASTLE_SIM_ID_V0,
  processShadowCastleEventV0,
  projectShadowCastleReactionV0,
  SHADOW_CASTLE_PIN_PULSE_EVENT_V0,
  SHADOW_CASTLE_REACTION_EVENT_V0,
  startShadowDataPlaneLoopV0,
  stopShadowDataPlaneLoopV0
} from "../shadowDataPlaneLoopV0.js";

describe("shadowDataPlaneLoopV0", () => {
  beforeEach(() => {
    __resetShadowDataPlaneLoopForTestV0();
    __resetShadowCastleEventBusForTestV0();
  });

  it("interpretShadowCastleEventV0 maps resource discovery to positive_discovery", () => {
    const interpreted = interpretShadowCastleEventV0({
      type: SHADOW_CASTLE_EVENT_TYPE_V0.RESOURCE_DISCOVERED,
      payload: { scalar: 0.9 }
    });
    expect(interpreted.meaning).toBe("positive_discovery");
    expect(interpreted.interpretationOnly).toBe(true);
    expect(interpreted.uglRoute.domainId).toBe("chess");
  });

  it("processShadowCastleEventV0 projects pin pulse reaction", () => {
    const pulseHandler = vi.fn();
    const reactionHandler = vi.fn();
    window.addEventListener(SHADOW_CASTLE_PIN_PULSE_EVENT_V0, pulseHandler);
    window.addEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, reactionHandler);

    const event = emitShadowCastleEventV0({
      type: SHADOW_CASTLE_EVENT_TYPE_V0.RESOURCE_DISCOVERED,
      fromCastleId: "origin_home_serencebey",
      toCastleId: PEER_CASTLE_SIM_ID_V0,
      payload: { resourceId: "crystal_alpha", scalar: 0.8 }
    });
    const trace = processShadowCastleEventV0(event);

    window.removeEventListener(SHADOW_CASTLE_PIN_PULSE_EVENT_V0, pulseHandler);
    window.removeEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, reactionHandler);

    expect(trace.reaction.toCastleId).toBe(PEER_CASTLE_SIM_ID_V0);
    expect(trace.reaction.mapPinPulse.pinId).toBe(PEER_CASTLE_SIM_ID_V0);
    expect(pulseHandler).toHaveBeenCalled();
    expect(reactionHandler).toHaveBeenCalled();
  });

  it("demoCastleToCastleEventLoopV0 runs A→interpret→B chain once with loop started", () => {
    startShadowDataPlaneLoopV0();
    const out = demoCastleToCastleEventLoopV0();
    stopShadowDataPlaneLoopV0();
    expect(out.ok).toBe(true);
    expect(out.inspect.lastTrace?.interpreted.meaning).toBe("positive_discovery");
    expect(out.inspect.activePinPulses.length).toBeGreaterThan(0);
  });

  it("projectShadowCastleReactionV0 never grants reality mutation", () => {
    const interpreted = interpretShadowCastleEventV0({
      type: SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_ECHO,
      payload: {}
    });
    const reaction = projectShadowCastleReactionV0(interpreted, {
      eventId: "e1",
      fromCastleId: "origin_home_serencebey",
      toCastleId: PEER_CASTLE_SIM_ID_V0
    });
    expect(reaction.realityMutationPermitted).toBe(false);
    expect(reaction.nonExecutive).toBe(true);
  });

  it("inspectShadowDataPlaneV0 exposes phase A snapshot", () => {
    const snap = inspectShadowDataPlaneV0();
    expect(snap.phase).toBe("A_shadow");
    expect(snap.peerSim.id).toBe(PEER_CASTLE_SIM_ID_V0);
  });

  it("startShadowDataPlaneLoopV0 upgrades to B_soft with chess bridge", () => {
    startShadowDataPlaneLoopV0();
    const snap = inspectShadowDataPlaneV0();
    stopShadowDataPlaneLoopV0();
    expect(snap.phase).toBe("B_soft");
    expect(snap.chessBridge.installed).toBe(true);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  __resetShadowCastleEventBusForTestV0,
  buildShadowCastleEventV0,
  emitShadowCastleEventV0,
  readShadowCastleEventRingV0,
  SHADOW_CASTLE_BUS_EVENT_V0,
  SHADOW_CASTLE_EVENT_TYPE_V0
} from "../shadowCastleEventBusV0.js";

describe("shadowCastleEventBusV0", () => {
  beforeEach(() => {
    __resetShadowCastleEventBusForTestV0();
  });

  it("buildShadowCastleEventV0 stamps read-only shadow envelope", () => {
    const event = buildShadowCastleEventV0({
      type: SHADOW_CASTLE_EVENT_TYPE_V0.RESOURCE_DISCOVERED,
      fromCastleId: "origin_home_serencebey",
      toCastleId: "peer_castle_sim_istanbul",
      payload: { resourceId: "crystal_alpha", scalar: 0.7 }
    });
    expect(event.schema).toContain("shadow_event_bus");
    expect(event.type).toBe("resource.discovered.v0");
    expect(event.meta.readOnly).toBe(true);
    expect(event.meta.realityMutationPermitted).toBe(false);
  });

  it("emitShadowCastleEventV0 appends to ring and dispatches bus event", () => {
    const handler = vi.fn();
    window.addEventListener(SHADOW_CASTLE_BUS_EVENT_V0, handler);
    const event = emitShadowCastleEventV0({
      type: SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_ECHO,
      fromCastleId: "origin_home_serencebey"
    });
    window.removeEventListener(SHADOW_CASTLE_BUS_EVENT_V0, handler);
    expect(event.eventId).toBeTruthy();
    expect(readShadowCastleEventRingV0(4)).toHaveLength(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

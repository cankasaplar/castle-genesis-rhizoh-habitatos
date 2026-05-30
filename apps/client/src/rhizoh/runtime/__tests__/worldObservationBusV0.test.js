import { describe, expect, it, beforeEach } from "vitest";
import {
  clearWorldObservationRingForTestV0,
  getWorldObservationRingV0,
  publishWorldObservationV0,
  subscribeWorldObservationV0
} from "../worldObservationBusV0.js";

describe("worldObservationBusV0", () => {
  beforeEach(() => {
    clearWorldObservationRingForTestV0();
  });

  it("publish appends to ring and notifies subscribers", () => {
    const seen = [];
    subscribeWorldObservationV0((row) => seen.push(row.type));
    publishWorldObservationV0({ type: "world.tick", payload: { simTime: 1.2, activeCount: 3 } });
    expect(getWorldObservationRingV0()).toHaveLength(1);
    expect(seen).toEqual(["world.tick"]);
  });
});

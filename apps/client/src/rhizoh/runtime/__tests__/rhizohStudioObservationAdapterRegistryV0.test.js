import { describe, expect, it } from "vitest";
import {
  STUDIO_OBSERVATION_ADAPTER_SCHEMA_V0,
  STUDIO_OBSERVATION_ADAPTER_KIND_V0,
  buildStudioObservationAdapterFrameV0,
  getStudioObservationAdapterRegistrySnapshotV0,
  listStudioObservationAdapterIdsV0
} from "../rhizohStudioObservationAdapterRegistryV0.js";
import { STUDIO_EIGHT_CAMERA_IDS_V0 } from "../rhizohStudioVisibilitySnapshotV0.js";

describe("rhizohStudioObservationAdapterRegistryV0", () => {
  it("lists eight camera adapter ids", () => {
    expect(listStudioObservationAdapterIdsV0()).toEqual([...STUDIO_EIGHT_CAMERA_IDS_V0]);
  });

  it("builds chess visual arena frame with consumer ready", () => {
    const frame = buildStudioObservationAdapterFrameV0("chess_arena");
    expect(frame.kind).toBe(STUDIO_OBSERVATION_ADAPTER_KIND_V0.VISUAL_ARENA);
    expect(frame.consumerReady).toBe(true);
    expect(frame).toHaveProperty("movesSeen");
  });

  it("builds spatial held placeholder", () => {
    const frame = buildStudioObservationAdapterFrameV0("spatial");
    expect(frame.kind).toBe(STUDIO_OBSERVATION_ADAPTER_KIND_V0.HELD_PLACEHOLDER);
    expect(frame.legalHold).toBe(true);
    expect(frame.consumerReady).toBe(true);
  });

  it("returns full registry snapshot with all adapters hydrated", () => {
    const reg = getStudioObservationAdapterRegistrySnapshotV0();
    expect(reg.schema).toBe(STUDIO_OBSERVATION_ADAPTER_SCHEMA_V0);
    expect(reg.hydrated).toBe(true);
    expect(reg.adapterCount).toBe(8);
    expect(reg.consumerReadyCount).toBe(8);
    expect(Object.keys(reg.adapters).sort()).toEqual([...STUDIO_EIGHT_CAMERA_IDS_V0].sort());
    expect(reg.webGpuNote).toContain("WebGPU");
  });
});

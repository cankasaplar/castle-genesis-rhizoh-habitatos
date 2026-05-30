import { describe, it, expect } from "vitest";
import {
  PRESENCE_INFERENCE_NOT_IDENTITY_TRUTH_V0,
  SPATIAL_LAYERS_V0,
  RHIZOH_EMBODIMENT_STANCE_V0
} from "../spatialPresenceConstitutionV0.js";
import {
  assertSpatialSensorEffectAllowedV0,
  assertSpatialSensorCannotMutateTargetV0,
  SPATIAL_SENSOR_AIR_GAP_LAW_V0
} from "../spatialSensorAirGapV0.js";
import {
  ROOM_ANCHORS_V0,
  listRoomAnchorsV0,
  getRoomAnchorByIdV0,
  getRoomAnchorByRegistryKeyV0,
  SPATIAL_ANCHOR_REGISTRY_SCHEMA_V0
} from "../spatialAnchorRegistryV0.js";
import {
  validateSpatialObservationHypothesisV0,
  FORBIDDEN_DEFINITIVE_PRESENCE_KEYS_V0
} from "../spatialObservationHypothesisV0.js";

describe("spatialPresenceConstitutionV0", () => {
  it("states presence inference law", () => {
    expect(PRESENCE_INFERENCE_NOT_IDENTITY_TRUTH_V0).toContain("hypothesis");
    expect(SPATIAL_LAYERS_V0.SPATIAL_SENSOR_LAYER).toBe("SPATIAL_SENSOR_LAYER");
    expect(RHIZOH_EMBODIMENT_STANCE_V0.isNot).toContain("NPC");
    expect(RHIZOH_EMBODIMENT_STANCE_V0.isInstead).toContain("spatial_field");
  });
});

describe("spatialSensorAirGapV0", () => {
  it("documents air-gap law", () => {
    expect(SPATIAL_SENSOR_AIR_GAP_LAW_V0).toContain("cannot mutate");
  });

  it("allows only enumerated sensor effects", () => {
    expect(assertSpatialSensorEffectAllowedV0("projection").ok).toBe(true);
    expect(assertSpatialSensorEffectAllowedV0("identity_truth").ok).toBe(false);
  });

  it("rejects forbidden mutation targets", () => {
    expect(assertSpatialSensorCannotMutateTargetV0("epistemic_runtime").ok).toBe(false);
    expect(assertSpatialSensorCannotMutateTargetV0("continuity_memory").ok).toBe(false);
  });
});

describe("spatialAnchorRegistryV0 (PR-4-A0)", () => {
  it("exposes frozen canonical room anchors", () => {
    expect(SPATIAL_ANCHOR_REGISTRY_SCHEMA_V0).toContain("spatialRoomAnchors");
    expect(Object.isFrozen(ROOM_ANCHORS_V0)).toBe(true);
    expect(listRoomAnchorsV0()).toHaveLength(3);
    expect(getRoomAnchorByIdV0("desk-anchor")?.spatialRole).toBe("STUDIO");
    expect(getRoomAnchorByRegistryKeyV0("WINDOW")?.type).toBe("LIGHT_PORTAL");
    expect(getRoomAnchorByIdV0("missing")).toBeNull();
  });
});

describe("spatialObservationHypothesisV0 (PR-4-A1 shape)", () => {
  it("accepts hypothesis-shaped observation", () => {
    const r = validateSpatialObservationHypothesisV0({
      inferredUserZone: "DESK",
      confidence: 0.74,
      provenance: "camera_depth_v0"
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hypothesis.confidence).toBeCloseTo(0.74);
      expect(r.hypothesis.provenance).toBe("camera_depth_v0");
    }
  });

  it("rejects definitive truth smuggling keys", () => {
    const r = validateSpatialObservationHypothesisV0({
      userIsAtDesk: true,
      confidence: 1,
      provenance: "x"
    });
    expect(r.ok).toBe(false);
    expect(FORBIDDEN_DEFINITIVE_PRESENCE_KEYS_V0).toContain("userIsAtDesk");
  });
});

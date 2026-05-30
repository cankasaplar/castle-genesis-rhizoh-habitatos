import { describe, expect, it } from "vitest";
import { resolveRealWorldSpatialBindingReadinessV0 } from "../realWorldSpatialBindingReadinessV0.js";
import {
  buildHighLevelRhizohCapabilityGapsSnapshotV0,
  HIGH_LEVEL_RHIZOH_CAPABILITY_GAPS_SNAPSHOT_SCHEMA_V0
} from "../highLevelRhizohCapabilityGapsSnapshotV0.js";

describe("resolveRealWorldSpatialBindingReadinessV0", () => {
  it("reports low readiness with no world inputs", () => {
    const r = resolveRealWorldSpatialBindingReadinessV0({ symbolicEmbodimentActive: true });
    expect(r.readiness01).toBeLessThan(0.5);
    expect(Array.isArray(r.missing)).toBe(true);
    expect(r.missing.length).toBeGreaterThan(3);
  });

  it("increases readiness when transforms and bounds exist", () => {
    const r = resolveRealWorldSpatialBindingReadinessV0({
      avatarTransformsByUid: { a: { x: 0, y: 0, z: 0, rotY: 0 }, b: { x: 1, y: 0, z: 1, rotY: 0 } },
      roomBounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
      obstacles: [],
      symbolicEmbodimentActive: true
    });
    expect(r.readiness01).toBeGreaterThan(0.5);
    expect(r.avatarTransformCount).toBe(2);
    expect(r.hasRoomBounds).toBe(true);
  });
});

describe("buildHighLevelRhizohCapabilityGapsSnapshotV0", () => {
  it("structures four high-level gap domains", () => {
    const s = buildHighLevelRhizohCapabilityGapsSnapshotV0({
      spatialBindingReadiness: resolveRealWorldSpatialBindingReadinessV0(null),
      ghostPetEmbodimentDrive: { schema: "castle.rhizoh.ghost_pet_social_embodiment_drive.v0" }
    });
    expect(s.schema).toBe(HIGH_LEVEL_RHIZOH_CAPABILITY_GAPS_SNAPSHOT_SCHEMA_V0);
    expect(s.realWorldSpatialBinding.symbolicYawOrOrbitHints).toBe(true);
    expect(s.realWorldSpatialBinding.worldSpaceLookAt).toBe(false);
    expect(s.persistentMultiAgentEcology.globalCoherenceKernel).toBe(true);
    expect(s.studioAutonomy.intentHintsFeedbackAnalytics).toBe(true);
    expect(s.fullSomaticRuntime.expressiveGhostPetDrive).toBe(true);
    expect(s.fullSomaticRuntime.locomotionStateMachine).toBe(false);
    expect(s.fullSomaticRuntime.somaticRoadmapV0?.lookAt?.deferred?.length).toBeGreaterThan(0);
    expect(s.fullSomaticRuntime.somaticRoadmapV0?.locomotionFsm?.missing?.length).toBeGreaterThan(2);
    expect(s.fullSomaticRuntime.somaticRoadmapV0?.multiPetEcology?.deferred).toContain("flocking");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSpatialRegistryFromPositions,
  collectCandidateEntityUids,
  getNeighborBucketIds,
  getSpatialBucketId,
  parseSpatialBucketId
} from "../runtime/spatialRegistry.js";

describe("spatialRegistry v1", () => {
  it("getSpatialBucketId is deterministic for grid coords", () => {
    expect(getSpatialBucketId({ x: 0, y: 0, z: 0 }, 1)).toBe("b:0:0:0");
    expect(getSpatialBucketId({ x: 0.9, y: -0.1, z: -1.2 }, 1)).toBe("b:0:-1:-2");
  });

  it("parseSpatialBucketId round-trips neighbor centers", () => {
    const id = "b:-2:3:0";
    expect(parseSpatialBucketId(id)).toEqual({ gx: -2, gy: 3, gz: 0 });
    expect(getNeighborBucketIds(id).length).toBe(27);
    expect(getNeighborBucketIds(id)).toContain("b:-1:3:0");
  });

  it("collectCandidateEntityUids only sees locality (broad phase)", () => {
    const adjacent = buildSpatialRegistryFromPositions(
      [
        { entityUid: "a", pos: { x: 0, y: 0, z: 0 } },
        { entityUid: "b", pos: { x: 1, y: 0, z: 0 } }
      ],
      0,
      1
    );
    const near = collectCandidateEntityUids(adjacent, { x: 0.2, y: 0, z: 0 }, "a", 1);
    expect(near).toContain("b");
    expect(near).not.toContain("a");

    const distant = buildSpatialRegistryFromPositions(
      [
        { entityUid: "a", pos: { x: 0, y: 0, z: 0 } },
        { entityUid: "b", pos: { x: 50, y: 0, z: 0 } }
      ],
      0,
      1
    );
    const farCandidates = collectCandidateEntityUids(distant, { x: 0.2, y: 0, z: 0 }, "a", 1);
    expect(farCandidates).not.toContain("b");
  });
});

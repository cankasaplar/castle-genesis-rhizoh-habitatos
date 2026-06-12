import { describe, expect, it, vi, beforeEach } from "vitest";
import { GREENROOM_MAIN_HALL_ROOM_UID, ensureGreenRoomMainHallBound } from "../lib/greenRoomRouteBinding";
import { getStudioKernelState, patchIdentity, resetRhizohStudioKernelStore } from "../store/studioStore";
import { ingestPresenceMeshDeltaMaybeWalV0 } from "../store/presenceMeshWalIngressV0";

function seedIdentity() {
  patchIdentity({
    ownerId: "mesh-wal-test-owner",
    actor: { id: "mesh-wal-test-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("presenceMeshWalIngressV0", () => {
  beforeEach(() => {
    resetRhizohStudioKernelStore();
    seedIdentity();
    ensureGreenRoomMainHallBound();
    vi.stubEnv("VITE_WAL_GEOMETRY_INGRESS", "");
  });

  it("falls back to causal-only ingest when WAL gate is off", () => {
    const ev = {
      kind: "delta" as const,
      seq: 1,
      roomUid: "greenroom:main",
      node: {
        id: "mesh:test:1",
        branchId: "main",
        causeIds: ["genesis"],
        tickIndex: 1,
        timestamp: Date.now(),
        payload: { delta: { kind: "avatar.move", avatarUid: "avatar:a", roomUid: "greenroom:main", x: 1, z: 2 } }
      },
      serverAt: Date.now()
    };
    const r = ingestPresenceMeshDeltaMaybeWalV0(ev);
    expect(r.ok).toBe(true);
    expect(r.wal).toBeUndefined();
  });

  it("routes geometry hints through WAL when gate is on", () => {
    vi.stubEnv("VITE_WAL_GEOMETRY_INGRESS", "1");
    const ev = {
      kind: "delta" as const,
      seq: 2,
      roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
      node: {
        id: "mesh:wal:test:2",
        branchId: "main",
        causeIds: ["genesis"],
        tickIndex: 2,
        timestamp: Date.now(),
        payload: {
          delta: {
            discs: [{ x: 1, z: 1, r: 0.8 }]
          }
        }
      },
      serverAt: Date.now()
    };
    const r = ingestPresenceMeshDeltaMaybeWalV0(ev);
    expect(r.ok).toBe(true);
    expect(r.wal?.ok).toBe(true);
    expect(r.wal?.geometryAuthority?.walWroteEpochDirectly).toBe(false);
    const war = getStudioKernelState().worldAuthorityRuntime;
    const roomAuth =
      war?.sealedObstacleByRoomUid?.[GREENROOM_MAIN_HALL_ROOM_UID] ||
      war?.pendingObstaclesByRoomUid?.[GREENROOM_MAIN_HALL_ROOM_UID];
    expect(roomAuth?.discs?.length).toBeGreaterThan(0);
  });
});

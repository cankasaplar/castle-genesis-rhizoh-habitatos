import { beforeEach, describe, expect, it } from "vitest";
import {
  bindArenaEntityV0,
  bindArenasToPlacedCubesV0,
  buildSpatialBindingV0,
  ingestChessMoveArenaEventV0,
  ingestMediaFrameArenaEventV0,
  ingestSportsArenaEventV0,
  mintArenaEntityIdV0,
  registerArenaEntityContinuityV0,
  resetArenaBindingLayerForTestV0,
  resolveCrossArenaIdentityV0,
} from "../arenaBindingLayerV0.js";

describe("arenaBindingLayerV0", () => {
  beforeEach(() => {
    resetArenaBindingLayerForTestV0();
  });

  it("bindArenaEntityV0 creates entity kernel with persistentHash", () => {
    const result = bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "chess-piece-1",
        persistentHash: "hash-abc",
        semanticClass: "cross_epoch_witness_bridge",
      },
      payload: { move: "e4" },
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    expect(result.ok).toBe(true);
    expect(result.entity.entityId).toBe("chess-piece-1");
    expect(result.entity.persistentHash).toBe("hash-abc");
    expect(result.entity.status).toBe("created");
    expect(result.entity.aliases.chess).toBe("chess-piece-1");
    expect(result.entity.semanticClass).toBe("cross_epoch_witness_bridge");
  });

  it("bindArenaEntityV0 merges cross-arena aliases on same persistentHash", () => {
    bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "chess-id",
        persistentHash: "shared-hash",
        semanticClass: "cross_epoch_witness_bridge",
      },
      payload: { move: "Nf3" },
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    const bound = bindArenaEntityV0({
      arenaType: "sports",
      entity: {
        entityId: "sports-id",
        persistentHash: "shared-hash",
        semanticClass: "cross_epoch_witness_bridge",
      },
      payload: { scoreDelta: { home: 1 } },
      epochId: "epoch-1",
      sealRef: "seal-2",
      timestamp: 2000,
    });

    expect(bound.ok).toBe(true);
    expect(bound.entity.status).toBe("bound");
    expect(bound.entity.aliases.chess).toBe("chess-id");
    expect(bound.entity.aliases.sports).toBe("sports-id");

    const resolved = resolveCrossArenaIdentityV0("sports-id");
    expect(resolved?.entityId).toBe(bound.entity.entityId);
    expect(resolved?.aliases).toEqual(
      expect.objectContaining({ chess: "chess-id", sports: "sports-id" }),
    );
  });

  it("ingestChessMoveArenaEventV0 binds move to entity", () => {
    const seeded = bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "piece-1",
        persistentHash: "chess-hash",
        semanticClass: "test",
      },
      payload: {},
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    const result = ingestChessMoveArenaEventV0("Qh5", seeded.entity.entityId);
    expect(result.ok).toBe(true);
    expect(result.entity.status).toBe("bound");
    expect(result.event.payload.move).toBe("Qh5");
    expect(result.event.arenaType).toBe("chess");
  });

  it("ingestSportsArenaEventV0 binds score delta", () => {
    const seeded = bindArenaEntityV0({
      arenaType: "sports",
      entity: {
        entityId: "team-1",
        persistentHash: "sports-hash",
        semanticClass: "test",
      },
      payload: {},
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    const result = ingestSportsArenaEventV0({ delta: { away: 2 } }, seeded.entity.entityId);
    expect(result.ok).toBe(true);
    expect(result.event.payload.scoreDelta).toEqual({ away: 2 });
  });

  it("ingestMediaFrameArenaEventV0 is phase-1 locked", () => {
    const result = ingestMediaFrameArenaEventV0({ frameTimestamp: 123 });
    expect(result.status).toBe("unbound");
    expect(result.reason).toBe("MEDIA_LEDGERIZATION_LOCKED_PHASE_1");
  });

  it("bindArenasToPlacedCubesV0 binds authority cubes with entity kernel", () => {
    const spatialAllocation = {
      ok: true,
      allocationHead: "alloc-head-1",
      sourceTopologyHead: "epoch-arena",
      placedCubes: [
        {
          cubeId: "cube-1",
          partitionKey: "epoch-arena:0",
          payload: {
            sealRef: "seal-arena",
            semanticClass: "cross_epoch_witness_bridge",
          },
          spatialSlot: {
            slotId: "slot-0",
            logicalPosition: "0,0,0",
            coordinateSpace: "logical_epistemic_grid",
            worldPosition: null,
          },
          arenaBinding: { status: "pending" },
          epochBoundary: { epochId: "epoch-arena" },
        },
      ],
    };

    const result = bindArenasToPlacedCubesV0({
      spatialAllocation,
      mergeEvent: { output: { mergedEpochId: "epoch-arena" } },
    });

    expect(result.ok).toBe(true);
    expect(result.boundCubes[0].arenaBinding.status).toBe("bound");
    expect(result.boundCubes[0].entityKernel.status).toBe("created");
    expect(result.boundCubes[0].entityKernel.persistentHash).toBeTruthy();

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("arena.binding.entity_resolved");
    expect(result.identityKernel.crossArenaAliases).toBe("active");
    expect(result.arenaRegistry.chess.coverage).toBe("inference_only");
    expect(result.arenaRegistry.media.lock).toBe("MEDIA_LEDGERIZATION_LOCKED_PHASE_1");
  });

  it("buildSpatialBindingV0 keeps worldPosition null", () => {
    const entity = bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "spatial-entity",
        persistentHash: "spatial-hash",
        semanticClass: "test",
      },
      payload: {},
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    }).entity;

    const placedCube = {
      spatialSlot: {
        slotId: "slot-1",
        logicalPosition: "1,2,3",
        coordinateSpace: "logical_epistemic_grid",
        worldPosition: null,
      },
    };

    const binding = buildSpatialBindingV0(placedCube, entity);
    expect(binding.spatialSlot.worldPosition).toBeNull();
    expect(binding.arenaBinding.status).toBe("bound");
    expect(binding.entityId).toBe("spatial-entity");
  });

  it("registerArenaEntityContinuityV0 links arena alias to entity", () => {
    const seeded = bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "reg-chess",
        persistentHash: "reg-hash",
        semanticClass: "test",
      },
      payload: {},
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    const reg = registerArenaEntityContinuityV0({
      entityId: seeded.entity.entityId,
      arenaType: "sports",
      localId: "sports-local-1",
    });

    expect(reg.ok).toBe(true);
    expect(reg.entity.aliases.sports).toBe("sports-local-1");
    expect(reg.entity.status).toBe("bound");
  });

  it("mintArenaEntityIdV0 returns deterministic hash id", () => {
    const id = mintArenaEntityIdV0({
      sealRef: "seal-x",
      partitionKey: "pk-1",
      mergedEpochId: "epoch-1",
      clientSeed: "test-client",
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(8);
  });
});

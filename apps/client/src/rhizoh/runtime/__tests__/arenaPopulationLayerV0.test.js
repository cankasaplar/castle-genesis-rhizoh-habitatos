import { beforeEach, describe, expect, it } from "vitest";
import {
  ARENA_POPULATION_CHAIN_V0,
  ARENA_POPULATION_KIND_V0,
  ARENA_POPULATION_STATUS_V0,
  buildArenaPopulationPinV0,
  groupPopulationByLayerV0,
  populateArenaWorldV0,
  populateChessArenaV0,
  populateMediaArenaV0,
  populateSportsArenaV0,
  resetArenaPopulationForTestV0,
} from "../arenaPopulationLayerV0.js";
import {
  bindArenaEntityV0,
  resetArenaBindingLayerForTestV0,
} from "../arenaBindingLayerV0.js";
import { resetCesiumWorldCommitForTestV0 } from "../cesiumWorldCommitV0.js";
import { TOWER_CLASS_V0, countUniqueMapCoordinatesV0 } from "../spatialDistributionLayerV0.js";

describe("arenaPopulationLayerV0", () => {
  beforeEach(() => {
    resetArenaPopulationForTestV0();
    resetArenaBindingLayerForTestV0();
    resetCesiumWorldCommitForTestV0();
  });

  it("ARENA_POPULATION_CHAIN_V0 maps chess/media to tower + layer", () => {
    expect(ARENA_POPULATION_CHAIN_V0.chess.towerClass).toBe(TOWER_CLASS_V0.CHESS);
    expect(ARENA_POPULATION_CHAIN_V0.chess.spiralLayer).toBe("explorer");
    expect(ARENA_POPULATION_CHAIN_V0.media.towerClass).toBe(TOWER_CLASS_V0.MEDIA);
    expect(ARENA_POPULATION_CHAIN_V0.media.spiralLayer).toBe("economy");
  });

  it("populateArenaWorldV0 seeds V11 explorer active + castle/economy dormant", () => {
    const spatialDistribution = {
      ok: true,
      distributionHead: "dist-head",
      observationOrigin: { lat: 41.044, lon: 29.009, source: "test" },
      distributedPins: [
        {
          id: "prism_cube:cube-a",
          lat: 41.0441,
          lon: 29.0091,
          towerClass: TOWER_CLASS_V0.AUTHORITY_EPISTEMIC,
          spiralLayer: "castle",
          prismCube: { cubeId: "cube-a" },
        },
      ],
    };

    const result = populateArenaWorldV0({ spatialDistribution });
    expect(result.ok).toBe(true);
    expect(result.populatedCount).toBe(12); // 1 authority + 4 explorer + 3 castle + 4 economy
    expect(result.activePinCount).toBe(5); // authority + 4 explorer seeds
    expect(result.dormantPinCount).toBe(7);

    const explorer = result.pinsByLayer.explorer;
    expect(explorer.length).toBe(4);
    expect(
      explorer.filter((p) => p.populationStatus === ARENA_POPULATION_STATUS_V0.ACTIVE).length
    ).toBe(4);

    const castle = result.pinsByLayer.castle;
    expect(castle.length).toBe(4); // 1 authority + 3 dormant seeds
    expect(
      castle.filter((p) => p.populationStatus === ARENA_POPULATION_STATUS_V0.DORMANT).length
    ).toBe(3);

    const economy = result.pinsByLayer.economy;
    expect(economy.every((p) => p.populationStatus === ARENA_POPULATION_STATUS_V0.DORMANT)).toBe(
      true
    );

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("arena.population.v11_seeded");
    expect(signalNames).toContain("arena.population.complete");

    const explorerActive = explorer.filter(
      (p) => p.populationStatus === ARENA_POPULATION_STATUS_V0.ACTIVE
    );
    expect(countUniqueMapCoordinatesV0(explorerActive)).toBeGreaterThanOrEqual(4);
  });

  it("populateArenaWorldV0 rejects missing spatial distribution", () => {
    const result = populateArenaWorldV0({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("spatial_distribution_required");
  });

  it("groupPopulationByLayerV0 partitions pins by spiral layer", () => {
    const pins = [
      buildArenaPopulationPinV0({
        towerClass: TOWER_CLASS_V0.EXPLORER,
        lat: 41,
        lon: 29,
        spiralLayer: "explorer",
      }),
      buildArenaPopulationPinV0({
        towerClass: TOWER_CLASS_V0.MEDIA,
        lat: 41.001,
        lon: 29.001,
        spiralLayer: "economy",
      }),
    ];
    const grouped = groupPopulationByLayerV0(pins);
    expect(grouped.explorer.length).toBe(1);
    expect(grouped.economy.length).toBe(1);
  });

  it("populateChessArenaV0 creates explorer-layer chess pin when entity bound", () => {
    const seeded = bindArenaEntityV0({
      arenaType: "chess",
      entity: {
        entityId: "chess-piece-1",
        persistentHash: "hash-chess",
        semanticClass: "cross_epoch_witness_bridge",
      },
      payload: { move: "e4" },
      epochId: "epoch-1",
      sealRef: "seal-1",
      timestamp: 1000,
    });

    const result = populateChessArenaV0({
      move: "e4",
      entityId: seeded.entity.entityId,
      observationOrigin: { lat: 41.05, lon: 29.01 },
    });

    expect(result.ok).toBe(true);
    expect(result.pin.towerClass).toBe(TOWER_CLASS_V0.CHESS);
    expect(result.pin.spiralLayer).toBe("explorer");
    expect(result.pin.populationKind).toBe(ARENA_POPULATION_KIND_V0.ARENA_EVENT);
  });

  it("populateSportsArenaV0 requires entity binding", () => {
    const result = populateSportsArenaV0({ entityId: "missing-entity" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("entity_binding_required");
  });

  it("populateMediaArenaV0 remains locked (media ledgerization deferred)", () => {
    const result = populateMediaArenaV0({ videoId: "yt-123" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(ARENA_POPULATION_STATUS_V0.LOCKED);
    expect(result.reason).toBe(ARENA_POPULATION_CHAIN_V0.media.lock);
  });
});

import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CastleSceneSync } from "./CastleSceneSync.js";
import { createCastleFieldBridge } from "../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "./istanbulBiomePresetV540.js";
import { createGhostCompanionState } from "../ghost/ghostCompanionState.js";
import { computeGhostEmbodimentParams } from "../ghost/ghostEmbodimentBridgeV546.js";
import { GhostEvolutionStage } from "../ghost/ghostEvolution.js";
import { buildGhostGenomeFromHabitatFrame } from "../ghost/ghostGenome.js";

describe("vNext-546 Ghost-to-Scene Embodiment", () => {
  it("computeGhostEmbodimentParams enables oracleMode near Boğaz for Oracle stage", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(buildIstanbulBridgeInputV540({ epochHash: "0xe546" }));
    const genome = buildGhostGenomeFromHabitatFrame(frame, { lineageAge: 0.75, mutationSeedBonus: 0.2 });
    const params = computeGhostEmbodimentParams(frame, genome, GhostEvolutionStage.Oracle, {
      oracleDistanceThreshold: 20
    });
    expect(params.oracleMode).toBe(true);
    expect(params.branchVisibilityMul).toBeGreaterThan(0.5);
    expect(params.perDistrict.kadikoy.scaleMul).toBeGreaterThan(1);
    expect(params.perDistrict.fatih.opacityMul).toBeGreaterThan(1);
  });

  it("CastleSceneSync drives ghost mesh when ghostEmbodiment + ctx", () => {
    vi.spyOn(performance, "now").mockReturnValue(1000);
    const scene = new THREE.Scene();
    const sync = new CastleSceneSync(scene, { labelsEnabled: false, ghostEmbodiment: true });
    const bridge = createCastleFieldBridge({ device: null });
    const input = buildIstanbulBridgeInputV540({ epochHash: "0xghost-scene" });
    const frame = bridge.submitFrame(input);
    const ghost = createGhostCompanionState({ citySpiritId: "istanbul" });
    const { genome, stage } = ghost.updateFromHabitatFrame(frame);
    sync.update(frame, { ghostGenome: genome, ghostStage: stage });
    expect(sync.ghostSpirit).toBeTruthy();
    expect(sync.ghostSpirit.core.scale.x).toBeGreaterThan(0);
    sync.dispose();
    vi.restoreAllMocks();
  });
});

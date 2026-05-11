import { describe, expect, it } from "vitest";
import { createCastleFieldBridge } from "../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "../scene/istanbulBiomePresetV540.js";
import { buildGhostGenomeFromHabitatFrame, sovereignTierToBond01 } from "./ghostGenome.js";
import { GhostEvolutionStage, resolveGhostStage, istanbulSpiritMorphLore } from "./ghostEvolution.js";
import {
  createGhostCompanionState,
  extractDreamFossilHashesFromBranches,
  traitTagFromArtifactHash
} from "./ghostCompanionState.js";
import { buildGhostRendererHints, ghostDistrictAffinity01 } from "./ghostRenderer.js";
import { composeHabitatStreamPackage } from "../broadcast/streamComposer.js";
import { buildFieldStoryBeats } from "../broadcast/fieldStoryEngine.js";

describe("vNext-545 Ghost Habitat Evolution", () => {
  it("buildGhostGenomeFromHabitatFrame maps regional field into 0–1 genome", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const input = buildIstanbulBridgeInputV540({ feeds: { gridHealth: 0.6, traffic: 0.5 }, epochHash: "0xg0" });
    const frame = bridge.submitFrame(input);
    const g = buildGhostGenomeFromHabitatFrame(frame, { lineageAge: 0.4, mutationSeedBonus: 0.1 });
    expect(g.vitality).toBeGreaterThan(0);
    expect(g.vitality).toBeLessThanOrEqual(1);
    expect(g.mutationBloom).toBeGreaterThan(0.05);
    expect(sovereignTierToBond01("L2")).toBeGreaterThan(sovereignTierToBond01("L1"));
  });

  it("resolveGhostStage progresses with stronger memory + wisdom", () => {
    const hi = {
      vitality: 0.7,
      calm: 0.65,
      curiosity: 0.5,
      wisdom: 0.75,
      playfulness: 0.5,
      resilience: 0.7,
      scarTension: 0.25,
      sovereignBond: 0.8,
      lineageAge: 0.7,
      memoryDepth: 0.82,
      mutationBloom: 0.45
    };
    expect(resolveGhostStage(hi)).toBe(GhostEvolutionStage.Mythic);
    const lo = {
      vitality: 0.18,
      calm: 0.15,
      curiosity: 0.12,
      wisdom: 0.12,
      playfulness: 0.12,
      resilience: 0.15,
      scarTension: 0.88,
      sovereignBond: 0.18,
      lineageAge: 0.04,
      memoryDepth: 0.07,
      mutationBloom: 0.05
    };
    expect(resolveGhostStage(lo)).toBe(GhostEvolutionStage.Hatchling);
  });

  it("companion maintains ghostLineageHash separate from frame fingerprint and ingests pruned fossils", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const input = buildIstanbulBridgeInputV540({ epochHash: "0xgc" });
    const frame = bridge.submitFrame(input);
    const hashes = extractDreamFossilHashesFromBranches(frame.branchSegments);
    expect(hashes.length).toBeGreaterThan(0);

    const g = createGhostCompanionState({ citySpiritId: "istanbul", initialGhostLineageHash: "0xseed-a" });
    const h0 = g.ghostLineageHash;
    const r1 = g.updateFromHabitatFrame(frame);
    expect(r1.genome).toBeDefined();
    expect(r1.ghostLineageHash).not.toBe(h0);
    expect(r1.summary.dreamFossilCount).toBeGreaterThanOrEqual(1);
    expect(traitTagFromArtifactHash("0xabc")).toMatch(/-/);
  });

  it("renderer hints and district affinity are pure data", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(buildIstanbulBridgeInputV540({ epochHash: "0xgr" }));
    const genome = buildGhostGenomeFromHabitatFrame(frame, {});
    const stage = resolveGhostStage(genome);
    const hints = buildGhostRendererHints("istanbul", genome, stage);
    expect(hints.groupName).toBe("GhostSpirit:istanbul");
    expect(hints.tailSegmentHint).toBeGreaterThan(3);
    const aff = ghostDistrictAffinity01("kadikoy", frame.regionalMap);
    expect(aff).toBeGreaterThan(0);
  });

  it("streamComposer carries ghostStateSummary block", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const input = buildIstanbulBridgeInputV540({ epochHash: "0xgs" });
    const frame = bridge.submitFrame(input);
    const beats = buildFieldStoryBeats(frame);
    const ghost = createGhostCompanionState({});
    const { summary } = ghost.updateFromHabitatFrame(frame);
    const pkg = composeHabitatStreamPackage(frame, beats, { ghostStateSummary: summary });
    expect(pkg.ghostLowerThird.length).toBeGreaterThan(0);
    expect(pkg.ghostLowerThird.some((x) => x.key === "spirit")).toBe(true);
    expect(istanbulSpiritMorphLore().tail).toMatch(/Boğaz/);
  });
});

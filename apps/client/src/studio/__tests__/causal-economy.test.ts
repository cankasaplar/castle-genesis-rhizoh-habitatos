import { describe, expect, it } from "vitest";
import {
  getStudioKernelState,
  patchCausalEconomy,
  patchIdentity,
  registerMindDefinition,
  registerSoul,
  registerSoulMindBinding,
  resetRhizohStudioKernelStore,
  spawnMindInstance,
  tickMind
} from "../store/studioStore.js";

function seedEconOwner() {
  patchIdentity({
    ownerId: "eco-owner",
    actor: { id: "eco-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "sim.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("Causal economy integrator v1", () => {
  it("rejects mind tick when compute cap would be exceeded", () => {
    resetRhizohStudioKernelStore();
    seedEconOwner();
    patchCausalEconomy({ maxComputeWeight: 1.5 });

    registerMindDefinition({
      uid: "def:eco",
      label: "Eco",
      metadata: { alias: "eco" },
      engine: { model: "gpt-4o", temperature: 0.5, maxTokens: 100, routingLogic: "intelligence_heavy" },
      dna: { curiosity: 0.5, resonance: 0.5, stability: 0.5, creativity: 0.5, empathy: 0.5 },
      capabilities: { toolIds: [], perceptions: [] }
    });
    registerSoul({
      uid: "soul:eco",
      ownerId: "eco-owner",
      continuityHash: "x",
      resonance: 1,
      history: []
    });
    spawnMindInstance({
      uid: "mind:eco",
      definitionUid: "def:eco",
      soulUid: "soul:eco",
      ownerId: "eco-owner",
      metadata: { alias: "m" }
    });
    registerSoulMindBinding({ uid: "smb:eco", soulUid: "soul:eco", mindInstanceUid: "mind:eco", state: "active" });

    const r = tickMind("mind:eco");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("causal_economy_compute_cap");
  });

  it("allows mind tick then blocks second when entropy cap is tight", () => {
    resetRhizohStudioKernelStore();
    seedEconOwner();
    patchCausalEconomy({ maxEntropyImpact: 2.0 });

    registerMindDefinition({
      uid: "def:eco2",
      label: "Eco2",
      metadata: { alias: "eco2" },
      engine: { model: "gpt-4o", temperature: 0.5, maxTokens: 100, routingLogic: "intelligence_heavy" },
      dna: { curiosity: 0.5, resonance: 0.5, stability: 0.5, creativity: 0.5, empathy: 0.5 },
      capabilities: { toolIds: [], perceptions: [] }
    });
    registerSoul({
      uid: "soul:eco2",
      ownerId: "eco-owner",
      continuityHash: "y",
      resonance: 1,
      history: []
    });
    spawnMindInstance({
      uid: "mind:eco2",
      definitionUid: "def:eco2",
      soulUid: "soul:eco2",
      ownerId: "eco-owner",
      metadata: { alias: "m2" }
    });
    registerSoulMindBinding({ uid: "smb:eco2", soulUid: "soul:eco2", mindInstanceUid: "mind:eco2", state: "active" });

    expect(tickMind("mind:eco2").ok).toBe(true);
    const r2 = tickMind("mind:eco2");
    expect(r2.ok).toBe(false);
    if (r2.ok) return;
    expect(r2.error).toBe("causal_economy_entropy_cap");
  });

  it("stamps payload.economy on appended mind node", () => {
    resetRhizohStudioKernelStore();
    seedEconOwner();

    registerMindDefinition({
      uid: "def:eco3",
      label: "Eco3",
      metadata: { alias: "eco3" },
      engine: { model: "gpt-4o", temperature: 0.5, maxTokens: 100, routingLogic: "intelligence_heavy" },
      dna: { curiosity: 0.5, resonance: 0.5, stability: 0.5, creativity: 0.5, empathy: 0.5 },
      capabilities: { toolIds: [], perceptions: [] }
    });
    registerSoul({
      uid: "soul:eco3",
      ownerId: "eco-owner",
      continuityHash: "z",
      resonance: 1,
      history: []
    });
    spawnMindInstance({
      uid: "mind:eco3",
      definitionUid: "def:eco3",
      soulUid: "soul:eco3",
      ownerId: "eco-owner",
      metadata: { alias: "m3" }
    });
    registerSoulMindBinding({ uid: "smb:eco3", soulUid: "soul:eco3", mindInstanceUid: "mind:eco3", state: "active" });

    expect(tickMind("mind:eco3").ok).toBe(true);
    const nodes = Object.values(getStudioKernelState().registry.causalGraph.nodes);
    const mindNode = nodes.find((n) => n.type === "mind" && n.branchId === "branch:main");
    expect(mindNode?.payload.economy?.computeWeight).toBe(2);
    expect(mindNode?.payload.economy?.entropyImpact).toBe(1.25);
  });
});

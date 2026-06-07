import { describe, expect, it } from "vitest";
import {
  assertCubeTopologyWriteV0,
  auditCubeTopologyOwnershipV0,
  CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
  CUBE_TOPOLOGY_INVARIANT_ID_V0,
  isForbiddenTopologyWriterV0,
  readCubeTopologySnapshotV0,
  sealCubeTopologyOwnershipV0
} from "../cubeTopologyOwnershipInvariantV0.js";
import {
  createCognitiveGeometryEngineV1,
  ingestCognitiveDraftV1
} from "../octoCognitiveGeometryCompilerV1.js";
import {
  OBSERVER_SPECIES_FOX_V1,
  OBSERVER_SPECIES_OCTO_V1,
  resolveObserverSpeciesV0,
  scaleAttentionBySpeciesAffinityV0
} from "../observerSpeciesRegistryV0.js";

describe("cubeTopologyOwnershipInvariantV0", () => {
  it("seals engine at creation with cognition_ingress owner", () => {
    const engine = createCognitiveGeometryEngineV1(8);
    const audit = auditCubeTopologyOwnershipV0(engine);
    expect(audit.invariant).toBe(CUBE_TOPOLOGY_INVARIANT_ID_V0);
    expect(audit.owner).toBe(CUBE_TOPOLOGY_COGNITION_INGRESS_V0);
    expect(audit.invariantHeld).toBe(true);
  });

  it("allows cognition_ingress writes and blocks observer agents", () => {
    const engine = createCognitiveGeometryEngineV1(8);
    const ok = assertCubeTopologyWriteV0(engine, CUBE_TOPOLOGY_COGNITION_INGRESS_V0, {
      twist: 0.2,
      fold: 0,
      spikes: 0,
      stretchY: 1.1
    });
    expect(ok.ok).toBe(true);

    const blocked = assertCubeTopologyWriteV0(engine, "octo_observer", {
      twist: 0.9,
      fold: 0.9,
      spikes: 0.9,
      stretchY: 2
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("agent_owned_forbidden");

    const audit = auditCubeTopologyOwnershipV0(engine);
    expect(audit.agentWriteAttempts).toBe(1);
    expect(audit.invariantHeld).toBe(false);
  });

  it("forbids companion and inbox topology writers", () => {
    expect(isForbiddenTopologyWriterV0("rhizoh")).toBe(true);
    expect(isForbiddenTopologyWriterV0("inbox")).toBe(true);
    expect(isForbiddenTopologyWriterV0("attention_field")).toBe(true);
    expect(isForbiddenTopologyWriterV0(CUBE_TOPOLOGY_COGNITION_INGRESS_V0)).toBe(false);
  });

  it("readCubeTopologySnapshotV0 is read-only marker", () => {
    const engine = createCognitiveGeometryEngineV1(8);
    ingestCognitiveDraftV1(engine, "merhaba göster bak yeni açık");
    const snap = readCubeTopologySnapshotV0(engine);
    expect(snap.readOnly).toBe(true);
    expect(snap.agentOwned).toBe(false);
    expect(snap.target.stretchY).toBeGreaterThan(1);
  });
});

describe("observerSpeciesRegistryV0", () => {
  it("resolves octo and fox with topologyWrite false", () => {
    expect(resolveObserverSpeciesV0("octo_v1")?.id).toBe(OBSERVER_SPECIES_OCTO_V1.id);
    expect(resolveObserverSpeciesV0("fox_v1")?.id).toBe(OBSERVER_SPECIES_FOX_V1.id);
    expect(OBSERVER_SPECIES_FOX_V1.topologyWrite).toBe(false);
    expect(OBSERVER_SPECIES_FOX_V1.geometryAffinity.branching).toBeGreaterThan(0.7);
  });

  it("scales attention by species affinity without exceeding cap", () => {
    const fox = resolveObserverSpeciesV0("fox_v1");
    const scaled = scaleAttentionBySpeciesAffinityV0(fox, "branching", 0.07);
    expect(scaled).toBeGreaterThan(0);
    expect(scaled).toBeLessThanOrEqual(0.07);
  });
});

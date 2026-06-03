import { describe, expect, it, beforeEach } from "vitest";
import {
  getRhizohArtifactExportGraphV0,
  RAR_ARTIFACT_KIND_V0,
  registerRhizohArtifactFromContinuityStackV0,
  registerRhizohArtifactV0,
  resetRhizohArtifactRegistryForTestV0
} from "../rhizohArtifactRegistryV0.js";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { deriveRhizohPresenceStateV0 } from "../rhizohPresenceStateEngineV0.js";
import { resolveReslPresentationV0 } from "../rhizohReslPresentationPolicyV0.js";

describe("rhizohArtifactRegistryV0", () => {
  beforeEach(() => {
    resetRhizohArtifactRegistryForTestV0();
    if (typeof window !== "undefined") window.__rhizoh = {};
  });

  it("registers artifact with lineage and export graph", () => {
    const parent = registerRhizohArtifactV0({
      kind: RAR_ARTIFACT_KIND_V0.NARRATIVE_CONTINUITY,
      payload: { line: "Rhizoh burada" },
      lineage: { stream_coherence_id: "a:1:hold" },
      surfaces: ["t0_strip"]
    });
    const child = registerRhizohArtifactV0({
      kind: RAR_ARTIFACT_KIND_V0.COGNITIVE_LINEAGE,
      payload: {},
      lineage: { experiential_now_id: "now:1" },
      surfaces: ["internal"],
      parentArtifact: parent,
      visibility: "internal"
    });
    expect(child.parent_artifact_id).toBe(parent.artifact_id);
    const graph = getRhizohArtifactExportGraphV0();
    expect(graph.length).toBeGreaterThanOrEqual(2);
  });

  it("registers from continuity stack", () => {
    const p = deriveRhizohPresenceStateV0({ shellMounted: true, nowMs: 0, lastUserActivityMs: 0 });
    const resl = resolveReslPresentationV0(p, { nowMs: 0 });
    const ecc = compileExperienceContinuityV0({ presence: p, resl, nowMs: 0 });
    const art = registerRhizohArtifactFromContinuityStackV0(ecc);
    expect(art.kind).toBe(RAR_ARTIFACT_KIND_V0.NARRATIVE_CONTINUITY);
    expect(art.surfaces).toContain("t0_strip");
  });
});

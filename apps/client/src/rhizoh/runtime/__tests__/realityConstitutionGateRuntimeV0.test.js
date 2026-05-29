import { describe, it, expect } from "vitest";
import { evaluateConstitutionBeforeSealV0 } from "../realityConstitutionGateRuntimeV0.js";
import { processRealitySealCandidateV0, createDefaultRealitySealLayerStateV0 } from "../realitySealingCoreV0.js";
import { REALITY_SEAL_VERDICTS_V0 } from "../realitySealingCoreV0.js";

describe("realityConstitutionGateRuntimeV0", () => {
  it("rejects coherence sealing-class world write", () => {
    const r = evaluateConstitutionBeforeSealV0({
      candidateId: "x",
      source: "coherence",
      commitClassId: "sealing_topology_mandate",
      payloadHash: "phash",
      enqueuedAtMs: 1,
      roomScope: "room:a"
    });
    expect(r.ok).toBe(false);
    expect(r.ruleId).toBe("R1_coherence_no_world_seal");
  });

  it("rejects topology without room scope", () => {
    const r = evaluateConstitutionBeforeSealV0({
      candidateId: "t",
      source: "wal",
      commitClassId: "sealing_topology_mandate",
      payloadHash: "phash",
      enqueuedAtMs: 1
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("CONSTITUTION_TOPOLOGY_ROOM_REQUIRED");
  });

  it("wires into sealer process as reject verdict", () => {
    const out = processRealitySealCandidateV0(
      createDefaultRealitySealLayerStateV0(),
      {
        candidateId: "c",
        source: "coherence",
        commitClassId: "sealing_world_geometry",
        payloadHash: "abc",
        enqueuedAtMs: 1
      },
      100
    );
    expect(out.verdict).toBe(REALITY_SEAL_VERDICTS_V0.REJECT);
    expect(out.reasonCode).toContain("R1_coherence_no_world_seal");
  });
});

import { describe, it, expect } from "vitest";
import {
  deriveSpiralMMOAgreementLayerV0,
  deriveProtoWorldMeshV0,
  mergeAgreementLayerIntoCollectiveFeelingV0
} from "../spiralMMOAgreementLayerV0.js";
import { deriveCollectivePresenceFeelingV0 } from "../livingWorldCollectivePulseV0.js";

describe("spiralMMOAgreementLayerV0", () => {
  it("closed mode stays perception field only", () => {
    const layer = deriveSpiralMMOAgreementLayerV0({
      worldInstanceId: "wi_spiral",
      selfSignature: "self_abc",
      agreementLayerEnabled: false
    });
    expect(layer.agreementLayer).toBe(false);
    expect(layer.sharedState).toBe(false);
    expect(layer.phase).toBe("perception_field_only");
  });

  it("agreement layer is proto mesh — not shared state", () => {
    const layer = deriveSpiralMMOAgreementLayerV0({
      worldInstanceId: "wi_spiral",
      selfSignature: "self_abc",
      agreementLayerEnabled: true
    });
    expect(layer.agreementLayer).toBe(true);
    expect(layer.sharedState).toBe(false);
    expect(layer.phase).toBe("proto_world_mesh_agreement");
    expect(layer.protoMesh?.meshPhase).toBeTruthy();
    expect(layer.disclaimer).toMatch(/No shared execution state/i);
  });

  it("proto mesh is deterministic per self + instance", () => {
    const a = deriveProtoWorldMeshV0({ worldInstanceId: "wi_x", selfSignature: "self_1" });
    const b = deriveProtoWorldMeshV0({ worldInstanceId: "wi_x", selfSignature: "self_1" });
    expect(a.meshPhase).toBe(b.meshPhase);
  });

  it("merges agreement copy into collective feeling", () => {
    const collective = deriveCollectivePresenceFeelingV0("wi_spiral");
    const layer = deriveSpiralMMOAgreementLayerV0({
      worldInstanceId: "wi_spiral",
      selfSignature: "self_abc",
      agreementLayerEnabled: true
    });
    const merged = mergeAgreementLayerIntoCollectiveFeelingV0(collective, layer);
    expect(merged.spiralAgreement?.agreementLayer).toBe(true);
    expect(merged.spiralAgreement?.sharedState).toBe(false);
    expect(merged.secondary).toMatch(/Agreement|mesh|state/i);
  });
});

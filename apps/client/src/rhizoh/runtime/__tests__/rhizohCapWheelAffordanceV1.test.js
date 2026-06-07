import { describe, expect, it } from "vitest";
import { resolveCapWheelMeaningLadderV0 } from "../rhizohCapWheelMeaningLadderV0.js";
import {
  CAP_WHEEL_GEOMETRY_KIND_V1,
  CAP_WHEEL_INTENT_CLASS_V1,
  resolveCapWheelGeometryKindV1,
  validateCapWheelIntentCopyCoherenceV1
} from "../../../kernel/visual/capWheelIntentRegistryV1.js";
import {
  RHIZOH_CAPABILITY_HALO_NODES_TR_V0
} from "../rhizohProductPlainCopyV0.js";
import { RHIZOH_CAPABILITY_HALO_NODES_EN_V0 } from "../rhizohProductCopyI18nV0.js";

describe("rhizohCapWheelMeaningLadderV0", () => {
  it("idle level is read-only with no execute hint", () => {
    const ladder = resolveCapWheelMeaningLadderV0({
      locale: "tr",
      intro: "Sembollere gel."
    });
    expect(ladder.level).toBe("idle");
    expect(ladder.readOnly).toBe(true);
    expect(ladder.executeHint).toBe(null);
  });

  it("hover level adds execute hint and intent class from registry", () => {
    const ladder = resolveCapWheelMeaningLadderV0({
      locale: "tr",
      intro: "intro",
      hoverNode: { id: "create", label: "Üret", geometryKind: "cube" },
      whisper: "Stüdyo oturumu."
    });
    expect(ladder.level).toBe("hover");
    expect(ladder.geometryKind).toBe("cube");
    expect(ladder.intentClass).toBe(CAP_WHEEL_INTENT_CLASS_V1.IDENTITY);
    expect(ladder.executeHint).toBe("Dokun = çalıştır");
    expect(ladder.readOnly).toBe(true);
  });
});

describe("capWheelIntentRegistryV1", () => {
  it("TR and EN locale nodes match registry geometry (no semantic drift)", () => {
    expect(validateCapWheelIntentCopyCoherenceV1(RHIZOH_CAPABILITY_HALO_NODES_TR_V0).ok).toBe(true);
    expect(validateCapWheelIntentCopyCoherenceV1(RHIZOH_CAPABILITY_HALO_NODES_EN_V0).ok).toBe(true);
  });

  it("every production halo node has registered geometry", () => {
    for (const node of RHIZOH_CAPABILITY_HALO_NODES_TR_V0) {
      const kind = resolveCapWheelGeometryKindV1(node);
      expect(Object.values(CAP_WHEEL_GEOMETRY_KIND_V1)).toContain(kind);
    }
  });
});

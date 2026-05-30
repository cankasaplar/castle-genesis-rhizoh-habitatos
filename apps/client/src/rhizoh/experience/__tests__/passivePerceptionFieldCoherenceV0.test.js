import { describe, it, expect } from "vitest";
import {
  derivePassivePerceptionFieldV0,
  mergePerceptionFieldIntoCollectiveFeelingV0
} from "../passivePerceptionFieldCoherenceV0.js";
import { deriveCollectivePresenceFeelingV0 } from "../livingWorldCollectivePulseV0.js";

describe("passivePerceptionFieldCoherenceV0", () => {
  it("field is perception-only — never shared state", () => {
    const field = derivePassivePerceptionFieldV0({ worldInstanceId: "wi_field" });
    expect(field.sharedState).toBe(false);
    expect(field.sharedPerceptionField).toBe(true);
    expect(field.spiralBridge.mode).toBe("closed");
  });

  it("spiral bridge stays perception-only when enabled", () => {
    const field = derivePassivePerceptionFieldV0({
      worldInstanceId: "wi_field",
      spiralBridgeEnabled: true
    });
    expect(field.spiralBridge.enabled).toBe(true);
    expect(field.spiralBridge.mode).toBe("perception_only");
    expect(field.spiralBridge.disclaimer).toMatch(/execution.*yok/i);
  });

  it("merges into collective feeling without digits", () => {
    const collective = deriveCollectivePresenceFeelingV0("wi_field");
    const field = derivePassivePerceptionFieldV0({ worldInstanceId: "wi_field" });
    const merged = mergePerceptionFieldIntoCollectiveFeelingV0(collective, field);
    expect(merged.perceptionField?.sharedState).toBe(false);
    expect(merged.secondary).toMatch(/perception field|state değil/i);
    expect(merged.primary).not.toMatch(/\d/);
  });
});

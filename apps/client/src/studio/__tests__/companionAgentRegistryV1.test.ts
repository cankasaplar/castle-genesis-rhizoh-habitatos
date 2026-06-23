import { describe, expect, it } from "vitest";
import { createCompanionAgentRegistryV1 } from "../runtime/companionAgentRegistryV1";

describe("companionAgentRegistryV1", () => {
  it("produces valid provenance structure", () => {
    const registry = createCompanionAgentRegistryV1();

    const result = registry.produceProvenance({
      input: "test"
    });

    expect(result).toBeDefined();

    // FIX: legacy field removed
    expect(result.source_chain).toBeInstanceOf(Array);
    expect(typeof result.trust_class).toBe("string");
    expect(typeof result.derivation_depth).toBe("number");
  });
});

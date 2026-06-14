import { describe, expect, it } from "vitest";
import { resolveLlmTowerDesignV0 } from "../llmTowerDesignV0.js";
import { resolveRhizohTowerProviderV0 } from "../rhizohTowerProviderRegistryV0.js";

describe("llmTowerDesignV0", () => {
  it("claude tower has distinct design", () => {
    const d = resolveLlmTowerDesignV0("claude_tower");
    expect(d.icon).toBe("🛡️");
    expect(d.colors.primary).toBe("#3b82f6");
  });

  it("mistral tower maps to mistral provider", () => {
    const row = resolveRhizohTowerProviderV0("mistral_tower");
    expect(row.provider).toBe("mistral");
    expect(row.model).toContain("mistral");
  });
});

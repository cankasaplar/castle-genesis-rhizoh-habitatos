import { describe, expect, it } from "vitest";
import { parseTowerImageDataUrlV0 } from "../rhizohTowerMediaCaptureV0.js";
import { resolveRhizohTowerProviderV0, resolveRhizohTowerLabelV0 } from "../rhizohTowerProviderRegistryV0.js";

describe("rhizohTowerMediaCaptureV0", () => {
  it("parses jpeg data urls", () => {
    const parsed = parseTowerImageDataUrlV0("data:image/jpeg;base64,abc123");
    expect(parsed?.mimeType).toBe("image/jpeg");
    expect(parsed?.base64).toBe("abc123");
  });
});

describe("rhizohTowerProviderRegistryV0", () => {
  it("resolves gemini tower provider", () => {
    const row = resolveRhizohTowerProviderV0("gemini_tower");
    expect(row.provider).toBe("gemini");
    expect(resolveRhizohTowerLabelV0("gemini_tower", true)).toMatch(/Gemini/);
  });
});

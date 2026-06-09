import { describe, expect, it } from "vitest";
import { normalizeRhizohSttBrandPhoneticsV0 } from "../rhizohSttBrandNormalizeV0.js";
import { normalizeVoiceCommandSpaceV0 } from "../rhizohVoiceCommandRouterV0.js";

describe("rhizohSttBrandNormalizeV0", () => {
  it("repairs rise or → rhizoh", () => {
    const r = normalizeRhizohSttBrandPhoneticsV0("Rise or open map.");
    expect(r.repaired).toBe(true);
    expect(r.text.toLowerCase()).toContain("rhizoh open map");
  });

  it("registry matches rise or open map after normalize", () => {
    const space = normalizeVoiceCommandSpaceV0("Rise or open map");
    expect(space.canonical).toBe("map_open");
    expect(space.matched).toBe(true);
  });

  it("repairs Turkish lüzum/luzum whisper variants → rhizoh", () => {
    expect(normalizeRhizohSttBrandPhoneticsV0("Merhaba lüzum.").text.toLowerCase()).toContain(
      "rhizoh"
    );
    expect(normalizeRhizohSttBrandPhoneticsV0("Merhaba luzum").repaired).toBe(true);
  });

  it("repairs resol and erizo whisper variants → rhizoh", () => {
    expect(normalizeRhizohSttBrandPhoneticsV0("Resol, merhaba.").text.toLowerCase()).toContain(
      "rhizoh"
    );
    expect(normalizeRhizohSttBrandPhoneticsV0("Merhaba Erizo.").text.toLowerCase()).toContain(
      "rhizoh"
    );
  });
});

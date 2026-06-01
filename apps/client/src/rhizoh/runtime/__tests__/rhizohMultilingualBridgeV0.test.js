import { describe, it, expect, beforeEach } from "vitest";
import {
  RHIZOH_LANGUAGE_CATALOG_V0,
  buildRhizohMultilingualPackV0,
  detectRhizohMultilingualLocaleV0,
  resolveRhizohBcp47V0,
  readRhizohSessionLanguagePreferenceV0,
  writeRhizohSessionLanguagePreferenceV0
} from "../rhizohMultilingualBridgeV0.js";
import { resetT0ContinuityPulseStreamV0 } from "../t0ContinuitySurfaceStreamV0.js";
import { pushRhizohTurnContinuityPulseV0 } from "../rhizohMultilingualBridgeV0.js";
import { readT0ContinuityPulseStreamV0 } from "../t0ContinuitySurfaceStreamV0.js";

describe("rhizohMultilingualBridgeV0", () => {
  beforeEach(() => {
    resetT0ContinuityPulseStreamV0();
    try {
      sessionStorage.removeItem("rhizoh.user.language.v0");
    } catch {
      /* ignore */
    }
  });

  it("catalog includes major locales", () => {
    expect(RHIZOH_LANGUAGE_CATALOG_V0.length).toBeGreaterThanOrEqual(40);
    const codes = new Set(RHIZOH_LANGUAGE_CATALOG_V0.map((r) => r.code));
    expect(codes.has("tr")).toBe(true);
    expect(codes.has("en")).toBe(true);
    expect(codes.has("es")).toBe(true);
    expect(codes.has("de")).toBe(true);
    expect(codes.has("ar")).toBe(true);
    expect(codes.has("ja")).toBe(true);
  });

  it("detects Spanish and English", () => {
    expect(detectRhizohMultilingualLocaleV0("Hola, gracias por la continuidad").code).toBe("es");
    expect(detectRhizohMultilingualLocaleV0("Hello, thanks for the continuity field").code).toBe("en");
    expect(detectRhizohMultilingualLocaleV0("Merhaba nasılsın").code).toBe("tr");
  });

  it("buildRhizohMultilingualPack includes en-es bridge in directive for English user", () => {
    const pack = buildRhizohMultilingualPackV0({
      message: "I want to plant a new seed in memory"
    });
    expect(pack.respondCode).toBe("en");
    expect(pack.directive).toMatch(/continuidad|continuity/i);
    expect(pack.respondBcp47).toBe(resolveRhizohBcp47V0("en"));
    expect(pack.context.catalog_codes.length).toBeGreaterThan(30);
  });

  it("persists session language preference", () => {
    writeRhizohSessionLanguagePreferenceV0("es");
    expect(readRhizohSessionLanguagePreferenceV0()).toBe("es");
  });

  it("pushRhizohTurnContinuityPulse adds localized stream line", () => {
    pushRhizohTurnContinuityPulseV0({
      message: "Hello world",
      normalized: { reply: "Hi" },
      palLabel: "Ankara Castle"
    });
    const stream = readT0ContinuityPulseStreamV0();
    expect(stream.length).toBeGreaterThan(0);
    expect(stream[stream.length - 1].line).toMatch(/Continuity|Ankara/i);
  });
});

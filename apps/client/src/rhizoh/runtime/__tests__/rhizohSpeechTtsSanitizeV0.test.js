import { describe, expect, it } from "vitest";
import {
  sanitizeSpeechTextForTtsV0,
  splitLongTtsChunkV0
} from "../rhizohSpeechTtsSanitizeV0.js";

describe("rhizohSpeechTtsSanitizeV0", () => {
  it("strips numbered list markers and n1 n2 artifacts", () => {
    const out = sanitizeSpeechTextForTtsV0("1. İlk cümle.\n2. İkinci cümle.\nN1 N2 devam.");
    expect(out).not.toMatch(/\bn[0-9]+\b/i);
    expect(out).toMatch(/İlk cümle/);
    expect(out).toMatch(/İkinci cümle/);
  });

  it("splits long chunks on word boundaries", () => {
    const words = Array.from({ length: 60 }, (_, i) => `kelime${i}`).join(" ");
    const parts = splitLongTtsChunkV0(words, 80);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 80)).toBe(true);
  });
});

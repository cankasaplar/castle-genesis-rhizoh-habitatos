import { describe, expect, it } from "vitest";
import {
  fixRhizohReplyOrthographyV0,
  isRhizohReplyLikelyTruncatedV0,
  repairRhizohTruncatedReplyV0,
  sanitizeRhizohReplyForDisplayV0
} from "../rhizohReplyDisplaySanitizeV0.js";
import { stripRhizohReplyArtifactsV0 } from "../rhizohReplyArtifactCleanupV0.js";

describe("rhizohReplyDisplaySanitizeV0", () => {
  it("strips n1 n2 and list markers for chat display", () => {
    const out = sanitizeRhizohReplyForDisplayV0("1. İlk cümle.\n2. İkinci cümle.\nN1 N2 devam.");
    expect(out).not.toMatch(/\bn[0-9]+\b/i);
    expect(out).toMatch(/İlk cümle/);
  });

  it("fixes common orthography", () => {
    expect(fixRhizohReplyOrthographyV0("tesekkurler dostum")).toMatch(/teşekkürler/);
  });

  it("detects and repairs truncated replies", () => {
    const truncated = "Bu uzun bir açıklama ve cümle yarıda kesildi çünkü";
    expect(isRhizohReplyLikelyTruncatedV0(truncated)).toBe(true);
    const repaired = repairRhizohTruncatedReplyV0(truncated);
    expect(repaired.repaired).toBe(true);
    expect(repaired.text.endsWith(".")).toBe(true);
  });

  it("shared artifact strip used by display path", () => {
    expect(stripRhizohReplyArtifactsV0("reply: merhaba N1")).toMatch(/merhaba/);
  });
});

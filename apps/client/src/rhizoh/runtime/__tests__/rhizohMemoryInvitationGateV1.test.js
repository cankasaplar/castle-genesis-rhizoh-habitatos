import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  probeFutureOrientationV1,
  probeMemoryInvitationCandidateV1,
  parseMemoryConsentReplyV1,
  MEMORY_TIER_V1,
  SPATIAL_SIGNIFICANCE_THRESHOLD_V1
} from "../rhizohMemoryInvitationGateV1.js";

describe("probeFutureOrientationV1", () => {
  it("detects upcoming week phrasing", () => {
    const hit = probeFutureOrientationV1("önümüzdeki hafta iş görüşmem var");
    expect(hit.active).toBe(true);
  });
});

describe("probeMemoryInvitationCandidateV1", () => {
  it("promotes spatial tier when significance and future align", () => {
    const hit = probeMemoryInvitationCandidateV1("önümüzdeki hafta iş değişikliği görüşmem var", {
      significanceScore: SPATIAL_SIGNIFICANCE_THRESHOLD_V1 + 0.05
    });
    expect(hit.active).toBe(true);
    expect(hit.tier).toBe(MEMORY_TIER_V1.SPATIAL);
  });

  it("stays soft for low-weight chat", () => {
    const hit = probeMemoryInvitationCandidateV1("merhaba", { significanceScore: 0.2 });
    expect(hit.active).toBe(false);
    expect(hit.tier).toBe(MEMORY_TIER_V1.SOFT);
  });
});

describe("parseMemoryConsentReplyV1", () => {
  it("parses affirmative consent", () => {
    expect(parseMemoryConsentReplyV1("evet not al").status).toBe("granted");
  });

  it("parses decline", () => {
    expect(parseMemoryConsentReplyV1("hayır gerek yok").status).toBe("declined");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildContinuityRecallBoostV0,
  mergeRecallBoostIntoRecollectionV0,
  probeContinuityRecallIntentV0
} from "../rhizohContinuityRecallIntentV0.js";
import {
  runFastPrecheckFromTextV0,
  shouldDeferFastPrecheckToLlmV0
} from "../rhizohFastPrecheckV0.js";

describe("probeContinuityRecallIntentV0", () => {
  it("detects explicit Turkish recall", () => {
    const hit = probeContinuityRecallIntentV0("Türkiye maçlarını hatırlıyor musun?");
    expect(hit.active).toBe(true);
    expect(hit.tier).toBe("explicit");
    expect(hit.anchorTokens).toContain("turkiye");
  });

  it("detects generic what-we-talked-about recall", () => {
    const hit = probeContinuityRecallIntentV0("Az önce ne konuşmuştuk?");
    expect(hit.active).toBe(true);
    expect(hit.tier).toBe("explicit");
  });

  it("detects English recall phrasing", () => {
    const hit = probeContinuityRecallIntentV0("Do you remember what we discussed about Turkey?");
    expect(hit.active).toBe(true);
    expect(hit.tier).toBe("explicit");
  });

  it("ignores unrelated chat", () => {
    const hit = probeContinuityRecallIntentV0("Bugün hava güzel.");
    expect(hit.active).toBe(false);
  });
});

describe("buildContinuityRecallBoostV0", () => {
  const disk = {
    turns: [
      {
        ts: 1_700_000_000_000,
        user: "Türkiye nin maçlarını fikstürünü merak ediyorum",
        assistant: "Türkiye A Milli fikstürüne bakabiliriz."
      },
      {
        ts: 1_700_000_100_000,
        user: "Merhaba",
        assistant: "Merhaba Can."
      }
    ],
    meta: {
      rhizohMemoryEpisodes: []
    }
  };

  it("ranks topic-overlap turns highest", () => {
    const boost = buildContinuityRecallBoostV0("Türkiye maçlarını hatırlıyor musun?", disk);
    expect(boost?.active).toBe(true);
    expect(boost?.lines?.length).toBeGreaterThan(0);
    expect(String(boost?.lines?.[0]?.user || "")).toMatch(/Türkiye|turkiye/i);
  });

  it("falls back to recent substantive turns without anchors", () => {
    const boost = buildContinuityRecallBoostV0("Ne konuşmuştuk?", disk);
    expect(boost?.lines?.length).toBeGreaterThan(0);
  });
});

describe("mergeRecallBoostIntoRecollectionV0", () => {
  it("prepends boost lines and dedupes by ts+user", () => {
    const base = [{ ts: 2, user: "old", assistant: "a", retrievalWeight: 0.4 }];
    const boost = {
      lines: [{ ts: 1, user: "turkey topic", assistant: "reply", retrievalWeight: 0.95, recallBoost: true }]
    };
    const merged = mergeRecallBoostIntoRecollectionV0(base, boost, { limit: 8 });
    expect(merged[0].user).toBe("turkey topic");
    expect(merged.length).toBe(2);
  });
});

describe("fast precheck recall defer", () => {
  it("defers presence_query reflex for recall questions", () => {
    expect(shouldDeferFastPrecheckToLlmV0("Beni hatırlıyor musun?", "presence_query")).toBe(true);
  });

  it("does not hijack recall with shallow presence reply", () => {
    const hit = runFastPrecheckFromTextV0("Türkiye maçlarını hatırlıyor musun?");
    expect(hit).toBeNull();
  });
});

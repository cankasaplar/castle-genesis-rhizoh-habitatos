import { describe, expect, it } from "vitest";
import {
  runFastPrecheckFromTextV0,
  shouldDeferFastPrecheckToLlmV0
} from "../rhizohFastPrecheckV0.js";

describe("shouldDeferFastPrecheckToLlmV0", () => {
  it("defers greeting reflex for intro question compound", () => {
    expect(
      shouldDeferFastPrecheckToLlmV0("Merhaba Rhizoh, bana kendini tanıtır mısın?", "greeting")
    ).toBe(true);
  });

  it("keeps pure greeting short", () => {
    expect(shouldDeferFastPrecheckToLlmV0("Merhaba", "greeting")).toBe(false);
  });
});

describe("runFastPrecheckFromTextV0 compound guard", () => {
  it("does not hijack intro question with Buradayım greeting", () => {
    const hit = runFastPrecheckFromTextV0("Merhaba Rhizoh, bana kendini tanıtır mısın?");
    expect(hit).toBeNull();
  });

  it("skips weather_live without user geo consent", () => {
    const hit = runFastPrecheckFromTextV0("hava nasıl");
    expect(hit).toBeNull();
  });

  it("defers assertive duyabiliyor statement from hearing_check reflex", () => {
    const hit = runFastPrecheckFromTextV0("Şimdi duyabiliyor olman gerekiyor.");
    expect(hit).toBeNull();
  });

  it("defers recall questions to LLM instead of presence reflex", () => {
    const hit = runFastPrecheckFromTextV0("Ne konuşmuştuk az önce?");
    expect(hit).toBeNull();
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import {
  readGeminiTowerGalleryV0,
  saveGeminiTowerGalleryWorkV0,
  GEMINI_TOWER_GALLERY_STORAGE_KEY_V0
} from "../geminiTowerGalleryV0.js";
import { generateGeminiTowerImageV0 } from "../geminiTowerBrainV0.js";

describe("geminiTowerGalleryV0", () => {
  beforeEach(() => {
    localStorage.removeItem(GEMINI_TOWER_GALLERY_STORAGE_KEY_V0);
  });

  it("persists gallery works", () => {
    saveGeminiTowerGalleryWorkV0({ image: "data:image/png;base64,abc", prompt: "neon city" });
    const gallery = readGeminiTowerGalleryV0();
    expect(gallery.length).toBe(1);
    expect(gallery[0].prompt).toBe("neon city");
  });
});

describe("geminiTowerBrainV0", () => {
  it("rejects empty prompt", async () => {
    const out = await generateGeminiTowerImageV0("   ");
    expect(out.ok).toBe(false);
  });
});

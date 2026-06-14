import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../rhizohTowerLlmSessionV0.js", () => ({
  postRhizohTowerLlmTurnV0: vi.fn()
}));

import { postRhizohTowerLlmTurnV0 } from "../rhizohTowerLlmSessionV0.js";
import { analyzeGeminiTowerCanvasV0 } from "../geminiTowerBrainV0.js";

const FRAME = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("analyzeGeminiTowerCanvasV0", () => {
  beforeEach(() => {
    vi.mocked(postRhizohTowerLlmTurnV0).mockReset();
  });

  it("rejects hallucinated flower-only reply", async () => {
    vi.mocked(postRhizohTowerLlmTurnV0).mockResolvedValue({
      ok: true,
      reply:
        "Görüntü pastel tonlarda huzur veren bir atmosfer sunuyor; zarif bir çiçek aranjmanı dikkat çekiyor."
    });
    const out = await analyzeGeminiTowerCanvasV0(FRAME);
    expect(out).toMatch(/Vision did not receive|Vision bağlantısı|görüntüyü alamadı/i);
  });

  it("returns literal vision reply", async () => {
    vi.mocked(postRhizohTowerLlmTurnV0).mockResolvedValue({
      ok: true,
      reply: "Kadrajda bir kişinin yüzü ve arkada pencere perdesi görünüyor."
    });
    const out = await analyzeGeminiTowerCanvasV0(FRAME);
    expect(out).toMatch(/yüz|perde/i);
  });
});

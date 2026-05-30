import { describe, expect, it } from "vitest";
import {
  retrieveSocialMemoryRecallPackV0,
  SOCIAL_MEMORY_RECALL_PACK_SCHEMA_V0
} from "../socialMemoryRetrievalV0.js";

describe("retrieveSocialMemoryRecallPackV0", () => {
  it("returns recall lines for matching roles", () => {
    const book = {
      episodes: [
        { role: "GUIDE", frame: 1, publishRecommendationScore: 0.4 },
        { role: "INTERPRETER", frame: 2, networkDiffDirty: true }
      ]
    };
    const pack = retrieveSocialMemoryRecallPackV0(book, { currentRole: "INTERPRETER", maxItems: 2, locale: "tr" });
    expect(pack.schema).toBe(SOCIAL_MEMORY_RECALL_PACK_SCHEMA_V0);
    expect(pack.recallLines.length).toBeGreaterThan(0);
    expect(pack.recallLines[0]).toContain("INTERPRETER");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSpatialLiveContextBoostV0,
  haversineMetersV0,
  probeSpatialBriefingQueryV0
} from "../rhizohSpatialLiveContextV0.js";

describe("rhizohSpatialLiveContextV0", () => {
  it("probeSpatialBriefingQueryV0 detects Turkish nearby prompts", () => {
    expect(probeSpatialBriefingQueryV0("Bana etrafı anlat").active).toBe(true);
    expect(probeSpatialBriefingQueryV0("Neredeyim?").active).toBe(true);
    expect(probeSpatialBriefingQueryV0("Merhaba").active).toBe(false);
  });

  it("buildSpatialLiveContextBoostV0 forbids invented landmarks when POI empty", () => {
    const boost = buildSpatialLiveContextBoostV0("etrafı anlat", { locale: "tr" });
    expect(boost?.active).toBe(true);
    expect(boost?.promptDirective).toMatch(/UYDURMA|uydurma/i);
    expect(boost?.emptyLabel).toMatch(/heykel|park/i);
    expect(boost?.lines).toEqual([]);
  });

  it("haversineMetersV0 is near zero for same point", () => {
    expect(haversineMetersV0(41.04, 29.01, 41.04, 29.01)).toBeLessThan(1);
  });
});

import { describe, expect, it } from "vitest";
import {
  resolveRhizohDegradeCopyV1,
  RHIZOH_DEGRADE_KIND_V1
} from "../rhizohExperienceDegradeCopyV1.js";

describe("rhizohExperienceDegradeCopyV1", () => {
  it("uses human language not fatal errors", () => {
    const mic = resolveRhizohDegradeCopyV1(RHIZOH_DEGRADE_KIND_V1.MIC_DENIED, true);
    expect(mic).toMatch(/Yazışarak devam/i);
    expect(mic).not.toMatch(/Fatal|Initialization failed/i);
  });

  it("covers map and invite degrade kinds", () => {
    expect(resolveRhizohDegradeCopyV1(RHIZOH_DEGRADE_KIND_V1.MAP_FAILED, true)).toMatch(/Harita/i);
    expect(resolveRhizohDegradeCopyV1(RHIZOH_DEGRADE_KIND_V1.INVITE_BROKEN, true)).toMatch(/Davet linki/i);
    expect(resolveRhizohDegradeCopyV1(RHIZOH_DEGRADE_KIND_V1.EVENT_NOT_FOUND, true)).toMatch(/etkinlik/i);
  });
});

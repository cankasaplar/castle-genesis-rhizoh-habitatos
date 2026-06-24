import { describe, expect, it } from "vitest";
import {
  RHIZOH_OUTPUT_ENGINE_SCHEMA_V0,
  buildRhizohOutputPackV0,
  buildSubtitleCuesFromShotListV0,
  formatRhizohOutputPackMarkdownV0
} from "../rhizohOutputEngineV0.js";

describe("rhizohOutputEngineV0", () => {
  it("builds subtitle cues with cumulative timing", () => {
    const cues = buildSubtitleCuesFromShotListV0([
      { beat: 1, id: "a", durationSec: 5, narratorLine: "hi", scene: "open", captureUrl: "/a" },
      { beat: 2, id: "b", durationSec: 10, narratorLine: "mid", scene: "mid", captureUrl: "/b" }
    ]);
    expect(cues[0].startSec).toBe(0);
    expect(cues[0].endSec).toBe(5);
    expect(cues[1].startSec).toBe(5);
    expect(cues[1].endSec).toBe(15);
  });

  it("builds output pack with chess and sports programs", () => {
    const pack = buildRhizohOutputPackV0({ locale: "en" });
    expect(pack.schema).toBe(RHIZOH_OUTPUT_ENGINE_SCHEMA_V0);
    expect(pack.programs).toHaveLength(2);
    expect(pack.uploadChecklist.length).toBeGreaterThan(0);
    expect(pack.totalDurationSecTarget).toBe(110);
    expect(pack.markdown).toContain("Rhizoh Output Pack");
  });

  it("formats markdown with checklist and subtitles", () => {
    const pack = buildRhizohOutputPackV0({ locale: "tr" });
    const md = formatRhizohOutputPackMarkdownV0(pack);
    expect(md).toContain("Upload checklist");
    expect(md).toContain("Chess");
  });
});

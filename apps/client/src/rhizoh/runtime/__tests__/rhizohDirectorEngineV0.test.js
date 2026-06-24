import { describe, expect, it } from "vitest";
import {
  DIRECTOR_SCENE_KIND_V0,
  buildRhizohDirectorTimelineV0
} from "../rhizohDirectorEngineV0.js";
import { compileRhizohSoraPromptPackV0 } from "../rhizohSoraPromptCompilerV0.js";

describe("rhizohDirectorEngineV0", () => {
  it("builds director timeline with program beats", () => {
    const timeline = buildRhizohDirectorTimelineV0({ locale: "en" });
    expect(timeline.schema).toContain("director_engine");
    expect(timeline.programSceneCount).toBe(6);
    expect(timeline.renderLayer.apiAvailable).toBe(false);
    expect(timeline.scenes.some((s) => s.kind === DIRECTOR_SCENE_KIND_V0.PROGRAM_BEAT)).toBe(true);
  });

  it("compiles sora prompt pack without API", () => {
    const timeline = buildRhizohDirectorTimelineV0({ locale: "tr" });
    const pack = compileRhizohSoraPromptPackV0(timeline, { locale: "tr", limit: 3 });
    expect(pack.apiAvailable).toBe(false);
    expect(pack.promptCount).toBe(3);
    expect(pack.prompts[0].prompt).toContain("gözlem");
  });
});

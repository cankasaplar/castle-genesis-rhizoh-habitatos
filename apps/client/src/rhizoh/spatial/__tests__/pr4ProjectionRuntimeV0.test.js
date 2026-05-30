import { describe, it, expect } from "vitest";
import {
  PROJECTION_INTENT_BARRIER_LAW_V0,
  assertNoHumanIntentInferenceInArtifactV0,
  assertProjectionBundleKeyAllowlistV0
} from "../spatialProjectionBarrierV0.js";
import { deriveAnchorConditionedProjectionCueV0 } from "../spatialProjectionRuntimeV0.js";
import { derivePresenceFieldV0 } from "../presenceFieldRuntimeV0.js";
import { routeDirectionalAudioForAnchorV0 } from "../spatialAudioRuntimeV0.js";

describe("spatialProjectionBarrierV0", () => {
  it("states intent barrier law", () => {
    expect(PROJECTION_INTENT_BARRIER_LAW_V0).toContain("may not infer human intent");
  });

  it("rejects human intent smuggling keys", () => {
    expect(assertNoHumanIntentInferenceInArtifactV0({ deskGlow: 0.5, userMood: "tired" }).ok).toBe(false);
    expect(assertNoHumanIntentInferenceInArtifactV0({ projectionHaze01: 0.1 }).ok).toBe(true);
  });

  it("allowlists projection cue bundles", () => {
    const cue = deriveAnchorConditionedProjectionCueV0({
      primaryAnchorId: "desk-anchor",
      atmosphereExposure01: 0.6,
      hypothesisConfidence01: 0.74
    });
    const gate = assertProjectionBundleKeyAllowlistV0(cue, [
      "schema",
      "projectionHaze01",
      "wallWash01",
      "deskFocusGlow01",
      "exposureLift01"
    ]);
    expect(gate.ok).toBe(true);
    const intent = assertNoHumanIntentInferenceInArtifactV0(cue);
    expect(intent.ok).toBe(true);
  });
});

describe("spatialProjectionRuntimeV0", () => {
  it("increases desk focus glow when desk anchor + hypothesis weight (not agent)", () => {
    const low = deriveAnchorConditionedProjectionCueV0({
      primaryAnchorId: "desk-anchor",
      hypothesisConfidence01: 0.1
    });
    const high = deriveAnchorConditionedProjectionCueV0({
      primaryAnchorId: "desk-anchor",
      hypothesisConfidence01: 0.9
    });
    expect(high.deskFocusGlow01).toBeGreaterThan(low.deskFocusGlow01);
  });

  it("north wall raises wall wash vs desk-primary", () => {
    const wall = deriveAnchorConditionedProjectionCueV0({ primaryAnchorId: "north-wall" });
    const desk = deriveAnchorConditionedProjectionCueV0({ primaryAnchorId: "desk-anchor" });
    expect(wall.wallWash01).toBeGreaterThan(desk.wallWash01);
  });
});

describe("presenceFieldRuntimeV0", () => {
  it("derives numeric field only", () => {
    const f = derivePresenceFieldV0({
      auraBase01: 0.5,
      projectionDeskGlowBorrow01: 0.6,
      focusHint01: 0.7
    });
    expect(f.schema).toContain("presenceField");
    expect(assertNoHumanIntentInferenceInArtifactV0(f).ok).toBe(true);
  });
});

describe("spatialAudioRuntimeV0", () => {
  it("routes desk vs window with different zones", () => {
    const d = routeDirectionalAudioForAnchorV0("desk-anchor");
    const w = routeDirectionalAudioForAnchorV0("window-anchor");
    expect(d.zoneId).not.toBe(w.zoneId);
    expect(assertNoHumanIntentInferenceInArtifactV0(d).ok).toBe(true);
  });
});

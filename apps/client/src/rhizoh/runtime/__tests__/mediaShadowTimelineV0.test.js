import { describe, expect, it, beforeEach } from "vitest";
import {
  MEDIA_EVENT_TYPE_V0,
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0,
  resetMediaEventAdapterForTestV0
} from "../mediaEventAdapterV0.js";
import {
  MEDIA_SHADOW_BRANCH_ID_V0,
  buildMediaShadowTimelineViewV0,
  deriveMediaShadowOutcomeV0,
  resetMediaShadowTimelineForTestV0
} from "../mediaShadowTimelineV0.js";
import { resetCrossSpaceCausalFusionForTestV0 } from "../crossSpaceCausalFusionV0.js";

describe("mediaShadowTimelineV0", () => {
  beforeEach(() => {
    resetMediaShadowTimelineForTestV0();
    resetMediaEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("derives immersive branch for playhead", () => {
    const normalized = normalizeMediaTimelineEventV0({
      eventType: MEDIA_EVENT_TYPE_V0.PLAYHEAD,
      positionSec: 300
    });
    const outcome = deriveMediaShadowOutcomeV0(normalized);
    expect(outcome.branchId).toBe(MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE);
    expect(outcome.attentionScore01).toBeGreaterThan(0);
  });

  it("ingest wires media shadow entry", () => {
    const result = ingestMediaTimelineEventV0(
      normalizeMediaTimelineEventV0({ title: "Doc", eventType: "playhead" }),
      { dispatchEvent: false }
    );
    expect(result.shadowEntry?.shadow?.branchId).toBe(MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE);
    expect(buildMediaShadowTimelineViewV0().eventCount).toBe(1);
  });
});

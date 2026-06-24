import { describe, expect, it, beforeEach } from "vitest";
import {
  buildGoSpacetimeObservationEnvelopeV0,
  GO_CAUSAL_SPACE_ID_V0
} from "../goSpacetimeObservationEnvelopeV0.js";

describe("goSpacetimeObservationEnvelopeV0", () => {
  it("builds envelope with causal space and world anchor", () => {
    const env = buildGoSpacetimeObservationEnvelopeV0({
      nodeId: "go_arena",
      channelId: "rhizoh_go_learning",
      mapPinSource: "map:node:go",
      locale: "tr"
    });
    expect(env.causalSpaceId).toBe(GO_CAUSAL_SPACE_ID_V0);
    expect(env.worldAnchor.nodeId).toBe("go_arena");
    expect(env.worldAnchor.channelId).toBe("rhizoh_go_learning");
    expect(env.observationWindow.phaseId).toBeTruthy();
    expect(env.interpretationOnly).toBe(true);
  });
});

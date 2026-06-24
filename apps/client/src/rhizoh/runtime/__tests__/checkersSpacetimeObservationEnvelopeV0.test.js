import { describe, expect, it, beforeEach } from "vitest";
import {
  buildCheckersSpacetimeObservationEnvelopeV0,
  CHECKERS_CAUSAL_SPACE_ID_V0
} from "../checkersSpacetimeObservationEnvelopeV0.js";

describe("checkersSpacetimeObservationEnvelopeV0", () => {
  it("builds envelope with causal space and world anchor", () => {
    const env = buildCheckersSpacetimeObservationEnvelopeV0({
      nodeId: "checkers_arena",
      channelId: "rhizoh_checkers_learning",
      mapPinSource: "map:node:checkers",
      locale: "tr"
    });
    expect(env.causalSpaceId).toBe(CHECKERS_CAUSAL_SPACE_ID_V0);
    expect(env.worldAnchor.nodeId).toBe("checkers_arena");
    expect(env.interpretationOnly).toBe(true);
  });
});

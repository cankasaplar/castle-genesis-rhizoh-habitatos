import { describe, expect, it, beforeEach } from "vitest";
import {
  CAUSAL_SPACE_ID_V0,
  clearSportsCausalSpacesForTestV0,
  openSportsCausalSpaceV0,
  readSportsSpaceEventsV0
} from "../sportsCausalSpaceV0.js";
import {
  deriveSportsDriftSignalsV0,
  mapSportsSignalToReasonCategoryV0,
  SPORTS_DRIFT_SIGNAL_V0
} from "../sportsDriftMapperV0.js";
import {
  ingestSportsMatchEventV0,
  normalizeSportsMatchEventV0,
  SPORTS_EVENT_TYPE_V0
} from "../sportsEventAdapterV0.js";
import { applySportsUglEventV0, getSportsUglAdapterV0 } from "../rhizohUglSportsAdapterV0.js";
import { DOMAIN_COVERAGE_V0 } from "../rhizohDomainFabricV0.js";
import { routeUglEventV0, clearArenaRouterLogForTestV0 } from "../rhizohArenaRouterV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "../rhizohUglSchemaV0.js";
import { exploreEpistemicSpaceV0 } from "../../ticket/cognitiveActionLayerV0.js";
import { onUserTraverseSpaceV0 } from "../../ticket/cognitiveUxLayerV0.js";
import { __resetUglEventStreamForTestV0 } from "../rhizohUglEventV0.js";

describe("sportsCausalSpaceV0", () => {
  beforeEach(() => clearSportsCausalSpacesForTestV0());

  it("registers chess and sports causal spaces", () => {
    const space = openSportsCausalSpaceV0({
      matchId: "m1",
      teamA: "Galatasaray",
      teamB: "Fenerbahce"
    });
    expect(space.spaceId).toBe(CAUSAL_SPACE_ID_V0.SPORTS);
    expect(space.entities.length).toBe(2);
  });
});

describe("sportsDriftMapperV0", () => {
  it("maps score swing to SC and performance spike to ENTROPY_DRIFT", () => {
    expect(mapSportsSignalToReasonCategoryV0(SPORTS_DRIFT_SIGNAL_V0.SCORE_SWING)).toBe("SC");
    expect(mapSportsSignalToReasonCategoryV0(SPORTS_DRIFT_SIGNAL_V0.PERFORMANCE_SPIKE)).toBe(
      "ENTROPY_DRIFT"
    );
  });

  it("derives multiple signals from score_delta event", () => {
    const ev = normalizeSportsMatchEventV0({
      eventType: SPORTS_EVENT_TYPE_V0.SCORE_DELTA,
      matchId: "m1",
      delta: 2
    });
    const signals = deriveSportsDriftSignalsV0(ev);
    expect(signals.some((s) => s.category === "SC")).toBe(true);
  });
});

describe("sportsEventAdapterV0", () => {
  beforeEach(() => {
    clearSportsCausalSpacesForTestV0();
    __resetUglEventStreamForTestV0();
  });

  it("ingests event-dense sports event into causal space", () => {
    const normalized = normalizeSportsMatchEventV0({
      eventType: SPORTS_EVENT_TYPE_V0.MOMENTUM_SHIFT,
      matchId: "m2",
      momentumDelta: 0.4
    });
    const ingested = ingestSportsMatchEventV0(normalized, { appendUgl: false, dispatchEvent: false });
    expect(ingested.signals.length).toBeGreaterThan(0);
    expect(readSportsSpaceEventsV0("m2").length).toBe(1);
  });
});

describe("rhizohUglSportsAdapterV0", () => {
  beforeEach(() => {
    clearSportsCausalSpacesForTestV0();
    __resetUglEventStreamForTestV0();
    clearArenaRouterLogForTestV0();
  });

  it("exposes EVENT_ACTIVE coverage and event-dense apply", () => {
    const adapter = getSportsUglAdapterV0();
    expect(adapter.coverage).toBe(DOMAIN_COVERAGE_V0.EVENT_ACTIVE);
    expect(adapter.eventModel).toBe("event_dense");

    const result = applySportsUglEventV0({
      eventType: SPORTS_EVENT_TYPE_V0.PLAYER_ACTION,
      matchId: "m3",
      anomalyScore: 0.8
    });
    expect(result.eventDense).toBe(true);
    expect(result.ingested.signals.some((s) => s.category === "ENTROPY_DRIFT")).toBe(true);
  });

  it("routes sports UGL events through arena router", () => {
    const result = applySportsUglEventV0({
      eventType: SPORTS_EVENT_TYPE_V0.SCORE_DELTA,
      matchId: "m4",
      delta: 1
    });
    const route = routeUglEventV0(result.ingested.uglEvent);
    expect(route.domainId).toBe("sports");
    expect(route.routable).toBe(true);
    expect(route.coverage).toBe(DOMAIN_COVERAGE_V0.EVENT_ACTIVE);
  });
});

describe("CAL space traversal", () => {
  beforeEach(() => {
    clearSportsCausalSpacesForTestV0();
    __resetUglEventStreamForTestV0();
  });

  it("exploreEpistemicSpaceV0 returns sports event lineage", () => {
    applySportsUglEventV0({
      eventType: SPORTS_EVENT_TYPE_V0.MATCH_EVENT,
      matchId: "m5",
      detail: "kickoff"
    });
    const exploration = exploreEpistemicSpaceV0({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      matchId: "m5"
    });
    expect(exploration.traversalMode).toBe("space_level");
    expect(exploration.sportsEventLineage.length).toBeGreaterThan(0);
  });

  it("onUserTraverseSpaceV0 is read_only", () => {
    const packet = onUserTraverseSpaceV0({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      matchId: "m6",
      dispatchEvent: false
    });
    expect(packet.executionClass).toBe("read_only");
    expect(packet.spaceId).toBe(CAUSAL_SPACE_ID_V0.SPORTS);
  });
});

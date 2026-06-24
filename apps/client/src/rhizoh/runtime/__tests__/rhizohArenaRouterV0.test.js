import { describe, expect, it, beforeEach } from "vitest";
import {
  DOMAIN_COVERAGE_V0,
  getDomainFabricSnapshotV0,
  normalizeSportScoreboardV0,
  resolveDomainDescriptorV0
} from "../rhizohDomainFabricV0.js";
import {
  clearArenaRouterLogForTestV0,
  resolveArenaForGameTypeV0,
  routeUglEventV0
} from "../rhizohArenaRouterV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "../rhizohUglSchemaV0.js";
import { buildUglEventV0 } from "../rhizohUglEventV0.js";
import { initChessUglStateV0 } from "../rhizohUglChessAdapterV0.js";

describe("rhizohDomainFabricV0", () => {
  it("reports chess full_active and sports not_instantiated", () => {
    const snap = getDomainFabricSnapshotV0();
    expect(snap.uglComplete).toBe(true);
    expect(snap.domainComplete).toBe(true);
    expect(snap.activeDomainCount).toBe(4);

    const chess = resolveDomainDescriptorV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS);
    expect(chess.coverage).toBe(DOMAIN_COVERAGE_V0.FULL_ACTIVE);

    const go = resolveDomainDescriptorV0(RHIZOH_UGL_GAME_TYPE_V0.GO);
    expect(go.coverage).toBe(DOMAIN_COVERAGE_V0.EVENT_ACTIVE);

    const sports = resolveDomainDescriptorV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS);
    expect(sports.coverage).toBe(DOMAIN_COVERAGE_V0.EVENT_ACTIVE);
    expect(sports.causalSpaceId).toBe("sports.causal.space");
    expect(sports.actionTypes).toContain("score_delta");
  });

  it("normalizes sport scoreboard schema", () => {
    const board = normalizeSportScoreboardV0({ homeScore: 2, awayScore: 1, momentum01: 0.7 });
    expect(board.schema).toContain("sport_scoreboard");
    expect(board.momentum01).toBeCloseTo(0.7, 2);
  });
});

describe("rhizohArenaRouterV0", () => {
  beforeEach(() => {
    clearArenaRouterLogForTestV0();
  });

  it("routes chess UGL events to chess adapter", () => {
    const event = buildUglEventV0({
      s: initChessUglStateV0(),
      a: {},
      sNext: initChessUglStateV0(),
      r: { total: 0.1 },
      gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS
    });
    const route = routeUglEventV0(event);
    expect(route.domainId).toBe("chess");
    expect(route.routable).toBe(true);
    expect(route.adapterId).toBe("rhizohUglChessAdapterV0");
    expect(route.executionGranted).toBe(true);
    expect(route.scheduler?.spaceId).toBe("chess.causal.space");
  });

  it("routes sports with scheduler executionGranted false outside burst", () => {
    const route = routeUglEventV0({
      meta: { gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS, causalChainId: "ugl_sports_1" }
    });
    expect(route.domainId).toBe("sports");
    expect(route.routable).toBe(true);
    expect(route.executionGranted).toBe(false);
    expect(route.scheduler?.spaceId).toBe("sports.causal.space");
  });

  it("resolveArenaForGameTypeV0 returns adapter for chess", () => {
    const arena = resolveArenaForGameTypeV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS);
    expect(arena.adapter?.gameType).toBe("chess");
  });
});

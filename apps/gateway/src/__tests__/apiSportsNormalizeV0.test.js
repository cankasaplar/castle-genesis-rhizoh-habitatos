import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inferSportPhaseV0,
  normalizeApiSportsFootballFixturesV0,
  normalizeApiSportsBasketballGamesV0,
  partitionSportMatchesV0
} from "../rhizoh/apiSportsNormalizeV0.js";

describe("apiSportsNormalizeV0", () => {
  it("infers football live phase", () => {
    assert.equal(inferSportPhaseV0("football", "1H"), "live");
    assert.equal(inferSportPhaseV0("football", "FT"), "finished");
    assert.equal(inferSportPhaseV0("football", "NS"), "scheduled");
  });

  it("normalizes football fixtures", () => {
    const rows = normalizeApiSportsFootballFixturesV0({
      response: [
        {
          fixture: { id: 99, date: "2026-06-15T18:00:00+00:00", status: { short: "1H", elapsed: 34 } },
          league: { name: "World Cup", country: "World" },
          teams: { home: { name: "Turkey" }, away: { name: "Brazil" } },
          goals: { home: 1, away: 0 }
        }
      ]
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].sport, "football");
    assert.equal(rows[0].phase, "live");
    assert.equal(rows[0].homeScore, 1);
    assert.equal(rows[0].minute, 34);
  });

  it("normalizes basketball games", () => {
    const rows = normalizeApiSportsBasketballGamesV0({
      response: [
        {
          id: 12,
          date: "2026-06-15T20:00:00+00:00",
          status: { short: "Q3" },
          league: { name: "NBA" },
          teams: { home: { name: "Lakers" }, away: { name: "Celtics" } },
          scores: { home: { total: 78 }, away: { total: 81 } }
        }
      ]
    });
    assert.equal(rows[0].sport, "basketball");
    assert.equal(rows[0].phase, "live");
    assert.equal(rows[0].awayScore, 81);
  });

  it("partitions live and upcoming", () => {
    const rows = [
      { id: "a", phase: "live" },
      { id: "b", phase: "scheduled" },
      { id: "c", phase: "scheduled" }
    ];
    const p = partitionSportMatchesV0(rows, { liveLimit: 5, upcomingLimit: 1 });
    assert.equal(p.live.length, 1);
    assert.equal(p.upcoming.length, 1);
  });
});

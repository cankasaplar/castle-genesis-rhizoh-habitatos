import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inferFootballDataPhaseV0,
  normalizeFootballDataMatchV0,
  normalizeFootballDataMatchesPayloadV0
} from "../rhizoh/footballDataNormalizeV0.js";

describe("footballDataNormalizeV0", () => {
  it("infers live from IN_PLAY", () => {
    assert.equal(inferFootballDataPhaseV0("IN_PLAY"), "live");
    assert.equal(inferFootballDataPhaseV0("SCHEDULED"), "scheduled");
    assert.equal(inferFootballDataPhaseV0("FINISHED"), "finished");
  });

  it("normalizes a world cup style match", () => {
    const row = normalizeFootballDataMatchV0({
      id: 42,
      utcDate: "2026-06-15T18:00:00Z",
      status: "IN_PLAY",
      minute: 55,
      competition: { name: "FIFA World Cup", code: "WC" },
      homeTeam: { name: "Turkey" },
      awayTeam: { name: "Brazil" },
      score: { fullTime: { home: 1, away: 0 } }
    });
    assert.equal(row?.sport, "football");
    assert.equal(row?.phase, "live");
    assert.equal(row?.homeScore, 1);
    assert.equal(row?.minute, 55);
    assert.match(row?.league || "", /World Cup/i);
  });

  it("normalizes matches payload", () => {
    const rows = normalizeFootballDataMatchesPayloadV0({
      matches: [
        {
          id: 1,
          status: "SCHEDULED",
          homeTeam: { name: "A" },
          awayTeam: { name: "B" },
          competition: { code: "WC" }
        }
      ]
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].phase, "scheduled");
  });
});

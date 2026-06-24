import { describe, expect, it } from "vitest";
import {
  buildWorldMapSportsNewsLinesV0,
  formatSportMatchChipV0,
  normalizeWorldMapLiveFeedV0
} from "../worldMapLiveFeedV0.js";

describe("worldMapLiveFeedV0", () => {
  it("normalizes gateway world feed payload", () => {
    const snap = normalizeWorldMapLiveFeedV0({
      ok: true,
      fetchedAt: 1000,
      sports: { source: "api-sports", live: [], upcoming: [] },
      news: { provider: "newsdata", headlines: [] }
    });
    expect(snap?.sports?.source).toBe("api-sports");
    expect(snap?.news?.provider).toBe("newsdata");
  });

  it("formats live football chip", () => {
    const chip = formatSportMatchChipV0(
      {
        sport: "football",
        phase: "live",
        homeName: "Turkey",
        awayName: "Brazil",
        homeScore: 1,
        awayScore: 0,
        minute: 34
      },
      "tr"
    );
    expect(chip).toContain("Turkey");
    expect(chip).toContain("1-0");
    expect(chip).toContain("34");
  });

  it("formats scheduled football chip", () => {
    const chip = formatSportMatchChipV0(
      {
        sport: "football",
        phase: "scheduled",
        homeName: "Galatasaray",
        awayName: "Fenerbahçe",
        startTimeIso: "2026-06-20T18:00:00Z"
      },
      "tr"
    );
    expect(chip).toContain("Galatasaray");
    expect(chip).toContain("Fenerbahçe");
    expect(chip).toContain("vs");
  });

  it("builds sports and news lines", () => {
    const feed = normalizeWorldMapLiveFeedV0({
      sports: {
        live: [
          {
            sport: "football",
            phase: "live",
            homeName: "A",
            awayName: "B",
            homeScore: 2,
            awayScore: 2,
            minute: 80
          }
        ],
        upcoming: []
      },
      news: {
        headlines: [{ title: "World Cup opener set" }]
      }
    });
    const lines = buildWorldMapSportsNewsLinesV0(feed, "en");
    expect(lines.hasSports).toBe(true);
    expect(lines.newsLine).toContain("World Cup opener set");
  });
});

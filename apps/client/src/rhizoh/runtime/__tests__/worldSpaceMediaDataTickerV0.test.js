import { describe, expect, it } from "vitest";
import {
  buildMediaTubeTickerFallbackNoteV0,
  buildMediaTubeTickerSegmentsV0
} from "../worldSpaceMediaDataTickerV0.js";

describe("worldSpaceMediaDataTickerV0", () => {
  it("builds segments from weather and feed", () => {
    const segments = buildMediaTubeTickerSegmentsV0({
      locale: "tr",
      weather: { line: "Açık · 18°C · rüzgar 12 km/s" },
      feed: {
        sports: { source: "football-data.org", live: [], upcoming: [] },
        news: { provider: "none", headlines: [] }
      }
    });
    expect(segments.some((s) => s.includes("İstanbul"))).toBe(true);
    expect(segments.some((s) => s.includes("Open-Meteo"))).toBe(true);
  });

  it("explains gateway config in fallback note", () => {
    const note = buildMediaTubeTickerFallbackNoteV0("tr");
    expect(note.length).toBeGreaterThan(10);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeGuardianHeadlinesV0,
  normalizeNewsDataHeadlinesV0,
  resolveNewsFeedLocaleV0
} from "../rhizoh/liveNewsHeadlinesV0.js";

describe("liveNewsHeadlinesV0", () => {
  it("normalizes NewsData rows", () => {
    const rows = normalizeNewsDataHeadlinesV0({
      results: [{ title: "Dünya Kupası başlıyor", link: "https://x.test/a", source_name: "AA", pubDate: "2026-06-01" }]
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "Dünya Kupası başlıyor");
    assert.equal(rows[0].source, "AA");
  });

  it("resolves locale from query params with env fallback", () => {
    const prevCountry = process.env.CASTLE_NEWS_COUNTRY;
    const prevLanguage = process.env.CASTLE_NEWS_LANGUAGE;
    process.env.CASTLE_NEWS_COUNTRY = "tr";
    process.env.CASTLE_NEWS_LANGUAGE = "tr";
    try {
      const locale = resolveNewsFeedLocaleV0(new URLSearchParams("country=fi&language=en"));
      assert.equal(locale.country, "fi");
      assert.equal(locale.language, "en");
    } finally {
      if (prevCountry === undefined) delete process.env.CASTLE_NEWS_COUNTRY;
      else process.env.CASTLE_NEWS_COUNTRY = prevCountry;
      if (prevLanguage === undefined) delete process.env.CASTLE_NEWS_LANGUAGE;
      else process.env.CASTLE_NEWS_LANGUAGE = prevLanguage;
    }
  });

  it("normalizes Guardian rows", () => {
    const rows = normalizeGuardianHeadlinesV0({
      response: {
        results: [{ webTitle: "World Cup 2026", webUrl: "https://guardian.test/wc", webPublicationDate: "2026-06-01" }]
      }
    });
    assert.equal(rows[0].source, "The Guardian");
    assert.match(rows[0].title, /World Cup/);
  });
});

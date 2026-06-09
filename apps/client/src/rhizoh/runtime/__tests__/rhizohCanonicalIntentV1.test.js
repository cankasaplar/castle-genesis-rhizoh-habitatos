import { describe, expect, it, beforeEach } from "vitest";
import {
  CANONICAL_INTENT_V1,
  probeCanonicalIntentV1,
  buildCanonicalFeatureBagV1,
  normalizeCanonicalTokensV1,
  scoreIntentV1,
  canonicalIntentToPrecheckV1
} from "../rhizohCanonicalIntentV1.js";
import { runFastPrecheckFromTextV0 } from "../rhizohFastPrecheckV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohCanonicalIntentV1", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("order-invariant GREETING_WAKE for entity + greeting (any order)", () => {
    for (const text of [
      "hola rhizoh",
      "rhizoh merhaba",
      "merhaba rezo",
      "Resol, merhaba",
      "rezo, merhaba",
      "Merhaba Erizo"
    ]) {
      const hit = probeCanonicalIntentV1(text);
      expect(hit?.canonicalIntent, text).toBe(CANONICAL_INTENT_V1.GREETING_WAKE);
      expect(hit?.entity).toBe("rhizoh");
    }
  });

  it("detects TIME_QUERY without order dependency", () => {
    expect(probeCanonicalIntentV1("saat kaç")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.TIME_QUERY
    );
    expect(probeCanonicalIntentV1("what time is it")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.TIME_QUERY
    );
  });

  it("detects DATE_QUERY cross-surface", () => {
    expect(probeCanonicalIntentV1("bugünün tarihini söyler misin")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.DATE_QUERY
    );
    expect(probeCanonicalIntentV1("what is the date today")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.DATE_QUERY
    );
  });

  it("builds feature bag not string match", () => {
    const bag = buildCanonicalFeatureBagV1(normalizeCanonicalTokensV1("hola rezo").tokens);
    expect(bag.features.has("greeting")).toBe(true);
    expect(bag.features.has("entity_rhizoh")).toBe(true);
    expect(bag.entity).toBe("rhizoh");
  });

  it("fast precheck routes through canonical layer first", () => {
    const hit = runFastPrecheckFromTextV0("hola rhizoh");
    expect(hit?.source).toBe("canonical_intent_v1");
    expect(hit?.intent).toBe("greeting");
    expect(hit?.canonicalIntent).toBe(CANONICAL_INTENT_V1.GREETING_WAKE);
    expect(hit?.reply).toMatch(/buradayım|here/i);
  });

  it("spanish greeting wake bypasses regex order", () => {
    const hit = runFastPrecheckFromTextV0("hola rezo");
    expect(hit?.canonicalIntent).toBe(CANONICAL_INTENT_V1.GREETING_WAKE);
  });

  it("SYSTEM_STATUS and PRESENCE_QUERY stay local (no LLM)", () => {
    expect(probeCanonicalIntentV1("sistem durumu nedir")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.SYSTEM_STATUS
    );
    expect(probeCanonicalIntentV1("ne yapıyorsun")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.PRESENCE_QUERY
    );
    expect(probeCanonicalIntentV1("hava nasıl")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.WEATHER_STUB
    );
  });

  it("system status reply uses reflex snapshot", async () => {
    const { formatSystemStatusReplyV1 } = await import("../rhizohCanonicalReflexSnapshotV1.js");
    const reply = formatSystemStatusReplyV1("tr", {
      gatewayConnected: true,
      voiceReady: true
    });
    expect(reply).toMatch(/gateway|Sistem|hazır/i);
  });

  it("substantive planning utterances do not project chat_invite", () => {
    for (const text of [
      "İstanbul'da neler yapabilirim?",
      "Bu güzel havada neler yapabiliriz?",
      "Burada nerede gezebilirim?"
    ]) {
      expect(probeCanonicalIntentV1(text)?.canonicalIntent, text).not.toBe(
        CANONICAL_INTENT_V1.CHAT_INVITE
      );
    }
  });

  it("short chat invites still project chat_invite", () => {
    expect(probeCanonicalIntentV1("sohbet edelim")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.CHAT_INVITE
    );
    expect(probeCanonicalIntentV1("Bugün neler yapabiliriz?")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.CHAT_INVITE
    );
  });

  it("does not treat duyamadım phantom as hearing_check reflex", () => {
    expect(probeCanonicalIntentV1("Bir şey duyamadım. Bu konu biraz daha yakın olmuştur.")).toBeNull();
    expect(
      runFastPrecheckFromTextV0("Bir şey duyamadım. Bu konu biraz daha yakın olmuştur.")
    ).toBeNull();
  });

  it("detects hava durumunu as weather without nasıl", () => {
    expect(probeCanonicalIntentV1("hava durumunu söyler misin")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.WEATHER_STUB
    );
    expect(runFastPrecheckFromTextV0("Hava durumunu söyler misin Rizo?")?.intent).toMatch(
      /weather/
    );
  });

  it("collapses Evizo to greeting wake", () => {
    expect(probeCanonicalIntentV1("Merhaba Evizo.")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.GREETING_WAKE
    );
  });

  it("thanks wins over chat_invite in composite utterance", () => {
    const hit = probeCanonicalIntentV1("Teşekkür ederim. Biraz sohbet edelim.");
    expect(hit?.canonicalIntent).toBe(CANONICAL_INTENT_V1.THANKS);
    expect(runFastPrecheckFromTextV0("Teşekkür ederim. Biraz sohbet edelim.")?.intent).toBe(
      "thanks"
    );
  });

  it("scores live intents for traffic sports and news", () => {
    expect(probeCanonicalIntentV1("trafik nasıl")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.TRAFFIC_QUERY
    );
    expect(probeCanonicalIntentV1("canlı skor ne")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.SPORTS_LIVE
    );
    expect(probeCanonicalIntentV1("gündem haberleri")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.NEWS_HEADLINES
    );
    expect(runFastPrecheckFromTextV0("trafik ne durumda")?.intent).toBe("traffic_query");
    expect(runFastPrecheckFromTextV0("son dakika haberler")?.intent).toBe("news_headlines");
  });

  it("weather wins over today token in bugün hava nasıl", () => {
    const norm = normalizeCanonicalTokensV1("bugün hava nasıl");
    const bag = buildCanonicalFeatureBagV1(norm.tokens);
    const scores = scoreIntentV1(norm, bag);
    expect(scores[CANONICAL_INTENT_V1.WEATHER_LIVE]).toBeGreaterThan(0);
    expect(probeCanonicalIntentV1("bugün hava nasıl")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.WEATHER_STUB
    );
  });

  it("sports wins over news for spor haberleri composite", () => {
    expect(probeCanonicalIntentV1("bugünkü spor haberleri")?.canonicalIntent).toBe(
      CANONICAL_INTENT_V1.SPORTS_LIVE
    );
  });

  it("live reflex precheck includes snapshot metadata", () => {
    const hit = probeCanonicalIntentV1("trafik yoğun mu");
    const mapped = canonicalIntentToPrecheckV1(hit, "tr");
    expect(mapped?.intent).toBe("traffic_query");
    expect(mapped?.snapshotVersion).toBe("2.1");
    expect(mapped?.reply).toMatch(/trafik|yoğun|offline/i);
  });
});

/**
 * Rhizoh Live Context Engine v2 — memory + live world + spatial + action routing.
 *
 * This is an interpretation envelope for conversation, not an execution source.
 */

export const RHIZOH_LIVE_CONTEXT_ENGINE_SCHEMA_V2 = "rhizoh.live_context_engine.v2";

export const RHIZOH_CONTEXT_PRIORITY_V2 = Object.freeze({
  liveWorld: 0.4,
  spatial: 0.3,
  memory: 0.2,
  llmFallback: 0.1
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function textIncludesAnyV2(text, needles) {
  const t = String(text || "").toLowerCase();
  return needles.some((n) => t.includes(String(n).toLowerCase()));
}

export function classifyRhizohLiveContextIntentV2(message = "") {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return "ambient";
  if (textIncludesAnyV2(text, ["maç", "fener", "galatasaray", "beşiktaş", "score", "match", "football"])) {
    return "sports_live";
  }
  if (textIncludesAnyV2(text, ["hava", "weather", "yağmur", "rain", "sıcaklık"])) return "weather_live";
  if (textIncludesAnyV2(text, ["haber", "gündem", "news", "headline"])) return "news_live";
  if (textIncludesAnyV2(text, ["etraf", "yakın", "nearby", "around me", "neredeyim", "where am i"])) {
    return "spatial_briefing";
  }
  if (textIncludesAnyV2(text, ["ne yapalım", "what should", "sonra", "next"])) return "next_direction";
  if (textIncludesAnyV2(text, ["castle", "kale", "session", "görüşme"])) return "castle_session";
  return "general_context";
}

function normalizeLiveWorldV2(liveWorld = {}) {
  const sports = liveWorld.sports && typeof liveWorld.sports === "object" ? liveWorld.sports : null;
  const news = liveWorld.news && typeof liveWorld.news === "object" ? liveWorld.news : null;
  const sportRows = [
    ...(Array.isArray(sports?.live) ? sports.live : []),
    ...(Array.isArray(sports?.upcoming) ? sports.upcoming : []),
    ...(Array.isArray(sports?.liveMatches) ? sports.liveMatches : []),
    ...(Array.isArray(sports?.upcomingMatches) ? sports.upcomingMatches : [])
  ].slice(0, 3);
  const headlines = (Array.isArray(news?.headlines) ? news.headlines : [])
    .map((h) => String(h?.title || h).trim())
    .filter(Boolean)
    .slice(0, 3);
  return Object.freeze({
    available: Boolean(sports || news || liveWorld.weather || liveWorld.traffic),
    sports: Object.freeze({ available: sportRows.length > 0, rows: Object.freeze(sportRows) }),
    news: Object.freeze({ available: headlines.length > 0, headlines: Object.freeze(headlines) }),
    weather: liveWorld.weather || null,
    traffic: liveWorld.traffic || null,
    source: String(liveWorld.source || liveWorld.schema || "snapshot")
  });
}

function normalizeSpatialV2(spatial = {}) {
  return Object.freeze({
    label: String(spatial.label || spatial.anchorLabel || "Rhizoh alanı"),
    source: String(spatial.source || "unknown"),
    lat: Number.isFinite(Number(spatial.lat)) ? Number(spatial.lat) : null,
    lon: Number.isFinite(Number(spatial.lon)) ? Number(spatial.lon) : null,
    mapTool: String(spatial.mapTool || ""),
    worldData: spatial.worldData || null
  });
}

function normalizeMemoryV2(memory = {}) {
  const episodes = Array.isArray(memory.episodes) ? memory.episodes : [];
  const intents = Array.isArray(memory.intents) ? memory.intents : [];
  const spatial = Array.isArray(memory.spatial) ? memory.spatial : [];
  const narrative = Array.isArray(memory.narrative) ? memory.narrative : [];
  return Object.freeze({
    episodes: Object.freeze(episodes.slice(0, 3).map(String)),
    intents: Object.freeze(intents.slice(0, 3).map(String)),
    spatial: Object.freeze(spatial.slice(0, 3).map(String)),
    narrative: Object.freeze(narrative.slice(0, 3).map(String)),
    openLoopCount: Math.max(0, Number(memory.openLoopCount) || intents.length + narrative.length)
  });
}

function buildLiveInjectionV2(intent, liveWorld, spatial) {
  if (intent === "sports_live" && liveWorld.sports.available) {
    return Object.freeze({
      kind: "sports",
      line: "Live sports context is available.",
      source: liveWorld.source
    });
  }
  if (intent === "news_live" && liveWorld.news.available) {
    return Object.freeze({
      kind: "news",
      line: liveWorld.news.headlines[0] || "News context is available.",
      source: liveWorld.source
    });
  }
  if (intent === "spatial_briefing") {
    return Object.freeze({
      kind: "spatial",
      line: `${spatial.label} context is active.`,
      source: spatial.source
    });
  }
  if (liveWorld.available) {
    return Object.freeze({ kind: "ambient_live", line: "Live world context is attached.", source: liveWorld.source });
  }
  return null;
}

function normalizeSuggestedActionsV2(actions = []) {
  return Object.freeze(
    actions
      .filter(Boolean)
      .slice(0, 4)
      .map((action) =>
        Object.freeze({
          id: String(action.id || action.command || "action"),
          labelTr: String(action.labelTr || action.label || ""),
          labelEn: String(action.labelEn || action.label || ""),
          command: String(action.command || ""),
          confidence: Math.round(clamp01(action.confidence) * 100) / 100,
          source: String(action.source || "map_brain")
        })
      )
  );
}

/**
 * @param {{
 *   userMessage?: string,
 *   spatial?: object,
 *   memory?: object,
 *   liveWorld?: object,
 *   activeSession?: object | null,
 *   suggestedActions?: object[]
 * }} input
 */
export function buildRhizohLiveContextEnvelopeV2(input = {}) {
  const intent = classifyRhizohLiveContextIntentV2(input.userMessage || "");
  const liveWorld = normalizeLiveWorldV2(input.liveWorld || {});
  const spatial = normalizeSpatialV2(input.spatial || {});
  const memory = normalizeMemoryV2(input.memory || {});
  const liveInjection = buildLiveInjectionV2(intent, liveWorld, spatial);
  const suggestedActions = normalizeSuggestedActionsV2(input.suggestedActions || []);

  return Object.freeze({
    schema: RHIZOH_LIVE_CONTEXT_ENGINE_SCHEMA_V2,
    intent,
    priority: RHIZOH_CONTEXT_PRIORITY_V2,
    state: Object.freeze({
      spatial,
      memory,
      liveWorld,
      activeSession: input.activeSession || null
    }),
    liveInjection,
    suggestedActions,
    responseContract: Object.freeze({
      answer: "short",
      liveInjection: liveInjection ? "include_if_relevant" : "none",
      suggestedActions: suggestedActions.length ? "include_2_or_3" : "optional",
      rhythm: "answer_direction_discovery"
    })
  });
}

export function formatRhizohLiveContextActionLabelV2(action, locale = "tr") {
  return String(locale).toLowerCase().startsWith("tr") ? action?.labelTr || "" : action?.labelEn || "";
}

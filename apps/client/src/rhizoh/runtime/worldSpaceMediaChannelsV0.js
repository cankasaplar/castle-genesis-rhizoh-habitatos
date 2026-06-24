/**
 * World-space media tube channel SSOT — YouTube embeds + Castle Genesis live surface.
 * Embed default = short Honest Baseline VOD (not long narrative / sim-profile lore).
 */

export const CASTLE_GENESIS_LIVE_PAGE_V0 = "https://www.youtube.com/@CastleGenesis/live";
/** Official Castle Genesis YouTube channel — live embed + prod fallback when env unset. */
export const CASTLE_GENESIS_YOUTUBE_CHANNEL_ID_V0 = "UC24Uv9xXfNkEVO0s7huGQFA";
export const CASTLE_GENESIS_HOLDING_SLIDE_V0 = "/ops/youtube-test/castle-genesis-holding-slide.svg";
export const CASTLE_GENESIS_SHORT_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-short-embed-slide.svg";
export const CASTLE_GENESIS_CHESS_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-chess-embed-slide.svg";
export const CASTLE_GENESIS_GO_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-go-embed-slide.svg";
export const CASTLE_GENESIS_CHECKERS_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-checkers-embed-slide.svg";

/** NASA TV official YouTube channel — live embed primary. */
export const NASA_TV_YOUTUBE_CHANNEL_ID_V0 = "UCSI0uARq_cDIn6keDeXzqJg";
/** ISS Earth view — fallback when main NASA feed unavailable. */
export const NASA_ISS_EARTH_VIDEO_ID_V0 = "iYmvCUonukw";
export const NASA_ISS_EARTH_FALLBACK_VIDEO_ID_V0 = "21X5lGlDOfg";

/** @typedef {'youtube'|'local'|'castle_genesis_live'|'chess_cluster_live'|'go_cluster_live'|'world_sports_feed'|'world_news_feed'} WorldSpaceMediaChannelTypeV0 */

/**
 * @param {string} videoId
 * @param {{ mute?: boolean, controls?: boolean, startSec?: number, endSec?: number }} [opts]
 */
export function buildYoutubeEmbedUrlV0(videoId, opts = {}) {
  const id = String(videoId || "").trim();
  const mute = opts.mute !== false ? "1" : "0";
  const controls = opts.controls === true ? "1" : "0";
  const params = new URLSearchParams({
    autoplay: "1",
    mute,
    controls,
    rel: "0",
    modestbranding: "1"
  });
  const startSec = Number(opts.startSec);
  const endSec = Number(opts.endSec);
  if (Number.isFinite(startSec) && startSec > 0) params.set("start", String(Math.floor(startSec)));
  if (Number.isFinite(endSec) && endSec > 0) params.set("end", String(Math.floor(endSec)));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

/**
 * @param {string} channelId
 * @param {{ mute?: boolean }} [opts]
 */
export function buildYoutubeLiveChannelEmbedUrlV0(channelId, opts = {}) {
  const id = String(channelId || "").trim();
  if (!id) return "";
  const mute = opts.mute !== false ? "1" : "0";
  const controls = opts.controls === true ? "1" : "0";
  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(id)}&autoplay=1&mute=${mute}&controls=${controls}&rel=0`;
}

function readEnvV0(key) {
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    return String(env[key] || "").trim();
  } catch {
    return "";
  }
}

function readCastleGenesisChannelIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID") || CASTLE_GENESIS_YOUTUBE_CHANNEL_ID_V0;
}

function readCastleGenesisShortVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_SHORT_VIDEO_ID");
}

function readCastleGenesisChessVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID");
}

function readCastleGenesisGoVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_GO_VIDEO_ID");
}

function readCastleGenesisCheckersVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_CHECKERS_VIDEO_ID");
}

function readCastleGenesisArchitectureVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_ARCHITECTURE_VIDEO_ID");
}

/** Long-form test VOD — embed uses trim window only (no sim-profile narration in UI default). */
function readCastleGenesisFullVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_FULL_VIDEO_ID");
}

function readCastleGenesisFullEmbedEndSecV0() {
  const raw = Number(readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_FULL_EMBED_END_SEC"));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60;
}

function freezeYoutubeChannelV0(row) {
  return Object.freeze(row);
}

function freezeHoldingChannelV0(row) {
  return Object.freeze(row);
}

export const RHIZOH_LEARNING_CHANNEL_ID_V0 = "rhizoh_learning";
export const RHIZOH_GO_LEARNING_CHANNEL_ID_V0 = "rhizoh_go_learning";
export const RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0 = "rhizoh_checkers_learning";
export const RHIZOH_WORLDSPORTS_CHANNEL_ID_V0 = "world_sports";
export const RHIZOH_WORLD_NEWS_CHANNEL_ID_V0 = "world_news";

function readRhizohWorldSportsYoutubeVideoIdV0() {
  return readEnvV0("VITE_RHIZOH_WORLDSPORTS_YOUTUBE_VIDEO_ID");
}

function readRhizohWorldNewsYoutubeVideoIdV0() {
  return readEnvV0("VITE_RHIZOH_WORLDNEWS_YOUTUBE_VIDEO_ID");
}

/**
 * Live 8-camera chess cluster — embedded in World · Space media tube (not YouTube).
 */
export function buildRhizohLearningChannelV0() {
  return Object.freeze({
    id: RHIZOH_LEARNING_CHANNEL_ID_V0,
    titleTr: "Rhizoh Öğrenme Kanalı",
    titleEn: "Rhizoh Learning Channel",
    type: "chess_cluster_live",
    badgeTr: "Canlı · 8 kamera · Stockfish",
    badgeEn: "Live · 8 cameras · Stockfish"
  });
}

/**
 * Live Go learning cluster — spacetime observation envelope in media tube.
 */
export function buildRhizohGoLearningChannelV0() {
  return Object.freeze({
    id: RHIZOH_GO_LEARNING_CHANNEL_ID_V0,
    titleTr: "Go Öğrenme · Uzay-Zaman",
    titleEn: "Go Learning · Spacetime",
    type: "go_cluster_live",
    badgeTr: "Canlı · mekân · faz",
    badgeEn: "Live · space · phase"
  });
}

/**
 * Live Checkers learning cluster — spacetime observation envelope in media tube.
 */
export function buildRhizohCheckersLearningChannelV0() {
  return Object.freeze({
    id: RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0,
    titleTr: "Dama Öğrenme · Uzay-Zaman",
    titleEn: "Checkers Learning · Spacetime",
    type: "checkers_cluster_live",
    badgeTr: "Canlı · mekân · faz",
    badgeEn: "Live · space · phase"
  });
}

/**
 * WorldSports — live scores only (gateway world-feed); optional YouTube B-roll.
 */
export function buildRhizohWorldSportsChannelV0() {
  const videoId = readRhizohWorldSportsYoutubeVideoIdV0();
  if (videoId) {
    return freezeYoutubeChannelV0({
      id: RHIZOH_WORLDSPORTS_CHANNEL_ID_V0,
      titleTr: "WorldSports",
      titleEn: "WorldSports",
      type: "youtube",
      url: buildYoutubeEmbedUrlV0(videoId, { controls: true }),
      videoId,
      badgeTr: "Canlı skor + VOD",
      badgeEn: "Live scores + VOD"
    });
  }
  return Object.freeze({
    id: RHIZOH_WORLDSPORTS_CHANNEL_ID_V0,
    titleTr: "WorldSports",
    titleEn: "WorldSports",
    type: "world_sports_feed",
    badgeTr: "API-Sports · canlı skor",
    badgeEn: "API-Sports · live scores"
  });
}

/**
 * World News — headlines only (gateway world-feed); optional YouTube B-roll.
 */
export function buildRhizohWorldNewsChannelV0() {
  const videoId = readRhizohWorldNewsYoutubeVideoIdV0();
  if (videoId) {
    return freezeYoutubeChannelV0({
      id: RHIZOH_WORLD_NEWS_CHANNEL_ID_V0,
      titleTr: "World News",
      titleEn: "World News",
      type: "youtube",
      url: buildYoutubeEmbedUrlV0(videoId, { controls: true }),
      videoId,
      badgeTr: "Haber + VOD",
      badgeEn: "Headlines + VOD"
    });
  }
  return Object.freeze({
    id: RHIZOH_WORLD_NEWS_CHANNEL_ID_V0,
    titleTr: "World News",
    titleEn: "World News",
    type: "world_news_feed",
    badgeTr: "Gateway · haber akışı",
    badgeEn: "Gateway · headline feed"
  });
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listWorldSpaceMediaChannelsV0() {
  const castleChannelId = readCastleGenesisChannelIdV0();
  const shortVideoId = readCastleGenesisShortVideoIdV0();
  const chessVideoId = readCastleGenesisChessVideoIdV0();
  const goVideoId = readCastleGenesisGoVideoIdV0();
  const checkersVideoId = readCastleGenesisCheckersVideoIdV0();
  const architectureVideoId = readCastleGenesisArchitectureVideoIdV0();
  const fullVideoId = readCastleGenesisFullVideoIdV0();
  const fullEmbedEndSec = readCastleGenesisFullEmbedEndSecV0();
  const castleLiveEmbed = castleChannelId ? buildYoutubeLiveChannelEmbedUrlV0(castleChannelId) : "";

  const castleGenesisPrimary = shortVideoId
    ? freezeYoutubeChannelV0({
        id: "castle_genesis",
        titleTr: "Castle Genesis · Kısa",
        titleEn: "Castle Genesis · Short",
        type: "youtube",
        url: buildYoutubeEmbedUrlV0(shortVideoId, { controls: true }),
        livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
        videoId: shortVideoId,
        badgeTr: "Honest Baseline · ~45s",
        badgeEn: "Honest Baseline · ~45s"
      })
    : freezeHoldingChannelV0({
        id: "castle_genesis",
        titleTr: "Castle Genesis · Canlı",
        titleEn: "Castle Genesis · Live",
        type: castleLiveEmbed ? "youtube" : "castle_genesis_live",
        url: castleLiveEmbed || CASTLE_GENESIS_LIVE_PAGE_V0,
        livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
        holdingSlide: CASTLE_GENESIS_SHORT_EMBED_SLIDE_V0,
        badgeTr: "Resmi kanal",
        badgeEn: "Official channel"
      });

  const rows = [
    castleGenesisPrimary,
    buildRhizohLearningChannelV0(),
    buildRhizohGoLearningChannelV0(),
    buildRhizohCheckersLearningChannelV0(),
    buildRhizohWorldSportsChannelV0(),
    buildRhizohWorldNewsChannelV0()
  ];

  rows.push(
    castleLiveEmbed
      ? freezeYoutubeChannelV0({
          id: "castle_genesis_live",
          titleTr: "Castle Genesis · Canlı yayın",
          titleEn: "Castle Genesis · Live stream",
          type: "youtube",
          url: castleLiveEmbed,
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          badgeTr: "YouTube Live",
          badgeEn: "YouTube Live"
        })
      : freezeHoldingChannelV0({
          id: "castle_genesis_live",
          titleTr: "Castle Genesis · Canlı yayın",
          titleEn: "Castle Genesis · Live stream",
          type: "castle_genesis_live",
          url: CASTLE_GENESIS_LIVE_PAGE_V0,
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_HOLDING_SLIDE_V0,
          badgeTr: "YouTube Live",
          badgeEn: "YouTube Live"
        })
  );

  rows.push(
    chessVideoId
      ? freezeYoutubeChannelV0({
          id: "castle_chess",
          titleTr: "Satranç yayını · 8 kamera",
          titleEn: "Chess broadcast · 8 cameras",
          type: "youtube",
          url: buildYoutubeEmbedUrlV0(chessVideoId, { controls: true }),
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          videoId: chessVideoId,
          badgeTr: "Cluster B-roll",
          badgeEn: "Cluster B-roll"
        })
      : Object.freeze({
          id: "castle_chess",
          titleTr: "Satranç yayını · 8 kamera",
          titleEn: "Chess broadcast · 8 cameras",
          type: "chess_cluster_live",
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_CHESS_EMBED_SLIDE_V0,
          badgeTr: "Canlı cluster",
          badgeEn: "Live cluster"
        })
  );

  rows.push(
    goVideoId
      ? freezeYoutubeChannelV0({
          id: "castle_go",
          titleTr: "Go yayını · Academy",
          titleEn: "Go broadcast · Academy",
          type: "youtube",
          url: buildYoutubeEmbedUrlV0(goVideoId, { controls: true }),
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          videoId: goVideoId,
          badgeTr: "Öğrenme topolojisi",
          badgeEn: "Learning topology"
        })
      : Object.freeze({
          id: "castle_go",
          titleTr: "Go yayını · Academy",
          titleEn: "Go broadcast · Academy",
          type: "castle_genesis_live",
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_GO_EMBED_SLIDE_V0,
          badgeTr: "Yükleme bekleniyor",
          badgeEn: "Upload pending"
        })
  );

  rows.push(
    checkersVideoId
      ? freezeYoutubeChannelV0({
          id: "castle_checkers",
          titleTr: "Dama yayını · Academy",
          titleEn: "Checkers broadcast · Academy",
          type: "youtube",
          url: buildYoutubeEmbedUrlV0(checkersVideoId, { controls: true }),
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          videoId: checkersVideoId,
          badgeTr: "Öğrenme topolojisi",
          badgeEn: "Learning topology"
        })
      : Object.freeze({
          id: "castle_checkers",
          titleTr: "Dama yayını · Academy",
          titleEn: "Checkers broadcast · Academy",
          type: "castle_genesis_live",
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_CHECKERS_EMBED_SLIDE_V0,
          badgeTr: "Yükleme bekleniyor",
          badgeEn: "Upload pending"
        })
  );

  rows.push(
    architectureVideoId
      ? freezeYoutubeChannelV0({
          id: "castle_architecture",
          titleTr: "Rhizoh mimari · kısa",
          titleEn: "Rhizoh architecture · short",
          type: "youtube",
          url: buildYoutubeEmbedUrlV0(architectureVideoId, { controls: true }),
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          videoId: architectureVideoId,
          badgeTr: "Teknik özet",
          badgeEn: "Technical brief"
        })
      : freezeHoldingChannelV0({
          id: "castle_architecture",
          titleTr: "Rhizoh mimari · kısa",
          titleEn: "Rhizoh architecture · short",
          type: "castle_genesis_live",
          url: CASTLE_GENESIS_LIVE_PAGE_V0,
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_SHORT_EMBED_SLIDE_V0,
          badgeTr: "Teknik özet",
          badgeEn: "Technical brief"
        })
  );

  rows.push(
    fullVideoId
      ? freezeYoutubeChannelV0({
          id: "castle_manifesto_trim",
          titleTr: "Manifesto · kırpılmış önizleme",
          titleEn: "Manifesto · trimmed preview",
          type: "youtube",
          url: buildYoutubeEmbedUrlV0(fullVideoId, {
            controls: true,
            startSec: 0,
            endSec: fullEmbedEndSec
          }),
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          videoId: fullVideoId,
          embedEndSec: fullEmbedEndSec,
          badgeTr: `İlk ${fullEmbedEndSec}s`,
          badgeEn: `First ${fullEmbedEndSec}s`
        })
      : freezeHoldingChannelV0({
          id: "castle_manifesto_trim",
          titleTr: "Manifesto · kırpılmış önizleme",
          titleEn: "Manifesto · trimmed preview",
          type: "castle_genesis_live",
          url: CASTLE_GENESIS_LIVE_PAGE_V0,
          livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
          holdingSlide: CASTLE_GENESIS_HOLDING_SLIDE_V0,
          badgeTr: "Önizleme",
          badgeEn: "Preview"
        })
  );

  rows.push(
    freezeYoutubeChannelV0({
      id: "nasa",
      titleTr: "NASA TV · ISS Dünya",
      titleEn: "NASA TV · ISS Earth View",
      type: "youtube",
      url: buildYoutubeLiveChannelEmbedUrlV0(NASA_TV_YOUTUBE_CHANNEL_ID_V0, { controls: true }),
      fallbackUrl: buildYoutubeEmbedUrlV0(NASA_ISS_EARTH_VIDEO_ID_V0, { controls: true }),
      secondaryFallbackUrl: buildYoutubeEmbedUrlV0(NASA_ISS_EARTH_FALLBACK_VIDEO_ID_V0, {
        controls: true
      }),
      badgeTr: "Canlı uzay",
      badgeEn: "Live space"
    }),
    Object.freeze({
      id: "lofi",
      titleTr: "Global Kuantum Akışı (Lofi)",
      titleEn: "Global Quantum Stream (Lofi)",
      type: "youtube",
      url: buildYoutubeEmbedUrlV0("jfKfPfyJRdk"),
      badgeTr: "Ambient",
      badgeEn: "Ambient"
    }),
    Object.freeze({
      id: "local",
      titleTr: "Yerel Kamera / Mikrofon",
      titleEn: "Local Camera / Microphone",
      type: "local",
      badgeTr: "Capture",
      badgeEn: "Capture"
    })
  );

  return Object.freeze(rows);
}

/**
 * @param {string} channelId
 */
export function resolveWorldSpaceMediaChannelV0(channelId) {
  const id = String(channelId || "").trim();
  const rows = listWorldSpaceMediaChannelsV0();
  return rows.find((r) => r.id === id) || rows[0];
}

/**
 * @param {string} [source]
 */
export function resolveInitialWorldSpaceMediaChannelIdV0(source) {
  const s = String(source || "");
  if (s.startsWith("castle_init")) return "castle_genesis";
  if (s.includes("my_castle") || s.includes("map:node:castle")) return "castle_genesis";
  if (s.includes("worldnews") || s.includes("world_news") || s.includes("map:node:worldnews")) {
    return RHIZOH_WORLD_NEWS_CHANNEL_ID_V0;
  }
  if (s.includes("worldsports") || s.includes("world_sports") || s.includes("map:node:worldsports")) {
    return RHIZOH_WORLDSPORTS_CHANNEL_ID_V0;
  }
  if (s.includes("checkers_learning") || s.includes("rhizoh_checkers")) {
    return RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0;
  }
  if (s.includes("checkers") || s.includes("dama") || s.includes("map:node:checkers")) {
    return RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0;
  }
  if (s.includes("go_learning") || s.includes("rhizoh_go")) return RHIZOH_GO_LEARNING_CHANNEL_ID_V0;
  if (s.includes("go_board") || s.includes("map:node:go")) return RHIZOH_GO_LEARNING_CHANNEL_ID_V0;
  if (s.includes("chess") || s.includes("map:node:chess") || s.includes("learning")) return RHIZOH_LEARNING_CHANNEL_ID_V0;
  if (s.includes("radio") || s.includes("map:node:radio")) return "lofi";
  if (s.includes("event") || s.includes("map:node:event")) return "nasa";
  if (s.startsWith("map:node:")) {
    const nodeId = s.slice("map:node:".length);
    return resolveWorldSpaceMediaChannelForMapNodeV0({ id: nodeId });
  }
  return "nasa";
}

/**
 * Per-pin media channel — MY CASTLE, EVENT, and RADIO are distinct surfaces.
 *
 * @param {{ id?: string, type?: string } | null | undefined} node
 * @returns {string}
 */
export function resolveWorldSpaceMediaChannelForMapNodeV0(node) {
  const id = String(node?.id || "").trim().toLowerCase();
  if (id === "my_castle" || id === "castle") return "castle_genesis";
  if (id === "worldnews" || id === "world_news" || id.includes("worldnews")) {
    return RHIZOH_WORLD_NEWS_CHANNEL_ID_V0;
  }
  if (id === "worldsports" || id === "world_sports" || id.includes("worldsports")) {
    return RHIZOH_WORLDSPORTS_CHANNEL_ID_V0;
  }
  if (id === "chess" || id === "arena" || id === "chess_arena" || id.includes("chess")) {
    return RHIZOH_LEARNING_CHANNEL_ID_V0;
  }
  if (id === "castle_chess") return "castle_chess";
  if (id === "go_arena" || id === "go_learning" || id === "rhizoh_go_learning") {
    return RHIZOH_GO_LEARNING_CHANNEL_ID_V0;
  }
  if (id === "castle_go" || id === "go" || id.includes("go_board")) return RHIZOH_GO_LEARNING_CHANNEL_ID_V0;
  if (id === "checkers_arena" || id === "checkers_learning" || id === "rhizoh_checkers_learning") {
    return RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0;
  }
  if (id === "castle_checkers" || id === "checkers" || id.includes("dama")) return "castle_checkers";
  if (id === "event") return "nasa";
  if (id === "radio") return "lofi";
  const type = String(node?.type || "").trim().toLowerCase();
  if (type === "broadcast" && id !== "event") return "lofi";
  if (type === "zone") return "nasa";
  if (type === "hub") return "castle_genesis";
  return "nasa";
}

export function getWorldSpaceMediaChannelPackSnapshotV0() {
  return Object.freeze({
    shortVideoId: readCastleGenesisShortVideoIdV0() || null,
    chessVideoId: readCastleGenesisChessVideoIdV0() || null,
    goVideoId: readCastleGenesisGoVideoIdV0() || null,
    checkersVideoId: readCastleGenesisCheckersVideoIdV0() || null,
    architectureVideoId: readCastleGenesisArchitectureVideoIdV0() || null,
    fullVideoId: readCastleGenesisFullVideoIdV0() || null,
    fullEmbedEndSec: readCastleGenesisFullEmbedEndSecV0(),
    liveChannelId: readCastleGenesisChannelIdV0() || null,
    worldSportsVideoId: readRhizohWorldSportsYoutubeVideoIdV0() || null,
    worldNewsVideoId: readRhizohWorldNewsYoutubeVideoIdV0() || null,
    channelCount: listWorldSpaceMediaChannelsV0().length,
    atMs: Date.now()
  });
}

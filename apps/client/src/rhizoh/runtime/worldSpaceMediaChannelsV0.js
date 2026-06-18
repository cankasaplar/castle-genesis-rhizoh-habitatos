/**
 * World-space media tube channel SSOT — YouTube embeds + Castle Genesis live surface.
 * Embed default = short Honest Baseline VOD (not long narrative / sim-profile lore).
 */

export const CASTLE_GENESIS_LIVE_PAGE_V0 = "https://www.youtube.com/@CastleGenesis/live";
export const CASTLE_GENESIS_HOLDING_SLIDE_V0 = "/ops/youtube-test/castle-genesis-holding-slide.svg";
export const CASTLE_GENESIS_SHORT_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-short-embed-slide.svg";
export const CASTLE_GENESIS_CHESS_EMBED_SLIDE_V0 =
  "/ops/youtube-test/castle-genesis-chess-embed-slide.svg";

/** @typedef {'youtube'|'local'|'castle_genesis_live'} WorldSpaceMediaChannelTypeV0 */

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
  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(id)}&autoplay=1&mute=${mute}&controls=1&rel=0`;
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
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID");
}

function readCastleGenesisShortVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_SHORT_VIDEO_ID");
}

function readCastleGenesisChessVideoIdV0() {
  return readEnvV0("VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID");
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

/**
 * @returns {ReadonlyArray<object>}
 */
export function listWorldSpaceMediaChannelsV0() {
  const castleChannelId = readCastleGenesisChannelIdV0();
  const shortVideoId = readCastleGenesisShortVideoIdV0();
  const chessVideoId = readCastleGenesisChessVideoIdV0();
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

  const rows = [castleGenesisPrimary];

  if (castleLiveEmbed) {
    rows.push(
      freezeYoutubeChannelV0({
        id: "castle_genesis_live",
        titleTr: "Castle Genesis · Canlı yayın",
        titleEn: "Castle Genesis · Live stream",
        type: "youtube",
        url: castleLiveEmbed,
        livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
        badgeTr: "YouTube Live",
        badgeEn: "YouTube Live"
      })
    );
  }

  if (chessVideoId) {
    rows.push(
      freezeYoutubeChannelV0({
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
    );
  } else {
    rows.push(
      freezeHoldingChannelV0({
        id: "castle_chess",
        titleTr: "Satranç yayını · 8 kamera",
        titleEn: "Chess broadcast · 8 cameras",
        type: "castle_genesis_live",
        url: CASTLE_GENESIS_LIVE_PAGE_V0,
        livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
        holdingSlide: CASTLE_GENESIS_CHESS_EMBED_SLIDE_V0,
        badgeTr: "VOD yakında",
        badgeEn: "VOD soon"
      })
    );
  }

  if (architectureVideoId) {
    rows.push(
      freezeYoutubeChannelV0({
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
    );
  }

  if (fullVideoId) {
    rows.push(
      freezeYoutubeChannelV0({
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
    );
  }

  rows.push(
    Object.freeze({
      id: "nasa",
      titleTr: "NASA TV · ISS Dünya",
      titleEn: "NASA TV · ISS Earth View",
      type: "youtube",
      url: buildYoutubeEmbedUrlV0("iYmvCUonukw", { controls: true }),
      fallbackUrl: buildYoutubeEmbedUrlV0("21X5lGlDOfg", { controls: true }),
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
  if (s.includes("chess") || s.includes("map:node:chess")) return "castle_chess";
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
  if (id === "chess" || id === "arena") return "castle_chess";
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
    architectureVideoId: readCastleGenesisArchitectureVideoIdV0() || null,
    fullVideoId: readCastleGenesisFullVideoIdV0() || null,
    fullEmbedEndSec: readCastleGenesisFullEmbedEndSecV0(),
    liveChannelId: readCastleGenesisChannelIdV0() || null,
    channelCount: listWorldSpaceMediaChannelsV0().length,
    atMs: Date.now()
  });
}

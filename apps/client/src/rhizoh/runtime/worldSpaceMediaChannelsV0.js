/**
 * World-space media tube channel SSOT — YouTube embeds + Castle Genesis live surface.
 */

export const CASTLE_GENESIS_LIVE_PAGE_V0 = "https://www.youtube.com/@CastleGenesis/live";
export const CASTLE_GENESIS_HOLDING_SLIDE_V0 = "/ops/youtube-test/castle-genesis-holding-slide.svg";

/** @typedef {'youtube'|'local'|'castle_genesis_live'} WorldSpaceMediaChannelTypeV0 */

/**
 * @param {string} videoId
 * @param {{ mute?: boolean, controls?: boolean }} [opts]
 */
export function buildYoutubeEmbedUrlV0(videoId, opts = {}) {
  const id = String(videoId || "").trim();
  const mute = opts.mute !== false ? "1" : "0";
  const controls = opts.controls === true ? "1" : "0";
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=${mute}&controls=${controls}&rel=0&modestbranding=1`;
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

function readCastleGenesisChannelIdV0() {
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    return String(env.VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID || "").trim();
  } catch {
    return "";
  }
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listWorldSpaceMediaChannelsV0() {
  const castleChannelId = readCastleGenesisChannelIdV0();
  const castleEmbed = castleChannelId ? buildYoutubeLiveChannelEmbedUrlV0(castleChannelId) : "";

  return Object.freeze([
    Object.freeze({
      id: "castle_genesis",
      titleTr: "Castle Genesis · Canlı",
      titleEn: "Castle Genesis · Live",
      type: castleEmbed ? "youtube" : "castle_genesis_live",
      url: castleEmbed || CASTLE_GENESIS_LIVE_PAGE_V0,
      livePageUrl: CASTLE_GENESIS_LIVE_PAGE_V0,
      holdingSlide: CASTLE_GENESIS_HOLDING_SLIDE_V0,
      badgeTr: "Resmi kanal",
      badgeEn: "Official channel"
    }),
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
  ]);
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
 * @param {{ id?: string, type?: string } | null | undefined} node
 * @returns {string}
 */
export function resolveWorldSpaceMediaChannelForMapNodeV0(node) {
  const id = String(node?.id || "").trim().toLowerCase();
  if (id === "my_castle" || id === "castle") return "castle_genesis";
  if (id === "event") return "nasa";
  if (id === "radio") return "lofi";
  const type = String(node?.type || "").trim().toLowerCase();
  if (type === "broadcast" && id !== "event") return "lofi";
  if (type === "zone") return "nasa";
  if (type === "hub") return "castle_genesis";
  return "nasa";
}

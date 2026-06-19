/**
 * Castle Media Archive metadata — frequency band, event state, community content kind.
 * @see docs/research/CITY_MAP_LEGAL_MEDIA_GATE_V1.md
 */

export const CASTLE_ARCHIVE_MEDIA_META_SCHEMA_V0 = "castle.archive_media_meta.v0";

export const CASTLE_MEDIA_FREQUENCY_BAND_V0 = Object.freeze({
  SUB_BASS: "sub_bass",
  BASS: "bass",
  MID: "mid",
  PRESENCE: "presence",
  AIR: "air",
  AMBIENT: "ambient",
  FULL_SPECTRUM: "full_spectrum"
});

export const CASTLE_MEDIA_EVENT_STATE_V0 = Object.freeze({
  HOLD: "hold",
  LIVE: "live",
  ARCHIVE: "archive",
  MANIFESTO: "manifesto",
  PROTEST: "protest",
  COMMUNITY_VOTE: "community_vote",
  COUNTDOWN: "countdown"
});

export const CASTLE_MEDIA_CONTENT_KIND_V0 = Object.freeze({
  MUSIC: "music",
  BROADCAST: "broadcast",
  MANIFESTO: "manifesto",
  PROTEST: "protest",
  COMMUNITY: "community",
  YOUTUBE_LAB: "youtube_lab",
  FREQUENCY: "frequency"
});

const FREQ_LABELS_TR = Object.freeze({
  sub_bass: "Sub-bas",
  bass: "Bas",
  mid: "Orta",
  presence: "Presence",
  air: "Hava",
  ambient: "Ambient",
  full_spectrum: "Tam spektrum"
});

const STATE_LABELS_TR = Object.freeze({
  hold: "Bekleme",
  live: "Canlı",
  archive: "Arşiv",
  manifesto: "Manifesto",
  protest: "Protesto",
  community_vote: "Topluluk oylaması",
  countdown: "Geri sayım"
});

/**
 * @param {object} raw
 */
export function normalizeCastleArchiveMediaMetaV0(raw = {}) {
  const freq = String(raw.frequencyBand || raw.frequency || CASTLE_MEDIA_FREQUENCY_BAND_V0.AMBIENT);
  const state = String(raw.eventState || CASTLE_MEDIA_EVENT_STATE_V0.HOLD);
  const kind = String(raw.contentKind || CASTLE_MEDIA_CONTENT_KIND_V0.BROADCAST);
  const allowedFreq = Object.values(CASTLE_MEDIA_FREQUENCY_BAND_V0);
  const allowedState = Object.values(CASTLE_MEDIA_EVENT_STATE_V0);
  const allowedKind = Object.values(CASTLE_MEDIA_CONTENT_KIND_V0);
  return Object.freeze({
    frequencyBand: allowedFreq.includes(freq) ? freq : CASTLE_MEDIA_FREQUENCY_BAND_V0.AMBIENT,
    eventState: allowedState.includes(state) ? state : CASTLE_MEDIA_EVENT_STATE_V0.HOLD,
    contentKind: allowedKind.includes(kind) ? kind : CASTLE_MEDIA_CONTENT_KIND_V0.BROADCAST,
    youtubeChannelId: raw.youtubeChannelId ? String(raw.youtubeChannelId).slice(0, 64) : null,
    communityId: raw.communityId ? String(raw.communityId).slice(0, 64) : null
  });
}

/**
 * @param {string} band
 * @param {boolean} [tr]
 */
export function labelCastleMediaFrequencyBandV0(band, tr = false) {
  const id = String(band || "");
  if (tr) return FREQ_LABELS_TR[id] || id;
  return id.replace(/_/g, " ");
}

/**
 * @param {string} state
 * @param {boolean} [tr]
 */
export function labelCastleMediaEventStateV0(state, tr = false) {
  const id = String(state || "");
  if (tr) return STATE_LABELS_TR[id] || id;
  return id.replace(/_/g, " ");
}

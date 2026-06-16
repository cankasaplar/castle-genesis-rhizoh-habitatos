/**
 * YouTube publisher bridge → community / vote / manifesto / protest lab ingest.
 * SPECFLOW: RESEARCH-ONLY — interpretation layer; no execution authority.
 */

import { fetchYoutubePublisherAnalyticsSnapshotV0 } from "../social/multiUser/youtubePublisherAnalyticsCoherenceHookV0.js";
import {
  CASTLE_MEDIA_CONTENT_KIND_V0,
  CASTLE_MEDIA_EVENT_STATE_V0
} from "./castleArchiveMediaMetaV0.js";

export const YOUTUBE_COMMUNITY_LAB_SCHEMA_V0 = "castle.youtube_community_lab.v0";
export const RHIZOH_YOUTUBE_COMMUNITY_LAB_EVENT_V0 = "rhizoh:youtube-community-lab-v0";

/**
 * @param {Record<string, unknown>|null|undefined} snapshot
 */
export function parseYoutubeCommunityLabSnapshotV0(snapshot) {
  const s = snapshot && typeof snapshot === "object" ? snapshot : null;
  if (!s) {
    return Object.freeze({
      schema: YOUTUBE_COMMUNITY_LAB_SCHEMA_V0,
      ok: false,
      channelId: null,
      communities: Object.freeze([]),
      votes: Object.freeze([]),
      manifestos: Object.freeze([]),
      protests: Object.freeze([])
    });
  }

  const channelId = s.channelId ? String(s.channelId).slice(0, 64) : null;
  const communities = normalizeRowsV0(s.communities || s.communityPosts, CASTLE_MEDIA_CONTENT_KIND_V0.COMMUNITY);
  const votes = normalizeRowsV0(s.votes || s.communityVotes, CASTLE_MEDIA_CONTENT_KIND_V0.COMMUNITY);
  const manifestos = normalizeRowsV0(s.manifestos || s.manifestoPosts, CASTLE_MEDIA_CONTENT_KIND_V0.MANIFESTO);
  const protests = normalizeRowsV0(s.protests || s.protestPosts, CASTLE_MEDIA_CONTENT_KIND_V0.PROTEST);

  return Object.freeze({
    schema: YOUTUBE_COMMUNITY_LAB_SCHEMA_V0,
    ok: true,
    channelId,
    liveBroadcastId: s.liveBroadcastId ? String(s.liveBroadcastId).slice(0, 64) : null,
    communities,
    votes,
    manifestos,
    protests,
    atMs: Date.now()
  });
}

function normalizeRowsV0(raw, defaultKind) {
  const rows = Array.isArray(raw) ? raw : [];
  return Object.freeze(
    rows.slice(0, 32).map((row, idx) => {
      const r = row && typeof row === "object" ? row : {};
      const eventState = String(r.eventState || inferEventStateV0(defaultKind));
      return Object.freeze({
        id: String(r.id || `yt_${defaultKind}_${idx}`).slice(0, 64),
        title: String(r.title || r.text || "").slice(0, 240),
        communityId: r.communityId ? String(r.communityId).slice(0, 64) : null,
        voteCount: Number.isFinite(Number(r.voteCount)) ? Number(r.voteCount) : null,
        contentKind: String(r.contentKind || defaultKind),
        eventState,
        url: r.url ? String(r.url).slice(0, 512) : null
      });
    })
  );
}

function inferEventStateV0(kind) {
  if (kind === CASTLE_MEDIA_CONTENT_KIND_V0.MANIFESTO) return CASTLE_MEDIA_EVENT_STATE_V0.MANIFESTO;
  if (kind === CASTLE_MEDIA_CONTENT_KIND_V0.PROTEST) return CASTLE_MEDIA_EVENT_STATE_V0.PROTEST;
  if (kind === CASTLE_MEDIA_CONTENT_KIND_V0.COMMUNITY) return CASTLE_MEDIA_EVENT_STATE_V0.COMMUNITY_VOTE;
  return CASTLE_MEDIA_EVENT_STATE_V0.LIVE;
}

/**
 * Pull bridge snapshot and publish to window + event bus.
 * @param {{ baseUrl?: string, fetchImpl?: typeof fetch }} [opts]
 */
export async function ingestYoutubeCommunityLabV0(opts = {}) {
  let baseUrl = String(opts.baseUrl || "").trim();
  if (!baseUrl) {
    try {
      const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
      baseUrl = String(env.VITE_YOUTUBE_PUBLISHER_BRIDGE_URL || "").trim();
    } catch {
      baseUrl = "";
    }
  }
  const snap = await fetchYoutubePublisherAnalyticsSnapshotV0(baseUrl, opts.fetchImpl);
  const lab = parseYoutubeCommunityLabSnapshotV0(snap);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.youtubeCommunityLab = lab;
    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_YOUTUBE_COMMUNITY_LAB_EVENT_V0, { detail: lab }));
    } catch {
      /* noop */
    }
  }
  return lab;
}

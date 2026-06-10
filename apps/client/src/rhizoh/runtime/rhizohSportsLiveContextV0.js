/**
 * Sports live context — gateway world-feed → LLM / fast reflex (Turkey + fixtures).
 */

import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";
import {
  formatSportMatchChipV0,
  getWorldMapLiveFeedSnapshotV0,
  refreshWorldMapLiveFeedIfStaleV0
} from "./worldMapLiveFeedV0.js";

export const RHIZOH_SPORTS_LIVE_CONTEXT_SCHEMA_V0 = "castle.rhizoh.sports_live_context.v0";

const TURKEY_TEAM_RE_V0 = /\b(turkiye|turkey|a\s*milli|milli\s*takim)\b/i;

/**
 * @param {string} raw
 */
export function probeSportsLiveQueryV0(raw) {
  const n = foldCanonicalSurfaceV1(String(raw || "").trim());
  if (!n) {
    return Object.freeze({ active: false, team: null, kind: null, reason: "empty" });
  }

  const hasSports =
    /\b(mac|maclar|fikstur|fixture|skor|gol|spor|match|score|football|soccer)\b/.test(n);
  const turkey = TURKEY_TEAM_RE_V0.test(n);

  if (turkey && hasSports) {
    return Object.freeze({ active: true, team: "turkey", kind: "fixture", reason: "turkey_sports" });
  }
  if (/\b(fikstur|fixture|maclar|macvar|yaklasan\s*mac)\b/.test(n)) {
    return Object.freeze({ active: true, team: turkey ? "turkey" : null, kind: "fixture", reason: "fixture_lexicon" });
  }
  if (/\b(canli\s*skor|mac\s*sonuc|kim\s*kazandi|live\s*score)\b/.test(n)) {
    return Object.freeze({ active: true, team: turkey ? "turkey" : null, kind: "live", reason: "live_lexicon" });
  }
  if (hasSports && turkey) {
    return Object.freeze({ active: true, team: "turkey", kind: "general", reason: "turkey_general" });
  }

  return Object.freeze({ active: false, team: null, kind: null, reason: "none" });
}

/**
 * @param {unknown[]} rows
 * @param {string | null} [team]
 */
export function filterSportMatchesForTeamV0(rows, team) {
  const list = Array.isArray(rows) ? rows : [];
  if (team !== "turkey") return list;
  return list.filter((m) => {
    const blob = `${m?.homeName || ""} ${m?.awayName || ""} ${m?.league || ""}`.toLowerCase();
    return /turkey|turkiye|türkiye/.test(blob);
  });
}

/**
 * @param {ReturnType<typeof probeSportsLiveQueryV0>} probe
 * @param {string} [locale]
 */
export function buildSportsLinesFromFeedV0(probe, locale = "tr") {
  const feed = getWorldMapLiveFeedSnapshotV0();
  const sports = feed?.sports;
  if (!sports) return { lines: [], source: "none", configured: false };

  const liveAll = Array.isArray(sports.live) ? sports.live : [];
  const upcomingAll = Array.isArray(sports.upcoming) ? sports.upcoming : [];
  const live = filterSportMatchesForTeamV0(liveAll, probe.team);
  const upcoming = filterSportMatchesForTeamV0(upcomingAll, probe.team);
  const rows =
    probe.kind === "live"
      ? live.length
        ? live
        : upcoming
      : upcoming.length
        ? upcoming
        : live;

  const lines = rows.slice(0, 6).map((m) => formatSportMatchChipV0(m, locale));
  return {
    lines,
    source: String(sports.source || "gateway"),
    configured: sports.ok !== false,
    fetchedAt: sports.fetchedAt || feed?.fetchedAt || null
  };
}

/**
 * @param {string} message
 * @param {{ locale?: string, forceRefresh?: boolean }} [opts]
 */
export async function buildSportsLiveContextBoostV0(message, opts = {}) {
  const probe = probeSportsLiveQueryV0(message);
  if (!probe.active) return null;

  await refreshWorldMapLiveFeedIfStaleV0({ force: opts.forceRefresh === true, locale: opts.locale });
  const built = buildSportsLinesFromFeedV0(probe, opts.locale || "tr");
  const tr = String(opts.locale || "tr").toLowerCase().startsWith("tr");

  return Object.freeze({
    schema: RHIZOH_SPORTS_LIVE_CONTEXT_SCHEMA_V0,
    active: true,
    team: probe.team,
    kind: probe.kind,
    reason: probe.reason,
    source: built.source,
    configured: built.configured,
    fetchedAt: built.fetchedAt,
    lines: Object.freeze(built.lines),
    promptDirective: tr
      ? "Canlı spor verisi (gateway football-data.org / API-Sports). Cevabı yalnızca LIVE_SPORTS satırlarından türet; veri yoksa dürüstçe söyle ve tahmin etme."
      : "Live sports data from gateway feed. Ground answers in LIVE_SPORTS lines only; if empty, say so honestly — do not invent fixtures.",
    emptyLabel: tr ? "Canlı fikstür verisi şu an boş veya gateway anahtarı yapılandırılmamış." : "Live fixture feed is empty or gateway sports keys are not configured."
  });
}

/**
 * @param {string} reply
 */
export function isEmptySportsReflexReplyV0(reply) {
  const t = String(reply || "").toLowerCase();
  return (
    t.includes("yuklenmedi") ||
    t.includes("yüklenmedi") ||
    t.includes("yuklenemedi") ||
    t.includes("yüklenemedi") ||
    t.includes("bulunmuyor") ||
    t.includes("not loaded") ||
    t.includes("currently empty") ||
    t.includes("offline")
  );
}

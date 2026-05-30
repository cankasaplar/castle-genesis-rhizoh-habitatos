/**
 * SPECFLOW: RESEARCH-ONLY — **Castle History Book**: append-only narrative memory from coherence
 * distributor output (episode spine for studio / “living documentary”, not full video assets).
 *
 * Bridges toward future **Studio Publisher** (A) and **Federation** (C) by giving a shared episodic ledger shape.
 */

export const CASTLE_HISTORY_BOOK_SCHEMA_V0 = "castle.rhizoh.castle_history_book.v0";

export const CASTLE_HISTORY_BOOK_EPISODE_SCHEMA_V0 = "castle.rhizoh.castle_history_book_episode.v0";

/** Bound in-memory / localStorage growth (research default). */
export const CASTLE_HISTORY_BOOK_MAX_EPISODES_V0 = 256;

/**
 * @param {Record<string, unknown>|null|undefined} distributed — `distributeGlobalCoherenceKernelOutputV0` result
 */
export function shouldAppendCastleHistoryEpisodeV0(distributed) {
  const d = distributed && typeof distributed === "object" ? distributed : null;
  if (!d) return false;
  if (d.networkDiff && typeof d.networkDiff === "object" && d.networkDiff.dirty) return true;
  if (d.studioEvent && typeof d.studioEvent === "object" && d.studioEvent.fullSnapshotRecommended) return true;
  const y = d.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const pr = y != null ? Number(y.publishRecommendationScore) : NaN;
  if (Number.isFinite(pr) && pr >= 0.38) return true;
  return false;
}

/**
 * @param {Record<string, unknown>|null|undefined} distributed
 * @returns {Record<string, unknown>|null}
 */
export function buildCastleHistoryEpisodeFromDistributorV0(distributed) {
  const d = distributed && typeof distributed === "object" ? distributed : null;
  if (!d) return null;
  const ui = d.uiSnapshot && typeof d.uiSnapshot === "object" ? d.uiSnapshot : null;
  const y = d.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const se = d.studioEvent && typeof d.studioEvent === "object" ? d.studioEvent : null;
  const frame = ui != null && Number.isFinite(Number(ui.frame)) ? Number(ui.frame) : se != null && Number.isFinite(Number(se.frame)) ? Number(se.frame) : null;
  return {
    schema: CASTLE_HISTORY_BOOK_EPISODE_SCHEMA_V0,
    ts: Date.now(),
    frame,
    role: ui && typeof ui.role === "string" ? ui.role : null,
    peerCount: ui != null && Number.isFinite(Number(ui.peerCount)) ? Number(ui.peerCount) : null,
    narrativeArcId: y && typeof y.narrativeArcId === "string" ? y.narrativeArcId : null,
    defaultEpisodeTitle: y && typeof y.defaultEpisodeTitle === "string" ? y.defaultEpisodeTitle : null,
    publishRecommendationScore: y != null && Number.isFinite(Number(y.publishRecommendationScore)) ? Number(y.publishRecommendationScore) : null,
    emotionalDensity01: y != null && Number.isFinite(Number(y.emotionalDensity01)) ? Number(y.emotionalDensity01) : null,
    networkDiffDirty: !!(d.networkDiff && typeof d.networkDiff === "object" && d.networkDiff.dirty),
    fullSnapshotRecommended: !!(se && se.fullSnapshotRecommended),
    lineage: d.lineage && typeof d.lineage === "object" ? d.lineage : null
  };
}

/** @returns {{ schema: string, episodes: unknown[] }} */
export function createInitialCastleHistoryBookV0() {
  return { schema: CASTLE_HISTORY_BOOK_SCHEMA_V0, episodes: [] };
}

/**
 * @param {{ schema?: string, episodes?: unknown[] }|null|undefined} book
 * @param {Record<string, unknown>|null|undefined} episode
 */
export function appendCastleHistoryBookEpisodeV0(book, episode) {
  const b = book && typeof book === "object" ? book : createInitialCastleHistoryBookV0();
  const ep = episode && typeof episode === "object" ? episode : null;
  if (!ep) return { ...b, schema: CASTLE_HISTORY_BOOK_SCHEMA_V0 };
  const prev = Array.isArray(b.episodes) ? b.episodes : [];
  const next = [...prev, { ...ep, bookSeq: prev.length }];
  const cap = Math.max(16, Math.floor(Number(CASTLE_HISTORY_BOOK_MAX_EPISODES_V0) || 256));
  return {
    schema: CASTLE_HISTORY_BOOK_SCHEMA_V0,
    episodes: next.length > cap ? next.slice(-cap) : next
  };
}

const LS_KEY = "castle.rhizoh.history_book.v0";

/**
 * Best-effort persistence (client research); swallow errors.
 *
 * @param {{ schema?: string, episodes?: unknown[] }} book
 */
export function persistCastleHistoryBookLocalV0(book) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const raw = JSON.stringify(book);
    if (raw.length > 900_000) return false;
    window.localStorage.setItem(LS_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {{ schema: string, episodes: unknown[] } | null}
 */
export function loadCastleHistoryBookLocalV0() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || !Array.isArray(p.episodes)) return null;
    return { schema: CASTLE_HISTORY_BOOK_SCHEMA_V0, episodes: p.episodes };
  } catch {
    return null;
  }
}

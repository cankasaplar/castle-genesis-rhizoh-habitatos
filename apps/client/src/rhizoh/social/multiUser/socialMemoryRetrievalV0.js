/**
 * SPECFLOW: RESEARCH-ONLY — **Social memory retrieval**: geçmiş rol / davranış recall (Castle History Book
 * ve benzeri append-only ledger üzerinden kısa hatırlatma satırları).
 */

export const SOCIAL_MEMORY_RECALL_PACK_SCHEMA_V0 = "castle.rhizoh.social_memory_recall_pack.v0";

/**
 * @param {Record<string, unknown>|null|undefined} episode
 * @param {"tr"|"en"} locale
 */
function formatEpisodeRecallLineV0(episode, locale) {
  const e = episode && typeof episode === "object" ? episode : {};
  const role = e.role != null ? String(e.role) : "—";
  const frame = Number.isFinite(Number(e.frame)) ? Number(e.frame) : null;
  const pr = Number(e.publishRecommendationScore);
  const prs = Number.isFinite(pr) ? ` · yayın skoru ${Math.round(pr * 100) / 100}` : "";
  const title = e.defaultEpisodeTitle != null ? String(e.defaultEpisodeTitle).slice(0, 72) : "";
  if (locale === "en") {
    const fr = frame != null ? `frame ${frame}` : "past beat";
    return `Earlier as ${role} (${fr})${prs}${title ? ` — ${title}` : ""}.`;
  }
  const fr = frame != null ? `kare ${frame}` : "önceki beat";
  return `Daha önce ${role} (${fr})${prs}${title ? ` — ${title}` : ""}.`;
}

/**
 * @param {{ schema?: string, episodes?: unknown[] }|null|undefined} book
 * @param {{
 *   currentRole?: string,
 *   continuityBand?: string,
 *   maxItems?: number,
 *   locale?: "tr"|"en"
 * }|null} query
 */
export function retrieveSocialMemoryRecallPackV0(book, query) {
  const q = query && typeof query === "object" ? query : {};
  const locale = q.locale === "en" ? "en" : "tr";
  const maxItems = Math.min(6, Math.max(1, Math.floor(Number(q.maxItems) || 3)));
  const role = String(q.currentRole || "").trim().toUpperCase();
  const band = String(q.continuityBand || "").trim().toUpperCase();
  const b = book && typeof book === "object" ? book : null;
  const eps = b != null && Array.isArray(b.episodes) ? b.episodes : [];
  if (!eps.length) {
    return {
      schema: SOCIAL_MEMORY_RECALL_PACK_SCHEMA_V0,
      recallLines: [],
      episodeRefs: []
    };
  }

  /** @type {{ ep: Record<string, unknown>, score: number, idx: number }[]} */
  const scored = [];
  for (let idx = eps.length - 1; idx >= 0 && scored.length < 48; idx--) {
    const ep = eps[idx];
    if (!ep || typeof ep !== "object") continue;
    const er = String(ep.role || "").trim().toUpperCase();
    let score = 0;
    if (role && er && er === role) score += 4;
    else if (role && er && (er.includes(role) || role.includes(er))) score += 2;
    if (band === "HOST" && (er === "GUIDE" || er === "CONDUCTOR")) score += 1;
    if (band === "OBSERVER" && (er === "ARBITER" || er === "AMBIENT_PRESENCE")) score += 1;
    if (band === "INTERPRETER" && er === "INTERPRETER") score += 2;
    if (ep.networkDiffDirty) score += 0.5;
    if (ep.fullSnapshotRecommended) score += 0.25;
    if (score > 0) scored.push({ ep: /** @type {Record<string, unknown>} */ (ep), score, idx });
  }
  scored.sort((a, b) => b.score - a.score || b.idx - a.idx);

  const recallLines = [];
  const episodeRefs = [];
  for (const row of scored.slice(0, maxItems)) {
    recallLines.push(formatEpisodeRecallLineV0(row.ep, locale));
    episodeRefs.push({
      bookSeq: row.ep.bookSeq,
      frame: row.ep.frame ?? null,
      role: row.ep.role ?? null
    });
  }

  return {
    schema: SOCIAL_MEMORY_RECALL_PACK_SCHEMA_V0,
    recallLines,
    episodeRefs
  };
}

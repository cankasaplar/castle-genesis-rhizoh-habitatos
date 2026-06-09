/**
 * football-data.org v4 → normalized sport rows (shared with API-Sports shape).
 * @see https://docs.football-data.org/general/v4/match.html
 */

/** @typedef {'live'|'scheduled'|'finished'|'postponed'|'unknown'} SportMatchPhaseV0 */

/**
 * @param {string} status
 * @returns {SportMatchPhaseV0}
 */
export function inferFootballDataPhaseV0(status) {
  const s = String(status || "").toUpperCase();
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(s)) return "live";
  if (["SCHEDULED", "TIMED"].includes(s)) return "scheduled";
  if (["FINISHED"].includes(s)) return "finished";
  if (["POSTPONED", "SUSPENDED", "CANCELLED"].includes(s)) return "postponed";
  return "unknown";
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} match
 * @returns {object | null}
 */
export function normalizeFootballDataMatchV0(match) {
  if (!match || typeof match !== "object") return null;
  const m = /** @type {Record<string, unknown>} */ (match);
  const homeTeam = m.homeTeam && typeof m.homeTeam === "object" ? m.homeTeam : {};
  const awayTeam = m.awayTeam && typeof m.awayTeam === "object" ? m.awayTeam : {};
  const competition = m.competition && typeof m.competition === "object" ? m.competition : {};
  const score = m.score && typeof m.score === "object" ? m.score : {};
  const fullTime =
    score.fullTime && typeof score.fullTime === "object" ? score.fullTime : score;
  const statusShort = String(m.status || "");
  const phase = inferFootballDataPhaseV0(statusShort);

  return Object.freeze({
    id: `football-data:${m.id ?? `${homeTeam.name}-${awayTeam.name}`}`,
    sport: "football",
    phase,
    league: String(competition.name || competition.code || "Football"),
    homeName: String(homeTeam.name || homeTeam.shortName || "Home"),
    awayName: String(awayTeam.name || awayTeam.shortName || "Away"),
    homeScore: numOrNull(fullTime.home),
    awayScore: numOrNull(fullTime.away),
    startTimeIso: m.utcDate ? String(m.utcDate) : null,
    minute: numOrNull(m.minute),
    statusShort
  });
}

/**
 * @param {unknown} payload
 * @returns {object[]}
 */
export function normalizeFootballDataMatchesPayloadV0(payload) {
  const rows = Array.isArray(payload?.matches) ? payload.matches : [];
  return rows.map(normalizeFootballDataMatchV0).filter(Boolean);
}

/**
 * API-Sports (api-football.com family) → normalized live sport rows.
 * @see https://www.api-football.com/documentation-v3
 */

/** @typedef {'football'|'basketball'|'formula1'|'hockey'|'rugby'|'volleyball'|'baseball'|'handball'|'mma'|'nba'|'nfl'|'afl'} ApiSportIdV0 */

/** @typedef {'live'|'scheduled'|'finished'|'postponed'|'unknown'} SportMatchPhaseV0 */

/**
 * @typedef {object} NormalizedSportMatchV0
 * @property {string} id
 * @property {ApiSportIdV0} sport
 * @property {SportMatchPhaseV0} phase
 * @property {string} league
 * @property {string} homeName
 * @property {string} awayName
 * @property {number|null} homeScore
 * @property {number|null} awayScore
 * @property {string|null} startTimeIso
 * @property {number|null} minute
 * @property {string} statusShort
 */

const FOOTBALL_LIVE = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "HT"]);
const BASKETBALL_LIVE = new Set(["Q1", "Q2", "Q3", "Q4", "OT", "BT", "HT", "LIVE"]);

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {ApiSportIdV0} sport
 * @param {string} short
 * @returns {SportMatchPhaseV0}
 */
export function inferSportPhaseV0(sport, short) {
  const s = String(short || "").toUpperCase();
  if (!s) return "unknown";
  if (s === "NS" || s === "TBD" || s === "SCHEDULED") return "scheduled";
  if (["FT", "AET", "PEN", "AOT", "CANC", "ABD", "AWD", "WO"].includes(s)) return "finished";
  if (["PST", "POST", "SUSP", "INT"].includes(s)) return "postponed";
  if (sport === "football" && FOOTBALL_LIVE.has(s)) return "live";
  if (sport === "basketball" && BASKETBALL_LIVE.has(s)) return "live";
  if (s === "LIVE" || s === "INPLAY") return "live";
  return "unknown";
}

/**
 * @param {unknown} payload
 * @returns {NormalizedSportMatchV0[]}
 */
export function normalizeApiSportsFootballFixturesV0(payload) {
  const rows = Array.isArray(payload?.response) ? payload.response : [];
  return rows.map((row) => {
    const fixture = row?.fixture || {};
    const league = row?.league || {};
    const teams = row?.teams || {};
    const goals = row?.goals || {};
    const statusShort = String(fixture?.status?.short || "");
    return Object.freeze({
      id: `football:${fixture?.id ?? `${teams?.home?.name}-${teams?.away?.name}`}`,
      sport: "football",
      phase: inferSportPhaseV0("football", statusShort),
      league: String(league?.name || league?.country || "Football"),
      homeName: String(teams?.home?.name || "Home"),
      awayName: String(teams?.away?.name || "Away"),
      homeScore: numOrNull(goals?.home),
      awayScore: numOrNull(goals?.away),
      startTimeIso: fixture?.date ? String(fixture.date) : null,
      minute: numOrNull(fixture?.status?.elapsed),
      statusShort
    });
  });
}

/**
 * @param {unknown} payload
 * @returns {NormalizedSportMatchV0[]}
 */
export function normalizeApiSportsBasketballGamesV0(payload) {
  const rows = Array.isArray(payload?.response) ? payload.response : [];
  return rows.map((row) => {
    const statusShort = String(row?.status?.short || "");
    const teams = row?.teams || {};
    const scores = row?.scores || {};
    const home = scores?.home?.total ?? scores?.home?.points;
    const away = scores?.away?.total ?? scores?.away?.points;
    return Object.freeze({
      id: `basketball:${row?.id ?? `${teams?.home?.name}-${teams?.away?.name}`}`,
      sport: "basketball",
      phase: inferSportPhaseV0("basketball", statusShort),
      league: String(row?.league?.name || row?.country?.name || "Basketball"),
      homeName: String(teams?.home?.name || "Home"),
      awayName: String(teams?.away?.name || "Away"),
      homeScore: numOrNull(home),
      awayScore: numOrNull(away),
      startTimeIso: row?.date ? String(row.date) : null,
      minute: null,
      statusShort
    });
  });
}

/**
 * @param {unknown} payload
 * @returns {NormalizedSportMatchV0[]}
 */
export function normalizeApiSportsFormula1RacesV0(payload) {
  const rows = Array.isArray(payload?.response) ? payload.response : [];
  return rows.map((row) => {
    const circuit = row?.circuit || {};
    const competition = row?.competition || {};
    const schedule = row?.schedule || {};
    const date = schedule?.date || row?.date || null;
    return Object.freeze({
      id: `formula1:${row?.id ?? circuit?.circuit_id ?? competition?.name}`,
      sport: "formula1",
      phase: "scheduled",
      league: String(competition?.name || "Formula 1"),
      homeName: String(circuit?.name || "Circuit"),
      awayName: String(competition?.location?.country || "Grand Prix"),
      homeScore: null,
      awayScore: null,
      startTimeIso: date ? String(date) : null,
      minute: null,
      statusShort: "GP"
    });
  });
}

/**
 * @param {NormalizedSportMatchV0[]} rows
 * @param {{ liveLimit?: number, upcomingLimit?: number }} [opts]
 */
export function partitionSportMatchesV0(rows, opts = {}) {
  const liveLimit = opts.liveLimit ?? 12;
  const upcomingLimit = opts.upcomingLimit ?? 12;
  const live = [];
  const upcoming = [];
  for (const row of rows) {
    if (row.phase === "live" && live.length < liveLimit) live.push(row);
    else if (row.phase === "scheduled" && upcoming.length < upcomingLimit) upcoming.push(row);
  }
  return Object.freeze({ live: Object.freeze(live), upcoming: Object.freeze(upcoming) });
}

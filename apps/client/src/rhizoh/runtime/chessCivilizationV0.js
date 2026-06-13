/**
 * Chess Civilization v0 — Layer 5: per-castle chess profile (elo, openings, rivals, matches).
 */

export const CHESS_CIVILIZATION_SCHEMA_V0 = "rhizoh.chess_civilization.v0";
export const CHESS_CIVILIZATION_LS_KEY_V0 = "rhizoh_chess_civilization_v0";
export const CHESS_CIVILIZATION_EVENT_V0 = "rhizoh:chess-civilization-v0";

const BASE_ELO_V0 = 1200;
const MAX_MATCHES_V0 = 256;
const MAX_RIVALS_V0 = 64;

function nowIso() {
  return new Date().toISOString();
}

function readRawV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHESS_CIVILIZATION_LS_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRawV0(profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHESS_CIVILIZATION_LS_KEY_V0, JSON.stringify(profile));
  try {
    window.dispatchEvent(
      new CustomEvent(CHESS_CIVILIZATION_EVENT_V0, {
        detail: Object.freeze({ castleId: profile.castleId, elo: profile.elo })
      })
    );
  } catch {
    /* noop */
  }
}

function ensureProfileV0(castleId) {
  const id = String(castleId || "local_castle").trim();
  const existing = readRawV0();
  if (existing?.castleId === id) return { ...existing };
  return {
    schema: CHESS_CIVILIZATION_SCHEMA_V0,
    castleId: id,
    elo: BASE_ELO_V0,
    openings: [],
    rivals: [],
    matches: [],
    updatedAt: nowIso()
  };
}

function adjustEloV0(elo, won, draw) {
  if (draw) return elo;
  return Math.max(800, Math.min(2400, elo + (won ? 12 : -10)));
}

function upsertOpeningStatV0(openings, observation) {
  const eco = observation.eco || observation.openingName;
  const key = String(eco || "unknown").toLowerCase();
  const list = [...(openings || [])];
  const idx = list.findIndex((o) => String(o.eco || o.name).toLowerCase() === key);
  const won = observation.winner === "local";
  const lost = observation.winner === "opponent";
  const prev = idx >= 0 ? list[idx] : { eco: observation.eco, name: observation.openingName, games: 0, wins: 0, losses: 0 };
  const row = {
    ...prev,
    eco: observation.eco || prev.eco,
    name: observation.openingName || prev.name,
    games: (Number(prev.games) || 0) + 1,
    wins: (Number(prev.wins) || 0) + (won ? 1 : 0),
    losses: (Number(prev.losses) || 0) + (lost ? 1 : 0)
  };
  if (idx >= 0) list[idx] = row;
  else list.unshift(row);
  return list.sort((a, b) => (b.games || 0) - (a.games || 0)).slice(0, 32);
}

function upsertRivalV0(rivals, opponentCastleId, observation) {
  if (!opponentCastleId) return rivals || [];
  const list = [...(rivals || [])];
  const idx = list.findIndex((r) => r.castleId === opponentCastleId);
  const prev = idx >= 0 ? list[idx] : { castleId: opponentCastleId, matches: 0, wins: 0, losses: 0 };
  const won = observation.winner === "local";
  const lost = observation.winner === "opponent";
  const row = {
    ...prev,
    matches: (Number(prev.matches) || 0) + 1,
    wins: (Number(prev.wins) || 0) + (won ? 1 : 0),
    losses: (Number(prev.losses) || 0) + (lost ? 1 : 0),
    lastPlayedAt: observation.observedAt || nowIso()
  };
  if (idx >= 0) list[idx] = row;
  else list.unshift(row);
  return list.sort((a, b) => (b.matches || 0) - (a.matches || 0)).slice(0, MAX_RIVALS_V0);
}

/**
 * @param {object} observation
 * @param {{ castleId?: string, lesson?: object }} [opts]
 */
export function recordChessCivilizationMatchV0(observation, opts = {}) {
  const castleId = String(opts.castleId || readRawV0()?.castleId || "local_castle");
  const profile = ensureProfileV0(castleId);
  const won = observation.winner === "local";
  const draw = observation.winner === "draw";

  profile.elo = adjustEloV0(Number(profile.elo) || BASE_ELO_V0, won, draw);
  profile.openings = upsertOpeningStatV0(profile.openings, observation);
  profile.rivals = upsertRivalV0(profile.rivals, observation.opponentCastleId, observation);
  profile.matches = [
    {
      gameId: observation.gameId,
      opponentCastleId: observation.opponentCastleId,
      eco: observation.eco,
      openingName: observation.openingName,
      winner: observation.winner,
      lessonTitle: opts.lesson?.title || null,
      at: observation.observedAt || nowIso()
    },
    ...(profile.matches || [])
  ].slice(0, MAX_MATCHES_V0);
  profile.updatedAt = nowIso();

  writeRawV0(profile);
  return Object.freeze({ ...profile });
}

/**
 * @param {string} [castleId]
 */
export function readChessCivilizationV0(castleId) {
  const profile = ensureProfileV0(castleId || readRawV0()?.castleId);
  return Object.freeze({
    ...profile,
    openings: Object.freeze((profile.openings || []).map((o) => Object.freeze({ ...o }))),
    rivals: Object.freeze((profile.rivals || []).map((r) => Object.freeze({ ...r }))),
    matches: Object.freeze((profile.matches || []).map((m) => Object.freeze({ ...m })))
  });
}

/**
 * @param {object} remote
 */
export function mergeChessCivilizationFromCloudV0(remote = {}) {
  if (!remote?.castleId) return readChessCivilizationV0();
  const local = ensureProfileV0(remote.castleId);
  const merged = {
    ...local,
    ...remote,
    elo: Math.max(Number(local.elo) || BASE_ELO_V0, Number(remote.elo) || BASE_ELO_V0),
    openings: mergeOpeningListsV0(local.openings, remote.openings),
    rivals: mergeRivalListsV0(local.rivals, remote.rivals),
    matches: mergeMatchListsV0(local.matches, remote.matches),
    updatedAt: nowIso()
  };
  writeRawV0(merged);
  return readChessCivilizationV0(remote.castleId);
}

function mergeOpeningListsV0(a = [], b = []) {
  const map = new Map();
  for (const row of [...a, ...b]) {
    const key = String(row.eco || row.name).toLowerCase();
    const prev = map.get(key);
    map.set(key, {
      ...prev,
      ...row,
      games: Math.max(Number(prev?.games) || 0, Number(row.games) || 0),
      wins: Math.max(Number(prev?.wins) || 0, Number(row.wins) || 0),
      losses: Math.max(Number(prev?.losses) || 0, Number(row.losses) || 0)
    });
  }
  return [...map.values()];
}

function mergeRivalListsV0(a = [], b = []) {
  const map = new Map();
  for (const row of [...a, ...b]) {
    const prev = map.get(row.castleId);
    map.set(row.castleId, {
      ...prev,
      ...row,
      matches: Math.max(Number(prev?.matches) || 0, Number(row.matches) || 0),
      wins: Math.max(Number(prev?.wins) || 0, Number(row.wins) || 0),
      losses: Math.max(Number(prev?.losses) || 0, Number(row.losses) || 0)
    });
  }
  return [...map.values()];
}

function mergeMatchListsV0(a = [], b = []) {
  const map = new Map();
  for (const row of [...a, ...b]) {
    if (row?.gameId) map.set(row.gameId, { ...map.get(row.gameId), ...row });
  }
  return [...map.values()]
    .sort((x, y) => String(y.at).localeCompare(String(x.at)))
    .slice(0, MAX_MATCHES_V0);
}

export function resetChessCivilizationForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CHESS_CIVILIZATION_LS_KEY_V0);
  }
}

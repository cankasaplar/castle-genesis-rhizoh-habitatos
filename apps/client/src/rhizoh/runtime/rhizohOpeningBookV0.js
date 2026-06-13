/**
 * Rhizoh Opening Book v0 — Layer 4 (Learn): LLM-free opening statistics.
 */

export const RHIZOH_OPENING_BOOK_SCHEMA_V0 = "rhizoh.opening_book.v0";
export const RHIZOH_OPENING_BOOK_LS_KEY_V0 = "rhizoh_opening_book_v0";
export const RHIZOH_OPENING_BOOK_EVENT_V0 = "rhizoh:opening-book-v0";

const MAX_ENTRIES = 128;

function nowIso() {
  return new Date().toISOString();
}

function normalizeEntryV0(row) {
  const games = Number(row.games ?? row.playedCount) || 0;
  const wins = Number(row.wins ?? row.winCount) || 0;
  const losses = Number(row.losses);
  return {
    ...row,
    games,
    wins,
    losses: Number.isFinite(losses) ? losses : Math.max(0, games - wins)
  };
}

function readRawV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RHIZOH_OPENING_BOOK_LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries.map(normalizeEntryV0) : [];
  } catch {
    return [];
  }
}

function writeRawV0(entries) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    RHIZOH_OPENING_BOOK_LS_KEY_V0,
    JSON.stringify({ schema: RHIZOH_OPENING_BOOK_SCHEMA_V0, entries: entries.slice(0, MAX_ENTRIES) })
  );
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_OPENING_BOOK_EVENT_V0, {
        detail: Object.freeze({ count: Math.min(entries.length, MAX_ENTRIES) })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listRhizohOpeningBookV0() {
  return Object.freeze(
    readRawV0()
      .sort((a, b) => (b.games || 0) - (a.games || 0))
      .map((e) => Object.freeze(normalizeEntryV0(e)))
  );
}

/**
 * Learn from match observation (Layer 4 — Learn).
 * @param {object} observation — observeChessMatchV0 output
 */
export function learnOpeningFromObservationV0(observation = {}) {
  const name = String(observation.openingName || "Unknown Opening").slice(0, 120);
  if (!name) return null;
  const won = observation.winner === "local";
  const lost = observation.winner === "opponent";
  return recordOpeningFromMatchV0({
    name,
    eco: observation.eco,
    won,
    lost,
    opponentCastleId: observation.opponentCastleId
  });
}

/**
 * @param {{ name: string, eco?: string, moves?: string[], won?: boolean, lost?: boolean, opponentCastleId?: string }} input
 */
export function recordOpeningFromMatchV0(input = {}) {
  const name = String(input.name || "Unknown Opening").slice(0, 120);
  if (!name) return null;
  const entries = readRawV0();
  const key = String(input.eco || name).toLowerCase();
  const idx = entries.findIndex((e) => String(e.key || e.eco || e.name).toLowerCase() === key);
  const prev = idx >= 0 ? normalizeEntryV0(entries[idx]) : null;
  const games = (Number(prev?.games) || 0) + 1;
  const wins = (Number(prev?.wins) || 0) + (input.won === true ? 1 : 0);
  const losses = (Number(prev?.losses) || 0) + (input.lost === true ? 1 : 0);

  const row = Object.freeze({
    schema: `${RHIZOH_OPENING_BOOK_SCHEMA_V0}.entry`,
    id: prev?.id || `ob_${Date.now().toString(36)}`,
    key,
    eco: input.eco || prev?.eco || null,
    name,
    moves: Object.freeze((input.moves || prev?.moves || []).slice(0, 12)),
    games,
    wins,
    losses,
    lastOpponent: input.opponentCastleId || prev?.lastOpponent || null,
    updatedAt: nowIso()
  });
  if (idx >= 0) entries[idx] = row;
  else entries.unshift(row);
  writeRawV0(entries);
  return row;
}

/**
 * @param {string} name
 */
export function lookupOpeningLessonV0(name) {
  const needle = String(name || "").toLowerCase();
  const row = readRawV0().find((e) => String(e.name || "").toLowerCase() === needle);
  return row ? Object.freeze(normalizeEntryV0(row)) : null;
}

export function resetRhizohOpeningBookForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RHIZOH_OPENING_BOOK_LS_KEY_V0);
  }
}

/**
 * @param {ReadonlyArray<object>} remoteEntries
 */
export function mergeRhizohOpeningBookFromCloudV0(remoteEntries = []) {
  const byKey = new Map(readRawV0().map((e) => [e.key || e.eco || e.name, normalizeEntryV0(e)]));
  for (const row of remoteEntries || []) {
    const key = row?.key || row?.eco || row?.name;
    if (!key) continue;
    const prev = byKey.get(key);
    const normalized = normalizeEntryV0(row);
    byKey.set(key, {
      ...prev,
      ...normalized,
      games: Math.max(Number(prev?.games) || 0, Number(normalized.games) || 0),
      wins: Math.max(Number(prev?.wins) || 0, Number(normalized.wins) || 0),
      losses: Math.max(Number(prev?.losses) || 0, Number(normalized.losses) || 0)
    });
  }
  writeRawV0([...byKey.values()]);
  return listRhizohOpeningBookV0();
}

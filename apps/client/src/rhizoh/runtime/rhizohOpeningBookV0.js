/**
 * Rhizoh Opening Book v0 — learned openings from analyzed matches (LLM-free).
 */

export const RHIZOH_OPENING_BOOK_SCHEMA_V0 = "rhizoh.opening_book.v0";
export const RHIZOH_OPENING_BOOK_LS_KEY_V0 = "rhizoh_opening_book_v0";
export const RHIZOH_OPENING_BOOK_EVENT_V0 = "rhizoh:opening-book-v0";

const MAX_ENTRIES = 128;

function nowIso() {
  return new Date().toISOString();
}

function readRawV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RHIZOH_OPENING_BOOK_LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
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
      .sort((a, b) => (b.playedCount || 0) - (a.playedCount || 0))
      .map((e) => Object.freeze({ ...e }))
  );
}

/**
 * @param {{ name: string, eco?: string, moves?: string[], won?: boolean, lesson?: object, opponentCastleId?: string }} input
 */
export function recordOpeningFromMatchV0(input = {}) {
  const name = String(input.name || "Unknown Opening").slice(0, 120);
  if (!name) return null;
  const entries = readRawV0();
  const key = String(input.eco || name).toLowerCase();
  const idx = entries.findIndex((e) => String(e.key || e.name).toLowerCase() === key);
  const prev = idx >= 0 ? entries[idx] : null;
  const lessons = [...(prev?.lessons || [])];
  if (input.lesson) {
    lessons.unshift(
      Object.freeze({
        ...input.lesson,
        recordedAt: nowIso()
      })
    );
  }
  const row = Object.freeze({
    schema: `${RHIZOH_OPENING_BOOK_SCHEMA_V0}.entry`,
    id: prev?.id || `ob_${Date.now().toString(36)}`,
    key,
    name,
    eco: input.eco || prev?.eco || null,
    moves: Object.freeze((input.moves || prev?.moves || []).slice(0, 12)),
    playedCount: (Number(prev?.playedCount) || 0) + 1,
    winCount: (Number(prev?.winCount) || 0) + (input.won === true ? 1 : 0),
    lessons: Object.freeze(lessons.slice(0, 24)),
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
  return row ? Object.freeze({ ...row }) : null;
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
  const byKey = new Map(readRawV0().map((e) => [e.key || e.name, e]));
  for (const row of remoteEntries || []) {
    const key = row?.key || row?.name;
    if (!key) continue;
    const prev = byKey.get(key);
    byKey.set(key, {
      ...prev,
      ...row,
      playedCount: Math.max(Number(prev?.playedCount) || 0, Number(row.playedCount) || 0),
      winCount: Math.max(Number(prev?.winCount) || 0, Number(row.winCount) || 0)
    });
  }
  writeRawV0([...byKey.values()]);
  return listRhizohOpeningBookV0();
}

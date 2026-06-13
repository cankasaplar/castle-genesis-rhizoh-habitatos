/**
 * Castle Chronicle v0 — append-only living history for each castle.
 */

export const CASTLE_CHRONICLE_SCHEMA_V0 = "castle.chronicle.v0";
export const CASTLE_CHRONICLE_LS_KEY_V0 = "rhizoh_castle_chronicle_v0";
export const CASTLE_CHRONICLE_EVENT_V0 = "rhizoh:castle-chronicle-v0";

export const CASTLE_CHRONICLE_KIND_V0 = Object.freeze({
  FOUNDED: "castle_founded",
  FIRST_CONTACT: "first_contact",
  CHESS_MATCH: "chess_match",
  CHESS_WON: "chess_won",
  LIBRARY_WING: "library_wing",
  BROADCAST: "broadcast",
  SYNC: "cloud_sync",
  CUSTOM: "custom"
});

const MAX_ENTRIES = 512;

function nowIso() {
  return new Date().toISOString();
}

function displayDateFromIso(iso) {
  return String(iso || nowIso()).slice(0, 10);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRawV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CASTLE_CHRONICLE_LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function writeRawV0(entries) {
  if (typeof window === "undefined") return;
  const payload = {
    schema: CASTLE_CHRONICLE_SCHEMA_V0,
    entries: entries.slice(-MAX_ENTRIES)
  };
  window.localStorage.setItem(CASTLE_CHRONICLE_LS_KEY_V0, JSON.stringify(payload));
  try {
    window.dispatchEvent(
      new CustomEvent(CASTLE_CHRONICLE_EVENT_V0, {
        detail: Object.freeze({ count: payload.entries.length })
      })
    );
  } catch {
    /* noop */
  }
}

export function listCastleChronicleV0(opts = {}) {
  const limit = Math.max(1, Math.min(MAX_ENTRIES, Number(opts.limit) || MAX_ENTRIES));
  const rows = readRawV0();
  const sorted = [...rows].sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return Object.freeze(sorted.slice(0, limit).map((r) => Object.freeze({ ...r })));
}

/**
 * @param {{ kind: string, title: string, body?: string, payload?: object, dedupeKey?: string }} entry
 */
export function appendCastleChronicleEntryV0(entry = {}) {
  const kind = String(entry.kind || CASTLE_CHRONICLE_KIND_V0.CUSTOM).slice(0, 48);
  const title = String(entry.title || "").trim();
  if (!title) return null;
  const entries = readRawV0();
  if (entry.dedupeKey) {
    const key = String(entry.dedupeKey);
    if (entries.some((e) => e.dedupeKey === key)) {
      return entries.find((e) => e.dedupeKey === key) || null;
    }
  }
  const ts = nowIso();
  const row = Object.freeze({
    schema: `${CASTLE_CHRONICLE_SCHEMA_V0}.entry`,
    id: newId("chr"),
    ts,
    date: displayDateFromIso(ts),
    kind,
    title: title.slice(0, 200),
    body: String(entry.body || "").slice(0, 600),
    dedupeKey: entry.dedupeKey ? String(entry.dedupeKey).slice(0, 96) : null,
    payload: Object.freeze({ ...(entry.payload || {}) })
  });
  entries.push(row);
  writeRawV0(entries);
  return row;
}

export function recordCastleFoundedChronicleV0(opts = {}) {
  return appendCastleChronicleEntryV0({
    kind: CASTLE_CHRONICLE_KIND_V0.FOUNDED,
    title: opts.title || "Castle Founded",
    body: opts.body || `Founder: ${opts.founder || "unknown"}`,
    dedupeKey: "chronicle:castle_founded",
    payload: { founder: opts.founder, castleId: opts.castleId }
  });
}

export function recordFirstContactChronicleV0(opts = {}) {
  const peer = String(opts.peerCastleId || opts.peerName || "Unknown Castle").slice(0, 64);
  return appendCastleChronicleEntryV0({
    kind: CASTLE_CHRONICLE_KIND_V0.FIRST_CONTACT,
    title: `First Contact with ${peer}`,
    body: opts.body || "A new castle appeared on the network mesh.",
    dedupeKey: `chronicle:first_contact:${peer}`,
    payload: { peerCastleId: peer, region: opts.region || null }
  });
}

export function recordChessMatchChronicleV0(opts = {}) {
  const peer = String(opts.opponentCastleId || "opponent").slice(0, 64);
  const won = opts.won === true;
  return appendCastleChronicleEntryV0({
    kind: won ? CASTLE_CHRONICLE_KIND_V0.CHESS_WON : CASTLE_CHRONICLE_KIND_V0.CHESS_MATCH,
    title: won ? `Won Chess Match vs ${peer}` : `Chess Match with ${peer}`,
    body: opts.body || (won ? "Victory on the neural chess board." : "Match recorded on the arena."),
    dedupeKey: opts.matchId ? `chronicle:chess:${opts.matchId}` : undefined,
    payload: { opponentCastleId: peer, matchId: opts.matchId || null, won }
  });
}

export function recordLibraryWingChronicleV0(opts = {}) {
  return appendCastleChronicleEntryV0({
    kind: CASTLE_CHRONICLE_KIND_V0.LIBRARY_WING,
    title: opts.title || "Opened Library Wing",
    body: opts.body || "Codex vault wing brought online.",
    dedupeKey: opts.dedupeKey || "chronicle:library_wing:first",
    payload: { source: opts.source || "library_panel" }
  });
}

/**
 * @param {ReadonlyArray<object>} remoteEntries
 */
export function mergeCastleChronicleFromCloudV0(remoteEntries = []) {
  const local = readRawV0();
  const byId = new Map(local.map((e) => [e.id, e]));
  for (const row of remoteEntries || []) {
    if (!row?.id) continue;
    byId.set(row.id, { ...byId.get(row.id), ...row });
  }
  const merged = [...byId.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  writeRawV0(merged);
  return listCastleChronicleV0();
}

export function resetCastleChronicleForTestV0() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CASTLE_CHRONICLE_LS_KEY_V0);
}

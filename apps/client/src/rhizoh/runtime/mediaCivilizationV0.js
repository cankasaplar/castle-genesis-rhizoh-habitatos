/**
 * Media Civilization v0 — Layer 5: per-castle media learning profile (LLM-free stats).
 */

export const MEDIA_CIVILIZATION_SCHEMA_V0 = "rhizoh.media_civilization.v0";
export const MEDIA_CIVILIZATION_LS_KEY_V0 = "rhizoh_media_civilization_v0";
export const MEDIA_CIVILIZATION_EVENT_V0 = "rhizoh:media-civilization-v0";

function nowIso() {
  return new Date().toISOString();
}

function readRawV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEDIA_CIVILIZATION_LS_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRawV0(profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEDIA_CIVILIZATION_LS_KEY_V0, JSON.stringify(profile));
  try {
    window.dispatchEvent(
      new CustomEvent(MEDIA_CIVILIZATION_EVENT_V0, {
        detail: Object.freeze({ castleId: profile.castleId })
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
    schema: MEDIA_CIVILIZATION_SCHEMA_V0,
    castleId: id,
    itemsArchived: 0,
    notesWritten: 0,
    tagsApplied: 0,
    bookmarks: 0,
    sources: [],
    updatedAt: nowIso()
  };
}

/**
 * @param {{ castleId?: string, action: string, entityId?: string, channelId?: string, source?: string }} input
 */
export function recordMediaCivilizationEventV0(input = {}) {
  const profile = ensureProfileV0(input.castleId);
  const action = String(input.action || "").trim();
  if (action === "archive") profile.itemsArchived = (Number(profile.itemsArchived) || 0) + 1;
  if (action === "note") profile.notesWritten = (Number(profile.notesWritten) || 0) + 1;
  if (action === "tag") profile.tagsApplied = (Number(profile.tagsApplied) || 0) + 1;
  if (action === "bookmark") profile.bookmarks = (Number(profile.bookmarks) || 0) + 1;

  const sourceKey = input.channelId || input.source || "archive";
  const sources = [...(profile.sources || [])];
  const idx = sources.findIndex((s) => s.key === sourceKey);
  const prev = idx >= 0 ? sources[idx] : { key: sourceKey, count: 0 };
  const row = { ...prev, key: sourceKey, count: (Number(prev.count) || 0) + 1, lastAt: nowIso() };
  if (idx >= 0) sources[idx] = row;
  else sources.unshift(row);

  profile.sources = sources.slice(0, 32);
  profile.updatedAt = nowIso();
  writeRawV0(profile);
  return Object.freeze({ ...profile });
}

/**
 * @param {string} [castleId]
 */
export function readMediaCivilizationV0(castleId) {
  const profile = ensureProfileV0(castleId || readRawV0()?.castleId);
  return Object.freeze({
    ...profile,
    sources: Object.freeze((profile.sources || []).map((s) => Object.freeze({ ...s })))
  });
}

/**
 * @param {object} remote
 */
export function mergeMediaCivilizationFromCloudV0(remote = {}) {
  if (!remote?.castleId) return readMediaCivilizationV0();
  const local = ensureProfileV0(remote.castleId);
  const sourceMap = new Map((local.sources || []).map((s) => [s.key, s]));
  for (const row of remote.sources || []) {
    const prev = sourceMap.get(row.key);
    sourceMap.set(row.key, {
      ...prev,
      ...row,
      count: Math.max(Number(prev?.count) || 0, Number(row.count) || 0)
    });
  }
  const merged = {
    ...local,
    ...remote,
    itemsArchived: Math.max(Number(local.itemsArchived) || 0, Number(remote.itemsArchived) || 0),
    notesWritten: Math.max(Number(local.notesWritten) || 0, Number(remote.notesWritten) || 0),
    tagsApplied: Math.max(Number(local.tagsApplied) || 0, Number(remote.tagsApplied) || 0),
    bookmarks: Math.max(Number(local.bookmarks) || 0, Number(remote.bookmarks) || 0),
    sources: [...sourceMap.values()],
    updatedAt: nowIso()
  };
  writeRawV0(merged);
  return readMediaCivilizationV0(remote.castleId);
}

export function resetMediaCivilizationForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(MEDIA_CIVILIZATION_LS_KEY_V0);
  }
}

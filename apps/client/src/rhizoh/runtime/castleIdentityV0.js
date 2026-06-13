/**
 * Castle Identity v0 — founder, motto, lifetime stats for a living castle.
 */

export const CASTLE_IDENTITY_SCHEMA_V0 = "castle.identity.v0";
export const CASTLE_IDENTITY_LS_KEY_V0 = "rhizoh_castle_identity_v0";
export const CASTLE_IDENTITY_EVENT_V0 = "rhizoh:castle-identity-v0";

function nowIso() {
  return new Date().toISOString();
}

function readRawV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CASTLE_IDENTITY_LS_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRawV0(identity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CASTLE_IDENTITY_LS_KEY_V0, JSON.stringify(identity));
  try {
    window.dispatchEvent(
      new CustomEvent(CASTLE_IDENTITY_EVENT_V0, {
        detail: Object.freeze({ castleId: identity.castleId })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {{ castleId: string, founder?: string, motto?: string }} opts
 */
export function ensureCastleIdentityV0(opts = {}) {
  const castleId = String(opts.castleId || "").trim();
  if (!castleId) return null;
  const existing = readRawV0();
  if (existing?.castleId === castleId) return Object.freeze({ ...existing });

  const created = Object.freeze({
    schema: CASTLE_IDENTITY_SCHEMA_V0,
    castleId,
    founder: String(opts.founder || castleId).slice(0, 128),
    createdAt: nowIso(),
    motto: String(opts.motto || "Observe · Connect · Remember").slice(0, 240),
    visitors: 0,
    matchesPlayed: 0,
    libraryWingsOpened: 0,
    firstContacts: 0,
    updatedAt: nowIso()
  });
  writeRawV0(created);
  return created;
}

export function readCastleIdentityV0() {
  const row = readRawV0();
  return row ? Object.freeze({ ...row }) : null;
}

/**
 * @param {Partial<{ motto: string, visitors: number, matchesPlayed: number, libraryWingsOpened: number, firstContacts: number }>} patch
 */
export function patchCastleIdentityV0(patch = {}) {
  const current = readRawV0();
  if (!current) return null;
  const merged = Object.freeze({
    ...current,
    motto: patch.motto != null ? String(patch.motto).slice(0, 240) : current.motto,
    visitors:
      patch.visitors != null ? Math.max(0, Number(patch.visitors) || 0) : current.visitors,
    matchesPlayed:
      patch.matchesPlayed != null
        ? Math.max(0, Number(patch.matchesPlayed) || 0)
        : current.matchesPlayed,
    libraryWingsOpened:
      patch.libraryWingsOpened != null
        ? Math.max(0, Number(patch.libraryWingsOpened) || 0)
        : current.libraryWingsOpened,
    firstContacts:
      patch.firstContacts != null
        ? Math.max(0, Number(patch.firstContacts) || 0)
        : current.firstContacts,
    updatedAt: nowIso()
  });
  writeRawV0(merged);
  return merged;
}

export function incrementCastleIdentityStatV0(stat, delta = 1) {
  const current = readRawV0();
  if (!current) return null;
  const key = String(stat || "");
  const allowed = ["visitors", "matchesPlayed", "libraryWingsOpened", "firstContacts"];
  if (!allowed.includes(key)) return current;
  return patchCastleIdentityV0({ [key]: (Number(current[key]) || 0) + delta });
}

/**
 * Merge server identity (higher counters win).
 * @param {object} remote
 */
export function mergeCastleIdentityFromCloudV0(remote = {}) {
  if (!remote?.castleId) return readCastleIdentityV0();
  const local = readRawV0();
  if (!local || local.castleId !== remote.castleId) {
    const merged = Object.freeze({
      schema: CASTLE_IDENTITY_SCHEMA_V0,
      castleId: remote.castleId,
      founder: String(remote.founder || remote.castleId).slice(0, 128),
      createdAt: remote.createdAt || nowIso(),
      motto: String(remote.motto || "Observe · Connect · Remember").slice(0, 240),
      visitors: Math.max(0, Number(remote.visitors) || 0),
      matchesPlayed: Math.max(0, Number(remote.matchesPlayed) || 0),
      libraryWingsOpened: Math.max(0, Number(remote.libraryWingsOpened) || 0),
      firstContacts: Math.max(0, Number(remote.firstContacts) || 0),
      updatedAt: remote.updatedAt || nowIso()
    });
    writeRawV0(merged);
    return merged;
  }
  const merged = Object.freeze({
    ...local,
    motto: remote.motto || local.motto,
    visitors: Math.max(local.visitors || 0, Number(remote.visitors) || 0),
    matchesPlayed: Math.max(local.matchesPlayed || 0, Number(remote.matchesPlayed) || 0),
    libraryWingsOpened: Math.max(
      local.libraryWingsOpened || 0,
      Number(remote.libraryWingsOpened) || 0
    ),
    firstContacts: Math.max(local.firstContacts || 0, Number(remote.firstContacts) || 0),
    createdAt: local.createdAt || remote.createdAt,
    updatedAt: nowIso()
  });
  writeRawV0(merged);
  return merged;
}

export function resetCastleIdentityForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CASTLE_IDENTITY_LS_KEY_V0);
  }
}

/**
 * Matchmaking Beacon Registry v0 — shadow rehearsal (Plane: matchmaking event layer).
 * Indexes user match intents · NOT server authority until gateway handler ships.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { ensureMatchmakingEngineSurfaceV0 } from "./matchmakingRuntimeSurfaceV0.js";

export const MATCH_BEACON_SCHEMA_V0 = "castle.rhizoh.match_beacon.v1";
export const MATCH_MODE_V0 = Object.freeze({
  KINETIC: "KINETIC",
  ASYNC: "ASYNC"
});

const REGISTRY_STORAGE_KEY_V0 = "rhizoh.matchmaking.beacon_registry.v0";
const DEFAULT_KINETIC_TTL_MS_V0 = 120_000;
const DEFAULT_ASYNC_TTL_MS_V0 = 86_400_000;
const MAX_BEACONS_V0 = 128;
const RATE_WINDOW_MS_V0 = 60_000;
const MAX_EMITS_PER_WINDOW_V0 = 6;

/** @type {Map<string, number[]>} */
const emitTimestampsV0 = new Map();

function readRegistryRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REGISTRY_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRegistryRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(REGISTRY_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function createBeaconIdV0(userId, mode) {
  return `beacon_${mode.toLowerCase()}_${String(userId).slice(0, 16)}_${Date.now().toString(36)}`;
}

/**
 * @param {string} userId
 */
function checkEmitRateLimitV0(userId) {
  const now = Date.now();
  const key = String(userId || "anon");
  const prev = (emitTimestampsV0.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS_V0);
  if (prev.length >= MAX_EMITS_PER_WINDOW_V0) {
    return Object.freeze({ allowed: false, reason: "rate_limited", retryAfterMs: RATE_WINDOW_MS_V0 });
  }
  prev.push(now);
  emitTimestampsV0.set(key, prev);
  return Object.freeze({ allowed: true });
}

/**
 * Pure beacon emit — no storage writes (truth reducer path).
 * @param {object|null} registryRow
 * @param {object} input
 */
export function applyBeaconEmitToRegistryV0(registryRow, input = {}) {
  const userId = String(input.userId || "").trim();
  if (!userId) {
    return Object.freeze({ ok: false, reason: "missing_user_id", interpretationOnly: true });
  }

  const rate = checkEmitRateLimitV0(userId);
  if (!rate.allowed) {
    return Object.freeze({ ok: false, reason: rate.reason, retryAfterMs: rate.retryAfterMs, interpretationOnly: true });
  }

  const mode = input.mode === MATCH_MODE_V0.ASYNC ? MATCH_MODE_V0.ASYNC : MATCH_MODE_V0.KINETIC;
  const now = Date.now();
  const ttl = mode === MATCH_MODE_V0.ASYNC ? DEFAULT_ASYNC_TTL_MS_V0 : DEFAULT_KINETIC_TTL_MS_V0;
  const timeControlMs = Math.max(1000, Number(input.timeControlMs) || (mode === MATCH_MODE_V0.ASYNC ? 86_400_000 : 180_000));

  const beacon = Object.freeze({
    schema: MATCH_BEACON_SCHEMA_V0,
    beaconId: createBeaconIdV0(userId, mode),
    userId,
    mode,
    timeControlMs,
    ratingRange: Array.isArray(input.ratingRange) ? Object.freeze([...input.ratingRange]) : undefined,
    entropyTag: Number.isFinite(input.entropyTag) ? Math.min(1, Math.max(0, input.entropyTag)) : undefined,
    createdAtMs: now,
    expiresAtMs: now + ttl,
    interpretationOnly: true,
    serverAuthoritative: false
  });

  const beacons = [...(registryRow?.beacons || []).filter((b) => b.expiresAtMs > now && b.userId !== userId), beacon].slice(
    -MAX_BEACONS_V0
  );

  const registry = Object.freeze({
    schema: "castle.rhizoh.matchmaking_beacon_registry.v0",
    beacons: Object.freeze(beacons),
    count: beacons.length,
    shadowRehearsal: true,
    serverAuthoritative: false,
    interpretationOnly: true
  });

  return Object.freeze({ ok: true, beacon, registry, interpretationOnly: true });
}

/**
 * Pure beacon cancel — no storage writes.
 * @param {object|null} registryRow
 * @param {string} beaconId
 */
export function applyBeaconCancelToRegistryV0(registryRow, beaconId) {
  const id = String(beaconId || "");
  if (!registryRow) return Object.freeze({ ok: false, reason: "empty_registry" });

  const beacons = (registryRow.beacons || []).filter((b) => b.beaconId !== id);
  const registry = Object.freeze({ ...registryRow, beacons: Object.freeze(beacons), count: beacons.length });
  return Object.freeze({ ok: true, cancelled: id, registry });
}

/**
 * @param {{ userId: string, mode?: string, timeControlMs?: number, ratingRange?: [number, number], entropyTag?: number }} input
 */
export function emitMatchBeaconV0(input = {}) {
  const applied = applyBeaconEmitToRegistryV0(readRegistryRowV0(), input);
  if (!applied.ok) return applied;
  writeRegistryRowV0(applied.registry);
  return Object.freeze({ ok: true, beacon: applied.beacon, registry: applied.registry });
}

/**
 * @param {string} beaconId
 */
export function cancelMatchBeaconV0(beaconId) {
  const applied = applyBeaconCancelToRegistryV0(readRegistryRowV0(), beaconId);
  if (!applied.ok) return applied;
  writeRegistryRowV0(applied.registry);
  return Object.freeze({ ok: true, cancelled: applied.cancelled, registry: applied.registry });
}

export function getMatchBeaconRegistrySnapshotV0() {
  const now = Date.now();
  const row = readRegistryRowV0();
  const beacons = Object.freeze((row?.beacons || []).filter((b) => b.expiresAtMs > now));
  return Object.freeze({
    schema: "castle.rhizoh.matchmaking_beacon_registry.v0",
    beacons,
    count: beacons.length,
    shadowRehearsal: true,
    serverAuthoritative: false,
    interpretationOnly: true
  });
}

/**
 * @param {{ mode?: string }} [opts]
 */
export function listActiveBeaconsV0(opts = {}) {
  const snap = getMatchBeaconRegistrySnapshotV0();
  const mode = opts.mode;
  if (!mode) return snap;
  const filtered = snap.beacons.filter((b) => b.mode === mode);
  return Object.freeze({ ...snap, beacons: Object.freeze(filtered), count: filtered.length });
}

export function clearMatchBeaconRegistryForTestV0() {
  emitTimestampsV0.clear();
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(REGISTRY_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

function mountBeaconEngineV0() {
  const engine = ensureMatchmakingEngineSurfaceV0();
  if (!engine) return;
  engine.emitBeacon = emitMatchBeaconV0;
  engine.registry = Object.freeze({
    emit: emitMatchBeaconV0,
    cancel: cancelMatchBeaconV0,
    snapshot: getMatchBeaconRegistrySnapshotV0,
    list: listActiveBeaconsV0,
    clear: clearMatchBeaconRegistryForTestV0
  });
}

export function mountMatchmakingBeaconRegistryConsoleV0() {
  if (typeof window === "undefined") return;
  mountBeaconEngineV0();
}

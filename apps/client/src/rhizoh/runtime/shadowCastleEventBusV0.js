/**
 * Shadow Castle Event Bus v0 — append-only read-only event ring (Phase A data-plane).
 * RESEARCH-ONLY — no WAL / no cross-castle state merge / no execution authority.
 * @see docs/RHIZOH_SHADOW_DATA_PLANE_V0.md
 */

export const SHADOW_CASTLE_EVENT_BUS_SCHEMA_V0 = "castle.rhizoh.shadow_event_bus.v0";
export const SHADOW_CASTLE_EVENT_LS_KEY_V0 = "rhizoh.shadow_castle_event_bus.v0";
export const SHADOW_CASTLE_BUS_EVENT_V0 = "rhizoh:shadow-castle-bus-v0";

export const SHADOW_CASTLE_EVENT_TYPE_V0 = Object.freeze({
  RESOURCE_DISCOVERED: "resource.discovered.v0",
  ATMOSPHERE_SHIFT: "atmosphere.shift.v0",
  CASTLE_ECHO: "castle.echo.v0"
});

const MAX_EVENTS_V0 = 128;
let logicalSeqV0 = 0;
/** @type {object[]} */
let sessionRingV0 = [];

function readPersistedRingV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHADOW_CASTLE_EVENT_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedRingV0(ring) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SHADOW_CASTLE_EVENT_LS_KEY_V0, JSON.stringify(ring.slice(-MAX_EVENTS_V0)));
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   type?: string,
 *   fromCastleId?: string,
 *   toCastleId?: string | null,
 *   payload?: object,
 *   source?: string
 * }} row
 */
export function buildShadowCastleEventV0(row = {}) {
  const seq = (logicalSeqV0 += 1);
  const fromCastleId = String(row.fromCastleId || "origin_home_serencebey");
  const toCastleId = row.toCastleId == null ? null : String(row.toCastleId);
  const type = String(row.type || SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_ECHO);
  const eventId = `shadow_${fromCastleId}_${seq}_${Date.now()}`;
  return Object.freeze({
    schema: SHADOW_CASTLE_EVENT_BUS_SCHEMA_V0,
    eventId,
    seq,
    type,
    fromCastleId,
    toCastleId,
    payload: Object.freeze(row.payload && typeof row.payload === "object" ? row.payload : {}),
    t: Object.freeze({
      atMs: Date.now(),
      iso: new Date().toISOString()
    }),
    meta: Object.freeze({
      source: String(row.source || "shadow_bus"),
      readOnly: true,
      nonExecutive: true,
      realityMutationPermitted: false
    })
  });
}

/**
 * @param {object} event
 */
export function appendShadowCastleEventV0(event) {
  if (!event?.schema?.includes("shadow_event_bus")) return null;
  sessionRingV0 = [event, ...sessionRingV0].slice(0, MAX_EVENTS_V0);
  const persisted = [...readPersistedRingV0(), event].slice(-MAX_EVENTS_V0);
  writePersistedRingV0(persisted);
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(SHADOW_CASTLE_BUS_EVENT_V0, { detail: event }));
  }
  return event;
}

/**
 * @param {Parameters<typeof buildShadowCastleEventV0>[0]} row
 */
export function emitShadowCastleEventV0(row = {}) {
  return appendShadowCastleEventV0(buildShadowCastleEventV0(row));
}

/**
 * @param {number} [limit]
 */
export function readShadowCastleEventRingV0(limit = 32) {
  const persisted = readPersistedRingV0();
  const merged = [...sessionRingV0, ...persisted];
  const seen = new Set();
  /** @type {object[]} */
  const out = [];
  for (const ev of merged) {
    const id = ev.eventId || `${ev.seq}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(ev);
    if (out.length >= limit) break;
  }
  return Object.freeze(out);
}

export function getShadowCastleEventBusSnapshotV0() {
  const ring = readShadowCastleEventRingV0(MAX_EVENTS_V0);
  return Object.freeze({
    schema: `${SHADOW_CASTLE_EVENT_BUS_SCHEMA_V0}.snapshot`,
    eventCount: ring.length,
    logicalSeq: logicalSeqV0,
    recent: Object.freeze(ring.slice(0, 8)),
    readOnly: true,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowCastleEventBusForTestV0() {
  logicalSeqV0 = 0;
  sessionRingV0 = [];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(SHADOW_CASTLE_EVENT_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}

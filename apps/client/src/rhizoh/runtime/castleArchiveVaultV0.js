/**
 * Castle Archive Vault v0 — EU AI Act aligned local store.
 * Entity records are tombstone-deletable; audit events are append-only (never deleted).
 */

export const CASTLE_ARCHIVE_VAULT_SCHEMA_V0 = "castle.archive_vault.v0";
export const CASTLE_ARCHIVE_VAULT_LS_KEY_V0 = "rhizoh_castle_archive_vault_v0";
export const CASTLE_ARCHIVE_VAULT_EVENT_V0 = "rhizoh:castle-archive-vault-v0";
export const CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0 = "rhizoh:castle-archive-open-media-v0";

const MAX_ENTITIES_V0 = 128;
const MAX_EVENTS_V0 = 512;

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @returns {{ entities: object[], events: object[] }}
 */
function readVaultRawV0() {
  if (typeof window === "undefined") {
    return { entities: [], events: [] };
  }
  try {
    const raw = window.localStorage.getItem(CASTLE_ARCHIVE_VAULT_LS_KEY_V0);
    if (!raw) return { entities: [], events: [] };
    const parsed = JSON.parse(raw);
    return {
      entities: Array.isArray(parsed?.entities) ? parsed.entities : [],
      events: Array.isArray(parsed?.events) ? parsed.events : []
    };
  } catch {
    return { entities: [], events: [] };
  }
}

function writeVaultRawV0(entities, events) {
  if (typeof window === "undefined") return;
  const payload = {
    schema: CASTLE_ARCHIVE_VAULT_SCHEMA_V0,
    entities: entities.slice(0, MAX_ENTITIES_V0),
    events: events.slice(-MAX_EVENTS_V0)
  };
  window.localStorage.setItem(CASTLE_ARCHIVE_VAULT_LS_KEY_V0, JSON.stringify(payload));
  try {
    window.dispatchEvent(
      new CustomEvent(CASTLE_ARCHIVE_VAULT_EVENT_V0, {
        detail: Object.freeze({ entityCount: payload.entities.length, eventCount: payload.events.length })
      })
    );
  } catch {
    /* noop */
  }
}

function appendEventV0(events, type, entityId, payload = {}) {
  const row = Object.freeze({
    id: newId("evt"),
    type: String(type || "unknown"),
    entityId: entityId ? String(entityId) : null,
    ts: nowIso(),
    payload: Object.freeze({ ...payload })
  });
  events.push(row);
  return events;
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listCastleArchiveEntitiesV0(opts = {}) {
  const { entities } = readVaultRawV0();
  const includeTombstoned = opts.includeTombstoned === true;
  const rows = entities.filter((e) => includeTombstoned || !e.tombstonedAt);
  return Object.freeze(rows.map((e) => Object.freeze({ ...e })));
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listCastleArchiveEventsV0() {
  const { events } = readVaultRawV0();
  return Object.freeze(events.map((e) => Object.freeze({ ...e })));
}

/**
 * @param {{
 *   title: string,
 *   format?: string,
 *   content?: string,
 *   mediaUrl?: string,
 *   source?: string,
 *   towerId?: string
 * }} input
 */
export function saveCastleArchiveEntityV0(input = {}) {
  const title = String(input.title || "Untitled").trim().slice(0, 200);
  const format = String(input.format || "text/plain").trim().slice(0, 64);
  const { entities, events } = readVaultRawV0();
  const entity = Object.freeze({
    id: newId("ent"),
    title,
    format,
    content: input.content != null ? String(input.content).slice(0, 500_000) : "",
    mediaUrl: input.mediaUrl ? String(input.mediaUrl).slice(0, 2048) : null,
    source: String(input.source || "user").slice(0, 64),
    towerId: input.towerId ? String(input.towerId).slice(0, 64) : null,
    createdAt: nowIso(),
    tombstonedAt: null
  });
  entities.unshift(entity);
  const nextEvents = appendEventV0(events, "entity_saved", entity.id, {
    title: entity.title,
    format: entity.format,
    source: entity.source
  });
  writeVaultRawV0(entities, nextEvents);
  return entity;
}

/**
 * Tombstone entity — EU AI Act: deletable user-facing ID; event log preserved.
 * @param {string} entityId
 */
export function tombstoneCastleArchiveEntityV0(entityId) {
  const id = String(entityId || "").trim();
  if (!id) return { ok: false, reason: "missing_id" };
  const { entities, events } = readVaultRawV0();
  const idx = entities.findIndex((e) => e.id === id && !e.tombstonedAt);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const updated = { ...entities[idx], tombstonedAt: nowIso() };
  entities[idx] = updated;
  const nextEvents = appendEventV0(events, "entity_tombstoned", id, { title: updated.title });
  writeVaultRawV0(entities, nextEvents);
  return Object.freeze({ ok: true, entity: Object.freeze(updated) });
}

/**
 * Open entity in media player surface.
 * @param {string} entityId
 */
export function openCastleArchiveEntityInMediaV0(entityId) {
  const id = String(entityId || "").trim();
  const entity = listCastleArchiveEntitiesV0().find((e) => e.id === id);
  if (!entity) return { ok: false, reason: "not_found" };
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  try {
    window.dispatchEvent(
      new CustomEvent(CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0, {
        detail: Object.freeze({ entity })
      })
    );
  } catch {
    return { ok: false, reason: "dispatch_failed" };
  }
  const { entities, events } = readVaultRawV0();
  const nextEvents = appendEventV0(events, "entity_opened_in_media", id, { format: entity.format });
  writeVaultRawV0(entities, nextEvents);
  return Object.freeze({ ok: true, entity });
}

/**
 * Import a document blob/text into vault and optionally open in media player.
 * @param {{ title: string, format?: string, content?: string, mediaUrl?: string, openInMedia?: boolean }} input
 */
export function importCastleArchiveDocumentV0(input = {}) {
  const entity = saveCastleArchiveEntityV0(input);
  if (input.openInMedia !== false) {
    openCastleArchiveEntityInMediaV0(entity.id);
  }
  return entity;
}

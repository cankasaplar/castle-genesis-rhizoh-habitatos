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

function normalizeTagsV0(tags = []) {
  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    const tag = String(raw || "")
      .trim()
      .toLowerCase()
      .slice(0, 48);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out.slice(0, 24);
}

function findEntityIndexV0(entities, entityId) {
  const id = String(entityId || "").trim();
  return entities.findIndex((e) => e.id === id && !e.tombstonedAt);
}

function updateEntityV0(entityId, mutator) {
  const id = String(entityId || "").trim();
  if (!id) return { ok: false, reason: "missing_id" };
  const { entities, events } = readVaultRawV0();
  const idx = findEntityIndexV0(entities, id);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const next = mutator({ ...entities[idx] });
  if (!next) return { ok: false, reason: "mutation_failed" };
  entities[idx] = Object.freeze(next);
  writeVaultRawV0(entities, events);
  return Object.freeze({ ok: true, entity: Object.freeze({ ...next }) });
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
    mediaArchiveRef: input.mediaArchiveRef ? String(input.mediaArchiveRef).slice(0, 96) : null,
    channelId: input.channelId ? String(input.channelId).slice(0, 64) : null,
    source: String(input.source || "user").slice(0, 64),
    towerId: input.towerId ? String(input.towerId).slice(0, 64) : null,
    tags: Object.freeze(normalizeTagsV0(input.tags || [])),
    userNotes: Object.freeze([]),
    bookmarks: Object.freeze([]),
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

/**
 * @param {string} entityId
 */
export function readCastleArchiveEntityV0(entityId) {
  const id = String(entityId || "").trim();
  const entity = listCastleArchiveEntitiesV0().find((e) => e.id === id);
  return entity ? Object.freeze({ ...entity }) : null;
}

/**
 * @param {string} entityId
 * @param {string} text
 */
export function addCastleArchiveUserNoteV0(entityId, text) {
  const noteText = String(text || "").trim().slice(0, 2000);
  if (!noteText) return { ok: false, reason: "empty_note" };
  const { entities, events } = readVaultRawV0();
  const idx = findEntityIndexV0(entities, entityId);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const prev = entities[idx];
  const note = Object.freeze({
    id: newId("note"),
    text: noteText,
    createdAt: nowIso()
  });
  const updated = Object.freeze({
    ...prev,
    userNotes: Object.freeze([note, ...(prev.userNotes || [])].slice(0, 48))
  });
  entities[idx] = updated;
  const nextEvents = appendEventV0(events, "user_note_added", entityId, { noteId: note.id });
  writeVaultRawV0(entities, nextEvents);
  return Object.freeze({ ok: true, entity: updated, note });
}

/**
 * @param {string} entityId
 * @param {string} tag
 */
export function addCastleArchiveTagV0(entityId, tag) {
  const normalized = normalizeTagsV0([tag]);
  if (!normalized.length) return { ok: false, reason: "empty_tag" };
  const { entities, events } = readVaultRawV0();
  const idx = findEntityIndexV0(entities, entityId);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const prev = entities[idx];
  const tags = normalizeTagsV0([...(prev.tags || []), ...normalized]);
  const updated = Object.freeze({ ...prev, tags: Object.freeze(tags) });
  entities[idx] = updated;
  const nextEvents = appendEventV0(events, "tag_added", entityId, { tag: normalized[0] });
  writeVaultRawV0(entities, nextEvents);
  return Object.freeze({ ok: true, entity: updated, tag: normalized[0] });
}

/**
 * @param {string} entityId
 * @param {{ label?: string, positionSec?: number }} bookmark
 */
export function addCastleArchiveBookmarkV0(entityId, bookmark = {}) {
  const label = String(bookmark.label || "Bookmark").trim().slice(0, 120);
  const positionSec =
    bookmark.positionSec != null && Number.isFinite(Number(bookmark.positionSec))
      ? Math.max(0, Number(bookmark.positionSec))
      : null;
  const { entities, events } = readVaultRawV0();
  const idx = findEntityIndexV0(entities, entityId);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const prev = entities[idx];
  const row = Object.freeze({
    id: newId("bm"),
    label,
    positionSec,
    createdAt: nowIso()
  });
  const updated = Object.freeze({
    ...prev,
    bookmarks: Object.freeze([row, ...(prev.bookmarks || [])].slice(0, 48))
  });
  entities[idx] = updated;
  const nextEvents = appendEventV0(events, "bookmark_added", entityId, {
    bookmarkId: row.id,
    positionSec
  });
  writeVaultRawV0(entities, nextEvents);
  return Object.freeze({ ok: true, entity: updated, bookmark: row });
}

/**
 * Promote encrypted world-space media archive entry into Castle Archive Vault.
 * @param {{ mediaArchiveId: string, title?: string, channelId?: string, source?: string }} input
 */
export function promoteMediaArchiveToCastleVaultV0(input = {}) {
  const mediaArchiveId = String(input.mediaArchiveId || "").trim();
  if (!mediaArchiveId) return { ok: false, reason: "missing_media_ref" };
  const entity = saveCastleArchiveEntityV0({
    title: input.title || "Media Recording",
    format: "application/x-rhizoh-encrypted-media",
    content: "",
    mediaArchiveRef: mediaArchiveId,
    channelId: input.channelId || null,
    source: input.source || "media_tube",
    tags: input.tags || ["media", "recording"]
  });
  return Object.freeze({ ok: true, entity });
}

/**
 * Hydrate local vault from cloud sync snapshot (merge by id).
 * @param {{ entities?: object[], events?: object[] }} snapshot
 */
export function importCastleArchiveEntitiesFromCloudV0(snapshot = {}) {
  const { entities: localEntities, events: localEvents } = readVaultRawV0();
  const entById = new Map(localEntities.map((e) => [e.id, e]));
  for (const ent of snapshot.entities || []) {
    if (!ent?.id) continue;
    entById.set(ent.id, { ...entById.get(ent.id), ...ent });
  }
  const evtIds = new Set(localEvents.map((e) => e.id));
  const mergedEvents = [...localEvents];
  for (const evt of snapshot.events || []) {
    if (!evt?.id || evtIds.has(evt.id)) continue;
    mergedEvents.push(evt);
    evtIds.add(evt.id);
  }
  writeVaultRawV0([...entById.values()], mergedEvents);
  return Object.freeze({
    entityCount: entById.size,
    eventCount: mergedEvents.length
  });
}

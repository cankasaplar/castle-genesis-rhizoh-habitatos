/**
 * Media Civilization Pipeline v0 — Video → Archive → Memory → Knowledge → Chronicle.
 * User-initiated only: Notes, Tags, Bookmarks. No auto-summary.
 */

import {
  addCastleArchiveBookmarkV0,
  addCastleArchiveTagV0,
  addCastleArchiveUserNoteV0,
  promoteMediaArchiveToCastleVaultV0,
  readCastleArchiveEntityV0,
  saveCastleArchiveEntityV0
} from "./castleArchiveVaultV0.js";
import { appendCastleChronicleEntryV0, CASTLE_CHRONICLE_KIND_V0 } from "./castleChronicleV0.js";
import { appendGhostMemoryV0 } from "./ghostMemoryPersistenceV0.js";
import { upsertRhizohKnowledgeV0, RHIZOH_TEACHER_SOURCE_V0 } from "./rhizohKnowledgeStoreV0.js";
import { recordMediaCivilizationEventV0 } from "./mediaCivilizationV0.js";
import { readCastleIdentityV0 } from "./castleIdentityV0.js";

export const MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0 = "rhizoh.media_civilization_pipeline.v0";
export const MEDIA_CIVILIZATION_EVENT_V0 = "rhizoh:media-civilization-pipeline-v0";

export const MEDIA_CIVILIZATION_ACTION_V0 = Object.freeze({
  ARCHIVE: "archive",
  INDEX: "index",
  NOTE: "note",
  TAG: "tag",
  BOOKMARK: "bookmark",
  PROMOTE_RECORDING: "promote_recording"
});

function persistToMemoryKnowledgeChronicleV0(opts = {}) {
  const entity = opts.entity;
  if (!entity) return null;

  const tags = [...(opts.tags || entity.tags || []), "media", opts.action].filter(Boolean);
  appendGhostMemoryV0({
    summary: opts.memorySummary || opts.chronicleTitle || entity.title,
    tags: tags.slice(0, 12),
    peerCastleId: null
  });

  if (opts.knowledgeQuestion && opts.knowledgeAnswer) {
    upsertRhizohKnowledgeV0({
      question: opts.knowledgeQuestion,
      answer: opts.knowledgeAnswer,
      teacher: RHIZOH_TEACHER_SOURCE_V0.USER,
      tags: normalizeKnowledgeTagsV0(entity.tags, opts.action),
      confidence: 0.95
    });
  }

  appendCastleChronicleEntryV0({
    kind: opts.chronicleKind || CASTLE_CHRONICLE_KIND_V0.BROADCAST,
    title: opts.chronicleTitle || entity.title,
    body: opts.chronicleBody || "",
    dedupeKey: opts.dedupeKey,
    payload: Object.freeze({
      entityId: entity.id,
      action: opts.action,
      channelId: entity.channelId || null,
      tags: entity.tags || []
    })
  });

  recordMediaCivilizationEventV0({
    castleId: opts.castleId || readCastleIdentityV0()?.castleId,
    action: opts.action,
    entityId: entity.id,
    channelId: entity.channelId,
    source: entity.source
  });

  return Object.freeze({
    entity,
    action: opts.action,
    layers: Object.freeze(["archive", "memory", "knowledge", "chronicle", "civilization"])
  });
}

function normalizeKnowledgeTagsV0(entityTags = [], action) {
  return Object.freeze(
    [...new Set([...(entityTags || []), "media", String(action || "archive")])].slice(0, 12)
  );
}

/**
 * @param {{
 *   action: string,
 *   entityId?: string,
 *   title?: string,
 *   format?: string,
 *   content?: string,
 *   mediaUrl?: string,
 *   channelId?: string,
 *   source?: string,
 *   noteText?: string,
 *   tag?: string,
 *   bookmark?: { label?: string, positionSec?: number },
 *   mediaArchiveId?: string,
 *   castleId?: string,
 *   locale?: string
 * }} opts
 */
export function runMediaCivilizationPipelineV0(opts = {}) {
  const action = String(opts.action || "").trim();
  const castleId = opts.castleId || readCastleIdentityV0()?.castleId;

  if (action === MEDIA_CIVILIZATION_ACTION_V0.ARCHIVE) {
    const entity = saveCastleArchiveEntityV0({
      title: opts.title,
      format: opts.format,
      content: opts.content,
      mediaUrl: opts.mediaUrl,
      channelId: opts.channelId,
      source: opts.source || "media_civilization",
      tags: opts.tag ? [opts.tag] : ["media"]
    });
    const result = persistToMemoryKnowledgeChronicleV0({
      entity,
      action: "archive",
      castleId,
      memorySummary: `Archived: ${entity.title}`,
      chronicleTitle: `Archived: ${entity.title}`,
      chronicleBody: opts.content ? String(opts.content).slice(0, 280) : "Media item saved to castle archive.",
      chronicleKind: CASTLE_CHRONICLE_KIND_V0.BROADCAST,
      dedupeKey: `chronicle:media_archive:${entity.id}`,
      knowledgeQuestion: `What is archived in ${entity.title}?`,
      knowledgeAnswer: opts.content
        ? String(opts.content).slice(0, 480)
        : `User archived "${entity.title}" from ${entity.source || "media"}.`
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result });
  }

  if (action === MEDIA_CIVILIZATION_ACTION_V0.PROMOTE_RECORDING) {
    const promoted = promoteMediaArchiveToCastleVaultV0({
      mediaArchiveId: opts.mediaArchiveId,
      title: opts.title,
      channelId: opts.channelId,
      source: opts.source || "media_tube"
    });
    if (!promoted.ok) return promoted;
    const result = persistToMemoryKnowledgeChronicleV0({
      entity: promoted.entity,
      action: "archive",
      castleId,
      memorySummary: `Recording archived: ${promoted.entity.title}`,
      chronicleTitle: `Recording archived: ${promoted.entity.title}`,
      chronicleBody: "Encrypted media recording promoted to Castle Archive.",
      dedupeKey: `chronicle:media_promote:${promoted.entity.id}`,
      knowledgeQuestion: `Where is recording ${promoted.entity.title}?`,
      knowledgeAnswer: `Recording stored in castle archive (ref: ${opts.mediaArchiveId}).`
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result });
  }

  const entityId = String(opts.entityId || "").trim();

  if (action === MEDIA_CIVILIZATION_ACTION_V0.INDEX) {
    const entity = readCastleArchiveEntityV0(entityId);
    if (!entity) return Object.freeze({ ok: false, reason: "not_found" });
    const result = persistToMemoryKnowledgeChronicleV0({
      entity,
      action: "archive",
      castleId,
      memorySummary: `Archived: ${entity.title}`,
      chronicleTitle: `Archived: ${entity.title}`,
      chronicleBody: entity.content ? String(entity.content).slice(0, 280) : "Saved to castle archive.",
      dedupeKey: `chronicle:media_archive:${entity.id}`,
      knowledgeQuestion: `What is archived in ${entity.title}?`,
      knowledgeAnswer: entity.content
        ? String(entity.content).slice(0, 480)
        : `User archived "${entity.title}" from ${entity.source || "media"}.`
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result });
  }

  if (!entityId) return Object.freeze({ ok: false, reason: "missing_entity_id" });

  if (action === MEDIA_CIVILIZATION_ACTION_V0.NOTE) {
    const out = addCastleArchiveUserNoteV0(entityId, opts.noteText);
    if (!out.ok) return out;
    const result = persistToMemoryKnowledgeChronicleV0({
      entity: out.entity,
      action: "note",
      castleId,
      memorySummary: `Note on ${out.entity.title}: ${out.note.text.slice(0, 120)}`,
      chronicleTitle: `Note: ${out.entity.title}`,
      chronicleBody: out.note.text,
      dedupeKey: `chronicle:media_note:${out.note.id}`,
      knowledgeQuestion: `User note on ${out.entity.title}`,
      knowledgeAnswer: out.note.text
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result, note: out.note });
  }

  if (action === MEDIA_CIVILIZATION_ACTION_V0.TAG) {
    const out = addCastleArchiveTagV0(entityId, opts.tag);
    if (!out.ok) return out;
    const result = persistToMemoryKnowledgeChronicleV0({
      entity: out.entity,
      action: "tag",
      castleId,
      memorySummary: `Tagged ${out.entity.title}: #${out.tag}`,
      chronicleTitle: `Tagged: ${out.entity.title}`,
      chronicleBody: `Tag applied: ${out.tag}`,
      dedupeKey: `chronicle:media_tag:${entityId}:${out.tag}`,
      knowledgeQuestion: `Tags for ${out.entity.title}`,
      knowledgeAnswer: (out.entity.tags || []).join(", ")
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result, tag: out.tag });
  }

  if (action === MEDIA_CIVILIZATION_ACTION_V0.BOOKMARK) {
    const out = addCastleArchiveBookmarkV0(entityId, opts.bookmark || {});
    if (!out.ok) return out;
    const pos =
      out.bookmark.positionSec != null ? ` @ ${out.bookmark.positionSec}s` : "";
    const result = persistToMemoryKnowledgeChronicleV0({
      entity: out.entity,
      action: "bookmark",
      castleId,
      memorySummary: `Bookmark ${out.entity.title}: ${out.bookmark.label}${pos}`,
      chronicleTitle: `Bookmark: ${out.entity.title}`,
      chronicleBody: `${out.bookmark.label}${pos}`,
      dedupeKey: `chronicle:media_bm:${out.bookmark.id}`,
      knowledgeQuestion: `Bookmarks for ${out.entity.title}`,
      knowledgeAnswer: `${out.bookmark.label}${pos}`
    });
    dispatchPipelineEventV0(result);
    return Object.freeze({ schema: MEDIA_CIVILIZATION_PIPELINE_SCHEMA_V0, ...result, bookmark: out.bookmark });
  }

  return Object.freeze({ ok: false, reason: "unknown_action" });
}

function dispatchPipelineEventV0(result) {
  if (typeof window === "undefined" || !result) return;
  try {
    window.dispatchEvent(
      new CustomEvent(MEDIA_CIVILIZATION_EVENT_V0, {
        detail: Object.freeze({ result })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {string} entityId
 */
export function readMediaCivilizationEntityV0(entityId) {
  return readCastleArchiveEntityV0(entityId);
}

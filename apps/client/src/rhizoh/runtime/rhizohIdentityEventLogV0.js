/**
 * Identity Event Log — single source of truth for persona state.
 * Transport (WS/HTTP) is carrier tag only; all layers append here.
 */

import { enrichEventWithSemanticsV0 } from "./rhizohSemanticCompressionFilterV0.js";
import {
  commitRuntimeEventToGraphV0,
  RUNTIME_SUBSTRATE_SOURCE_V0
} from "./runtimeEventGraphBridgeV0.js";

export const RHIZOH_IDENTITY_EVENT_LOG_SCHEMA_V0 = "rhizoh.identity_event_log.v0";

const LOG_MAX_V0 = 128;
const COMPRESSED_HISTORY_MAX_V0 = 24;

/** @type {object[]} */
const eventLogV0 = [];
/** @type {object[]} */
const compressedHistoryV0 = [];

/**
 * @param {object} event
 */
export function appendIdentityEventV0(event) {
  const enriched = enrichEventWithSemanticsV0(event);
  const row = Object.freeze({
    id: `iev_${Date.now().toString(36)}_${eventLogV0.length}`,
    atMs: Date.now(),
    type: event.type || "turn_bind",
    intent: event.intent ?? null,
    emotionalTone: event.emotionalTone ?? null,
    activeTask: event.activeTask ?? null,
    turnId: event.turnId ?? null,
    carrier: event.carrier ?? "local",
    presenceKind: event.presenceKind ?? null,
    preview: event.preview ? String(event.preview).slice(0, 120) : null,
    modality: event.modality ?? null,
    semanticWeight: enriched.semanticWeight,
    telemetry: enriched.telemetry,
    identityMeaningful: enriched.identityMeaningful
  });
  eventLogV0.push(row);
  if (eventLogV0.length > LOG_MAX_V0) eventLogV0.shift();
  publishIdentityEventLogV0();
  commitRuntimeEventToGraphV0(RUNTIME_SUBSTRATE_SOURCE_V0.IDENTITY, {
    eventId: row.id,
    eventType: row.type,
    intent: row.intent,
    carrier: row.carrier,
    identityMeaningful: row.identityMeaningful === true
  });
  return row;
}

/**
 * @param {object[]} rows
 */
export function compressIdentityHistoryV0(rows) {
  if (!rows.length) return Object.freeze([]);
  const summary = Object.freeze({
    atMs: Date.now(),
    fromMs: rows[0]?.atMs,
    toMs: rows[rows.length - 1]?.atMs,
    count: rows.length,
    intents: Object.freeze([...new Set(rows.map((r) => r.intent).filter(Boolean))].slice(0, 8)),
    carriers: Object.freeze([...new Set(rows.map((r) => r.carrier).filter(Boolean))]),
    lastTone: rows[rows.length - 1]?.emotionalTone ?? null
  });
  compressedHistoryV0.push(summary);
  if (compressedHistoryV0.length > COMPRESSED_HISTORY_MAX_V0) compressedHistoryV0.shift();
  return summary;
}

export function getIdentityEventLogSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_IDENTITY_EVENT_LOG_SCHEMA_V0,
    count: eventLogV0.length,
    recent: Object.freeze(eventLogV0.slice(-16)),
    compressedHistory: Object.freeze(compressedHistoryV0.slice(-8)),
    ssot: true
  });
}

function publishIdentityEventLogV0() {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.identityEventLog = getIdentityEventLogSnapshotV0();
  }
}

/** @internal vitest */
export function __resetIdentityEventLogForTestV0() {
  eventLogV0.length = 0;
  compressedHistoryV0.length = 0;
}

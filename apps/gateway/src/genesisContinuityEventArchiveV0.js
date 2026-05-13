import fs from "node:fs/promises";
import path from "node:path";
import { genesisContinuityDataDir, genesisContinuityDiskPersistEnabled } from "./genesisContinuityPersistenceV0.js";

const CONTINUITY_EVENTS_LOG = "genesis-continuity-events.jsonl";

/** Read-only query projection over optional JSONL archive (not signed truth; transport audit trail). */
export const GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION = "castle.genesis.continuity_event_archive.query.v0";

export const GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_RANGE_SPAN = 512;
export const GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_RESULTS = 256;
export const GENESIS_CONTINUITY_EVENT_ARCHIVE_DEFAULT_LIMIT = 64;
export const GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_READ_BYTES = 16 * 1024 * 1024;

/** @returns {boolean} */
export function genesisContinuityEventArchiveEnabled() {
  return (
    genesisContinuityDiskPersistEnabled() &&
    String(process.env.CASTLE_GENESIS_EVENT_ARCHIVE || "").trim() === "1"
  );
}

function eventLogPath() {
  return path.join(genesisContinuityDataDir(), CONTINUITY_EVENTS_LOG);
}

/** Serialized append queue — avoids interleaved JSONL lines under concurrent publishes. */
let appendChain = Promise.resolve();

/**
 * @param {Record<string, unknown>} envelope — continuity SSE payload (includes seq, type, …)
 */
export function maybeAppendGenesisContinuityEventArchiveV0(envelope) {
  if (!genesisContinuityEventArchiveEnabled() || !envelope || typeof envelope !== "object") return;
  const line = `${JSON.stringify(envelope)}\n`;
  appendChain = appendChain
    .then(async () => {
      const dir = genesisContinuityDataDir();
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(eventLogPath(), line, "utf8");
    })
    .catch(() => {});
}

/** @public Tests */
export function resetGenesisContinuityEventArchiveForTests() {
  appendChain = Promise.resolve();
}

/** Max events returned for analytics (single JSONL read); abuse guard. */
export const GENESIS_CONTINUITY_ARCHIVE_ANALYTICS_MAX_EVENTS = 4096;

/**
 * Full sorted match list for a seq band (no tail limit). Used by replay analytics / entropy field.
 * @param {number} fromSeq
 * @param {number} toSeq
 * @param {string} [typeFilter]
 */
export async function listGenesisContinuityArchiveEventsInRangeForAnalyticsV0(fromSeq, toSeq, typeFilter) {
  const projection = GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION;
  const inner = await readGenesisContinuityArchiveMatchedEventsV0(fromSeq, toSeq, typeFilter);
  if (!inner.ok) return inner;
  if (inner.events.length > GENESIS_CONTINUITY_ARCHIVE_ANALYTICS_MAX_EVENTS) {
    return {
      ok: false,
      error: "archive_analytics_event_cap",
      maxEvents: GENESIS_CONTINUITY_ARCHIVE_ANALYTICS_MAX_EVENTS,
      projection,
      count: inner.events.length
    };
  }
  return {
    ok: true,
    projection,
    from: inner.from,
    to: inner.to,
    type: inner.type,
    count: inner.events.length,
    events: inner.events
  };
}

/**
 * @returns {Promise<{ ok: true, from: number, to: number, type: string | null, events: Record<string, unknown>[] } | { ok: false, error: string, projection: string, hint?: string, maxSpan?: number, maxBytes?: number }>}
 */
async function readGenesisContinuityArchiveMatchedEventsV0(fromSeq, toSeq, typeFilter) {
  const projection = GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION;
  const flag = String(process.env.CASTLE_GENESIS_DISK_PERSIST ?? "").trim();
  if (flag === "0") {
    return { ok: false, error: "genesis_ephemeral_mode", hint: "CASTLE_GENESIS_DISK_PERSIST_explicitly_0", projection };
  }
  if (!genesisContinuityDiskPersistEnabled()) {
    return {
      ok: false,
      error: "genesis_disk_query_unavailable",
      hint: "set_CASTLE_GENESIS_DISK_PERSIST_1",
      projection
    };
  }
  if (!genesisContinuityEventArchiveEnabled()) {
    return {
      ok: false,
      error: "event_archive_disabled",
      hint: "set_CASTLE_GENESIS_EVENT_ARCHIVE_1_with_disk_persist",
      projection
    };
  }

  const from = Math.floor(Number(fromSeq) || 0);
  const to = Math.floor(Number(toSeq) || 0);
  const tf = String(typeFilter || "").trim();

  if (from <= 0 || to <= 0) return { ok: false, error: "invalid_range", projection };
  if (to < from) return { ok: false, error: "range_inverted", projection };
  if (to - from > GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_RANGE_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_RANGE_SPAN,
      projection
    };
  }

  const p = eventLogPath();
  let st;
  try {
    st = await fs.stat(p);
  } catch {
    return { ok: true, from, to, type: tf || null, events: [] };
  }
  if (st.size > GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_READ_BYTES) {
    return { ok: false, error: "archive_file_too_large", maxBytes: GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_READ_BYTES, projection };
  }

  let raw = "";
  try {
    raw = await fs.readFile(p, "utf8");
  } catch {
    return { ok: true, from, to, type: tf || null, events: [] };
  }

  const lines = String(raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  /** @type {Record<string, unknown>[]} */
  const matched = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const row = JSON.parse(lines[i]);
      if (!row || typeof row !== "object") continue;
      const seq = Math.floor(Number(/** @type {{ seq?: unknown }} */ (row).seq) || 0);
      if (seq < from || seq > to) continue;
      const typ = String(/** @type {{ type?: unknown }} */ (row).type || "");
      if (tf && typ !== tf) continue;
      matched.push(row);
    } catch {
      return { ok: false, error: `archive_parse_error_line_${i + 1}`, projection };
    }
  }

  matched.sort((a, b) => Math.floor(Number(a.seq) || 0) - Math.floor(Number(b.seq) || 0));
  return { ok: true, from, to, type: tf || null, events: matched };
}

export async function queryGenesisContinuityEventArchiveV0(fromSeq, toSeq, typeFilter, limit) {
  const projection = GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION;
  const lim = Math.min(
    GENESIS_CONTINUITY_EVENT_ARCHIVE_MAX_RESULTS,
    Math.max(1, Math.floor(Number(limit) || GENESIS_CONTINUITY_EVENT_ARCHIVE_DEFAULT_LIMIT))
  );

  const inner = await readGenesisContinuityArchiveMatchedEventsV0(fromSeq, toSeq, typeFilter);
  if (!inner.ok) {
    return { ok: false, error: inner.error, hint: inner.hint, projection, maxSpan: inner.maxSpan, maxBytes: inner.maxBytes };
  }
  const { from, to, type: tf, events: matched } = inner;
  const tail = matched.length > lim ? matched.slice(-lim) : matched;

  return {
    ok: true,
    projection,
    from,
    to,
    type: tf || null,
    limit: lim,
    count: tail.length,
    events: tail
  };
}

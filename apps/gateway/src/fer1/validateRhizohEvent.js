/**
 * FER-1 — Gateway runtime schema validation (closure patch §4.1).
 * Manifest: docs/schemas/firebase/rhizoh_event_types.json
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {unknown} */
let _manifestCache = null;

function manifestPath() {
  return join(__dirname, "../../../../docs/schemas/firebase/rhizoh_event_types.json");
}

export function loadRhizohEventManifest() {
  if (_manifestCache) return _manifestCache;
  const p = manifestPath();
  if (!existsSync(p)) {
    throw new Error(`rhizoh_event_types.json missing at ${p}`);
  }
  const raw = readFileSync(p, "utf8");
  _manifestCache = JSON.parse(raw);
  return _manifestCache;
}

/**
 * @param {{ stream: string, doc: Record<string, unknown> }} args
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateRhizohEventEnvelope({ stream, doc }) {
  try {
    const m = loadRhizohEventManifest();
    const sv = doc.schemaVersion;
    if (sv !== m.schemaVersionDefault) {
      return { ok: false, reason: `schema_version_mismatch:expected_${m.schemaVersionDefault}_got_${String(sv)}` };
    }
    const required = ["type", "source", "schemaVersion", "correlationId", "actorUid"];
    for (const k of required) {
      if (!(k in doc)) return { ok: false, reason: `missing_field:${k}` };
    }
    if (String(doc.source) !== "client" && String(doc.source) !== "gateway") {
      return { ok: false, reason: "invalid_source" };
    }
    if (!m.allowedStreams?.includes(stream)) {
      return { ok: false, reason: `invalid_stream:${stream}` };
    }
    const allowed = m.typesByStream?.[stream];
    const t = String(doc.type || "");
    if (!Array.isArray(allowed) || !allowed.includes(t)) {
      return { ok: false, reason: `type_not_allowed_for_stream:${stream}:${t}` };
    }
    if (stream === "observe" && "primaryClaimCount" in doc) {
      const n = doc.primaryClaimCount;
      if (typeof n !== "number" || n < 0 || n > 2) {
        return { ok: false, reason: "primary_claim_count_out_of_range" };
      }
    }
    const companionPayload = validateCompanionPayloadIfNeeded(t, doc);
    if (!companionPayload.ok) return companionPayload;
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `validate_error:${String(e?.message || e)}` };
  }
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} doc
 */
function validateCompanionPayloadIfNeeded(type, doc) {
  if (type !== "companion_message_sent_v1") return { ok: true };
  if (!doc.threadId || typeof doc.threadId !== "string") return { ok: false, reason: "companion_missing_threadId" };
  const role = doc.messageRole;
  if (role !== "user" && role !== "assistant" && role !== "system") {
    return { ok: false, reason: "companion_invalid_messageRole" };
  }
  return { ok: true };
}

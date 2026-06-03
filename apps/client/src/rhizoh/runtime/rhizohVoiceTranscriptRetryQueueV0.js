/**
 * Voice transcript retry queue — gateway offline / accept-deferred payloads.
 * FILTER 3 companion — reconnect flush (text path parity).
 */

export const RHIZOH_VOICE_TRANSCRIPT_RETRY_QUEUE_SCHEMA_V0 =
  "castle.rhizoh.voice_transcript_retry_queue.v0";

const QKEY_V0 = "castle.rhizohVoiceTranscriptRetryQueue.v0";
const MAX_V0 = 12;

/**
 * @param {Record<string, unknown>} record
 */
export function enqueueVoiceTranscriptRetryV0(record) {
  try {
    const raw = window.sessionStorage.getItem(QKEY_V0);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return false;
    arr.push({
      schema: RHIZOH_VOICE_TRANSCRIPT_RETRY_QUEUE_SCHEMA_V0,
      ...record,
      enqueuedAt: Date.now()
    });
    while (arr.length > MAX_V0) arr.shift();
    window.sessionStorage.setItem(QKEY_V0, JSON.stringify(arr));
    publishVoiceTranscriptRetryQueueDebugV0(arr.length);
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {Record<string, unknown>[]}
 */
export function drainVoiceTranscriptRetryQueueV0() {
  try {
    const raw = window.sessionStorage.getItem(QKEY_V0);
    window.sessionStorage.removeItem(QKEY_V0);
    const arr = raw ? JSON.parse(raw) : [];
    publishVoiceTranscriptRetryQueueDebugV0(0);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function peekVoiceTranscriptRetryQueueLengthV0() {
  try {
    const raw = window.sessionStorage.getItem(QKEY_V0);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** @param {number} count */
function publishVoiceTranscriptRetryQueueDebugV0(count) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_RHIZOH_VOICE_TRANSCRIPT_RETRY_Q__ = Object.freeze({
      schema: RHIZOH_VOICE_TRANSCRIPT_RETRY_QUEUE_SCHEMA_V0,
      count,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}

export function __resetVoiceTranscriptRetryQueueForTestV0() {
  try {
    window.sessionStorage.removeItem(QKEY_V0);
  } catch {
    /* noop */
  }
  publishVoiceTranscriptRetryQueueDebugV0(0);
}

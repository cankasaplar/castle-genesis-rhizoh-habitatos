/**
 * STT quarantine buffer — suspicious multilingual/script output held aside (not discarded).
 * Separate channel from execution; replay/debug only.
 */

export const RHIZOH_STT_QUARANTINE_BUFFER_SCHEMA_V0 = "castle.rhizoh.stt_quarantine_buffer.v0";

const QUARANTINE_RING_MAX_V0 = 16;
/** @type {object[]} */
let quarantineRing = [];
let quarantineSeq = 0;

/**
 * @param {{
 *   text?: string,
 *   reasons?: readonly string[],
 *   originHash?: string,
 *   source?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   scriptEntropy?: number,
 *   band?: string
 * }} entry
 */
export function pushSttQuarantineEntryV0(entry = {}) {
  quarantineSeq += 1;
  const row = Object.freeze({
    schema: RHIZOH_STT_QUARANTINE_BUFFER_SCHEMA_V0,
    id: `stq_${quarantineSeq.toString(36)}`,
    atMs: Date.now(),
    text: String(entry.text || "").slice(0, 512),
    preview: String(entry.text || "").slice(0, 96),
    reasons: Object.freeze([...(entry.reasons || [])]),
    originHash: entry.originHash ? String(entry.originHash) : undefined,
    source: entry.source ? String(entry.source) : undefined,
    confidence: Number.isFinite(Number(entry.confidence)) ? Number(entry.confidence) : undefined,
    strategy: entry.strategy ? String(entry.strategy) : undefined,
    maxRms: Number.isFinite(Number(entry.maxRms)) ? Number(entry.maxRms) : undefined,
    scriptEntropy: Number.isFinite(Number(entry.scriptEntropy)) ? Number(entry.scriptEntropy) : undefined,
    band: entry.band ? String(entry.band) : undefined,
    channel: "quarantine"
  });
  quarantineRing = [...quarantineRing.slice(-(QUARANTINE_RING_MAX_V0 - 1)), row];
  if (typeof window !== "undefined") {
    try {
      window.__CASTLE_RHIZOH_STT_QUARANTINE__ = Object.freeze({
        latest: row,
        count: quarantineRing.length,
        tail: Object.freeze(quarantineRing.slice(-5))
      });
    } catch {
      /* noop */
    }
  }
  return row;
}

export function peekSttQuarantineBufferV0(limit = 5) {
  const n = Math.max(1, Math.min(QUARANTINE_RING_MAX_V0, Number(limit) || 5));
  return Object.freeze(quarantineRing.slice(-n));
}

export function __resetSttQuarantineBufferForTestV0() {
  quarantineRing = [];
  quarantineSeq = 0;
}

/**
 * PR-3.4 — Duplicate execution barrier (same `commandHash` must not re-fire actuators).
 * SPECFLOW: **RESEARCH-ONLY**
 */

import { EXECUTION_TEMPORAL_CODE } from "./physicalDriftNamespaceV0.js";

/**
 * @param {number} [maxSize]
 */
export function createDuplicateExecutionBarrierV0(maxSize = 512) {
  const cap = Math.min(4096, Math.max(8, Math.floor(maxSize)));
  /** @type {string[]} */
  const fifo = [];
  /** @type {Map<string, number>} */
  const seen = new Map();

  function evict() {
    while (fifo.length > cap) {
      const h = fifo.shift();
      if (h) seen.delete(h);
    }
  }

  return {
    /**
     * @param {string} commandHash
     * @param {number} atMs
     * @returns {{ ok: true, atMs: number } | { ok: false, code: string }}
     */
    tryCommit(commandHash, atMs) {
      const h = String(commandHash ?? "");
      if (!h) return { ok: false, code: EXECUTION_TEMPORAL_CODE.DUPLICATE_EXECUTION };
      if (seen.has(h)) return { ok: false, code: EXECUTION_TEMPORAL_CODE.DUPLICATE_EXECUTION };
      const t = typeof atMs === "number" && Number.isFinite(atMs) ? atMs : 0;
      seen.set(h, t);
      fifo.push(h);
      evict();
      return { ok: true, atMs: t };
    },
    has(commandHash) {
      return seen.has(String(commandHash ?? ""));
    },
    reset() {
      fifo.length = 0;
      seen.clear();
    }
  };
}

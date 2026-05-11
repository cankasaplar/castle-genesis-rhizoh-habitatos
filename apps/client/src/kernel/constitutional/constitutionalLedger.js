/**
 * Append-only ledger + deterministic hash chain (pure). Replay folds closeConstitution.
 */

import { cloneConstitutionalState } from "./constitutionalState.js";

/**
 * @typedef {{ input: object, meta?: Record<string, unknown> }} LedgerEntry
 * @typedef {{ entries: LedgerEntry[], hashChain: string }} Ledger
 */

export function createEmptyLedger() {
  return Object.freeze({ entries: [], hashChain: "0:genesis" });
}

function mix(h, s) {
  let x = 0;
  for (let i = 0; i < h.length; i++) x = (x * 31 + h.charCodeAt(i)) >>> 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0;
  return `0x${x.toString(16)}`;
}

/**
 * Canonical JSON for stable hashing (shallow: input only).
 * @param {object} input
 */
export function canonicalInputString(input) {
  return JSON.stringify(input, Object.keys(input).sort());
}

/**
 * @param {Ledger} ledger
 * @param {LedgerEntry} entry
 * @returns {Ledger}
 */
export function appendLedgerEntry(ledger, entry) {
  const payload = canonicalInputString(entry.input);
  const hashChain = mix(ledger.hashChain, `${ledger.entries.length}:${payload}`);
  const entries = ledger.entries.concat([entry]);
  return Object.freeze({ entries, hashChain });
}

/** @param {Ledger} ledger */
export function hashLedger(ledger) {
  return ledger.hashChain;
}

/**
 * @template T
 * @param {import('./constitutionalState.js').ConstitutionalState} initialState
 * @param {Ledger} ledger
 * @param {(prev: import('./constitutionalState.js').ConstitutionalState, input: object) => T} closer
 * @returns {{ finalState: import('./constitutionalState.js').ConstitutionalState, trace: T[] }}
 */
export function replayConstitutionFromLedger(initialState, ledger, closer) {
  let s = cloneConstitutionalState(initialState);
  /** @type {T[]} */
  const trace = [];
  for (const e of ledger.entries) {
    const out = closer(s, e.input);
    s = out.state;
    trace.push(out);
  }
  return { finalState: s, trace };
}

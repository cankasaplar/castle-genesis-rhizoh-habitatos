/**
 * PR-3.1 — Execution guard (rule of origin).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Physical-side commands MUST carry: `lane`, `provenance` (with `locked: true`),
 * and `executionHash` matching `computeExecutionCommandHashV0(cmd)`.
 *
 * @returns {false | Readonly<object & { executionValidated: true }>}
 */
import { computeExecutionCommandHashV0 } from "./executionCommandHashV0.js";

/**
 * @param {unknown} cmd
 * @returns {false | Readonly<object & { executionValidated: true }>}
 */
export function validateExecutionCommandV0(cmd) {
  if (!cmd || typeof cmd !== "object") return false;
  const c = /** @type {Record<string, unknown>} */ (cmd);
  const prov = c.provenance;
  if (!prov || typeof prov !== "object") return false;
  const locked = /** @type {{ locked?: unknown }} */ (prov).locked;
  if (locked !== true) return false;
  if (c.lane == null || c.lane === "") return false;
  if (typeof c.executionHash !== "string" || c.executionHash.length < 4) return false;

  const expected = computeExecutionCommandHashV0(c);
  if (expected !== c.executionHash) return false;

  return Object.freeze({
    ...c,
    executionValidated: true
  });
}

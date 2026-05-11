/**
 * RBL-R1 — minimal executable resolution motor (`resolveVClass`).
 * @see docs/RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md
 */

import { DIVERGENCE_CLASS } from "./classifyDivergence.mjs";

/**
 * Closed resolution action surface — civilization-grade policy primitive.
 * @type {Readonly<{
 *   SELECT: string;
 *   PARALLEL: string;
 *   NO_COLLAPSE: string;
 *   REJECT: string;
 *   QUARANTINE: string;
 *   MERGE_RECORD: string;
 *   ARCHIVE: string;
 *   SUNSET: string;
 * }>}
 */
export const RESOLUTION_ACTION = Object.freeze({
  SELECT: "RBL_RES_SELECT",
  PARALLEL: "RBL_RES_PARALLEL",
  NO_COLLAPSE: "RBL_RES_NO_COLLAPSE",
  REJECT: "RBL_RES_REJECT",
  QUARANTINE: "RBL_RES_QUARANTINE",
  MERGE_RECORD: "RBL_RES_MERGE_RECORD",
  ARCHIVE: "RBL_RES_ARCHIVE",
  SUNSET: "RBL_RES_SUNSET"
});

/** Default R1 table — deterministic; replace via `policyTable` option. */
export const DEFAULT_RESOLUTION_TABLE = Object.freeze({
  [DIVERGENCE_CLASS.W_INDEPENDENT]: RESOLUTION_ACTION.PARALLEL,
  [DIVERGENCE_CLASS.W_EXCLUSIVE]: RESOLUTION_ACTION.NO_COLLAPSE,
  [DIVERGENCE_CLASS.W_VOID]: RESOLUTION_ACTION.REJECT,
  [DIVERGENCE_CLASS.PI_SPLIT_NON_BREAKING]: RESOLUTION_ACTION.SELECT,
  [DIVERGENCE_CLASS.PI_SPLIT_BREAKING]: RESOLUTION_ACTION.QUARANTINE,
  [DIVERGENCE_CLASS.PI_SPLIT_INCOMPARABLE]: RESOLUTION_ACTION.REJECT,
  [DIVERGENCE_CLASS.EPOCH_FORK]: RESOLUTION_ACTION.SUNSET,
  [DIVERGENCE_CLASS.NONE]: RESOLUTION_ACTION.SELECT,
  [DIVERGENCE_CLASS.UNKNOWN]: RESOLUTION_ACTION.REJECT
});

/**
 * @param {string} divergenceClass — must be a `DIVERGENCE_CLASS` value
 * @param {{
 *   policyId?: string;
 *   policyTable?: Record<string, string>;
 *   notes?: string;
 * } | undefined} options
 * @returns {{ action: string; resolutionWitness: Record<string, unknown> }}
 */
export function resolveVClass(divergenceClass, options) {
  const opts = options && typeof options === "object" ? options : {};
  const table =
    opts.policyTable && typeof opts.policyTable === "object"
      ? opts.policyTable
      : DEFAULT_RESOLUTION_TABLE;
  const policyId =
    typeof opts.policyId === "string" ? opts.policyId : "RBL_R1_DEFAULT_V0_1";
  const action = table[divergenceClass] ?? RESOLUTION_ACTION.REJECT;

  return {
    action,
    resolutionWitness: {
      policyId,
      divergenceClass,
      action,
      ...(typeof opts.notes === "string" ? { notes: opts.notes } : {})
    }
  };
}

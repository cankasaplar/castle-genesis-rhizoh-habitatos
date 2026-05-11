/**
 * ANF Phase 2.5 — canonical tuple + opId commitment.
 * Tuple: ⟨π, σ, ι, γ, μ⟩ → stable JSON → sha256 hex (same pipeline as `H_canon`).
 *
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md (ANF guard)
 */

import * as crypto from "node:crypto";
import { stableStringifyForDeterminism } from "./evaluateBind.mjs";

/** Algebra / binding spec tag (frozen for Phase 2.5). */
export const ANF_SPEC_TAG = "ANF_PHASE25";

/**
 * @param {{ kind?: string, anfBinding?: string | number }} edge — `anfBinding` unique per edge when order may permute (multiset traces).
 * @param {number} edgeIndex multiset disambiguation when `anfBinding` omitted
 * @param {{ manifestVersion?: string } | null | undefined} manifest
 * @param {{ clockId?: string } | null | undefined} clock
 * @returns {{ pi: string, sigma: string, iota: string | number, gamma: string | null, mu: string | null }}
 */
export function anfReduce(edge, edgeIndex, manifest, clock) {
  return {
    pi: ANF_SPEC_TAG,
    sigma: edge.kind ?? "",
    iota: edge.anfBinding ?? edgeIndex,
    gamma: clock?.clockId ?? null,
    mu: manifest?.manifestVersion ?? null
  };
}

/**
 * @param {unknown} data
 * @returns {string} 64-char lowercase hex
 */
export function anfHash(data) {
  return crypto
    .createHash("sha256")
    .update(stableStringifyForDeterminism(data), "utf8")
    .digest("hex");
}

/**
 * Expected `edge.opId` for EBVM-K / MK-1 ANF gate.
 * @param {{ kind?: string, anfBinding?: string | number }} edge
 * @param {number} edgeIndex
 * @param {unknown} manifest
 * @param {unknown} clock
 * @returns {string}
 */
export function anfExpectedOpId(edge, edgeIndex, manifest, clock) {
  const m = /** @type {{ manifestVersion?: string }} */ (manifest);
  const c = /** @type {{ clockId?: string }} */ (clock);
  return anfHash(anfReduce(edge, edgeIndex, m, c));
}

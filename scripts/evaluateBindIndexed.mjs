/**
 * Sovereign πEFC entrypoint — Phase 2.5 + PAG-1 bundle gate.
 * Decision = evaluateBindIndexed(τ, π_authority, epoch_ctx, clock_ctx, manifest [, compatibilityMatrix [, authorityBundle]])
 *
 * When `authorityBundle` is provided: **Authority → Projection → Epoch** gates run **before** full πEFC
 * (`isAuthorityBundleShape` · `bundle.piHash === π_authority` · `bundle.epochId === epoch_ctx.id|authorityEpochId`).
 *
 * `mk1Validate` remains the structural + πEFC primitive; this module is the named sovereign surface.
 *
 * @see docs/PI_INDEXED_EVALUATION_CONTRACT_V1.md
 * @see docs/PI_EFC_RUNTIME_FORMAL_SPEC_V1.md §0.4
 * @see docs/PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md §4
 */

import { mk1Validate, DECISION_CLASS } from "./mk1Validate.mjs";
import {
  isAuthorityBundleShape,
  PAG_ERR,
  validateAuthorityRblClosure
} from "./authorityBundle.mjs";

/**
 * @param {Record<string, unknown> | undefined} epochContext
 * @returns {string | undefined}
 */
function epochScopeFromContext(epochContext) {
  if (!epochContext || typeof epochContext !== "object") {
    return undefined;
  }
  const id = epochContext.id ?? epochContext.authorityEpochId;
  return typeof id === "string" ? id : undefined;
}

/**
 * Structural MK-1 only (no πEFC), wrapped as πEFC outcome + PAG `piEfcCode`.
 * @param {object} trace
 * @param {object} manifest
 * @param {object} clockContext
 * @param {string} code
 */
function pagPreOutcome(trace, manifest, clockContext, code) {
  const structural = mk1Validate(trace, { manifest, clock: clockContext });
  return {
    mk1: structural,
    compatibility: "UNDEFINED",
    decisionClass: DECISION_CLASS.REJECT_UNDEFINED_POLICY,
    piEfcCode: code
  };
}

/**
 * @param {object} trace τ
 * @param {string | undefined} piAuthority
 * @param {Record<string, unknown> | undefined} epochContext
 * @param {object} clockContext GDK clock
 * @param {object} manifest EMCS manifest
 * @param {(i: string, j: string) => string} [compatibilityMatrix]
 * @param {import("./authorityBundle.mjs").ProjectionAuthorityBundle | undefined} [authorityBundle]
 * @returns {ReturnType<typeof mk1Validate>}
 */
export function evaluateBindIndexed(
  trace,
  piAuthority,
  epochContext,
  clockContext,
  manifest,
  compatibilityMatrix,
  authorityBundle
) {
  if (authorityBundle !== undefined && authorityBundle !== null) {
    if (!isAuthorityBundleShape(authorityBundle)) {
      return pagPreOutcome(
        trace,
        manifest,
        clockContext,
        PAG_ERR.INVALID_BUNDLE
      );
    }
    const b = authorityBundle;
    if (typeof piAuthority !== "string" || piAuthority !== b.piHash) {
      return pagPreOutcome(
        trace,
        manifest,
        clockContext,
        PAG_ERR.PIHASH_SCOPE_MISMATCH
      );
    }
    const epochScoped = epochScopeFromContext(epochContext);
    if (epochScoped !== b.epochId) {
      return pagPreOutcome(
        trace,
        manifest,
        clockContext,
        PAG_ERR.EPOCH_SCOPE_MISMATCH
      );
    }
    const rblErr = validateAuthorityRblClosure(b, { manifest, epochContext });
    if (rblErr) {
      return pagPreOutcome(trace, manifest, clockContext, rblErr);
    }
  }

  return mk1Validate(trace, {
    manifest,
    clock: clockContext,
    piAuthority,
    epochContext,
    compatibilityMatrix
  });
}

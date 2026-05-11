/**
 * PAG-1 — ProjectionAuthorityBundle runtime contract.
 * RBL-G1 / RBL-A1 — canonical closure fields + drift hash (PAG_BUNDLE_0_2).
 *
 * @see docs/PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md §4
 * @see docs/RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md
 * @see docs/RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md
 */

import { H_canon } from "./mk1Validate.mjs";

/** Legacy sealed bundles (council + compat refs). */
export const AUTHORITY_BUNDLE_VERSION = "PAG_BUNDLE_0_1";

/** Canonical RBL closure shape (GCS + resolution policy + lifecycle + witness + bundleHash). */
export const AUTHORITY_BUNDLE_CANONICAL_VERSION = "PAG_BUNDLE_0_2";

/**
 * PAG authority gate — closed prefix for `evaluateBindIndexed` pre-πEFC failures.
 * @see docs/PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md
 */
export const PAG_ERR = Object.freeze({
  INVALID_BUNDLE: "PAG_ERR_INVALID_BUNDLE",
  PIHASH_SCOPE_MISMATCH: "PAG_ERR_PIHASH_SCOPE_MISMATCH",
  EPOCH_SCOPE_MISMATCH: "PAG_ERR_EPOCH_SCOPE_MISMATCH"
});

/**
 * RBL-A1 authority drift / scope closure — evaluated after structural PAG gates.
 * @see docs/RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md
 */
export const RBL_A_ERR = Object.freeze({
  GCS_SCOPE_MISMATCH: "RBL_A_ERR_GCS_SCOPE_MISMATCH",
  POLICY_SCOPE_MISMATCH: "RBL_A_ERR_POLICY_SCOPE_MISMATCH",
  LIFECYCLE_INVALID: "RBL_A_ERR_LIFECYCLE_INVALID",
  AUTHORITY_DRIFT: "RBL_A_ERR_AUTHORITY_DRIFT"
});

/** Closed lifecycle labels for canonical bundles (RBL-A1). */
export const LIFECYCLE_STATE = Object.freeze({
  ANNOUNCE: "LIFECYCLE_ANNOUNCE",
  DUAL_READ: "LIFECYCLE_DUAL_READ",
  ACTIVE: "LIFECYCLE_ACTIVE",
  FROZEN: "LIFECYCLE_FROZEN",
  SUNSET: "LIFECYCLE_SUNSET"
});

const _hex64 = /^[0-9a-f]{64}$/;
const _lifecycleValues = new Set(Object.values(LIFECYCLE_STATE));

/**
 * @typedef {typeof LIFECYCLE_STATE[keyof typeof LIFECYCLE_STATE]} LifecycleState
 */

/**
 * @typedef {{
 *   _version?: string;
 *   piHash: string;
 *   epochId: string;
 *   councilWitness: unknown;
 *   dissentWitnesses: unknown[];
 *   compatMatrixRef: string;
 *   dualReadWindow: unknown;
 *   sunsetRule: unknown;
 *   guardianSeal?: unknown;
 *   governanceConstraintSetId?: string;
 *   governanceConstraintHash?: string;
 *   resolutionPolicyRef?: string;
 *   resolutionPolicyEpoch?: string;
 *   lifecycleState?: LifecycleState;
 *   authorityWitness?: unknown;
 *   bundleHash?: string;
 * }} ProjectionAuthorityBundle
 */

/**
 * Payload hashed for `bundleHash` (excludes `bundleHash`, `_version`, legacy-only keys).
 * @param {Pick<ProjectionAuthorityBundle, "piHash"|"epochId"|"governanceConstraintSetId"|"governanceConstraintHash"|"resolutionPolicyRef"|"resolutionPolicyEpoch"|"lifecycleState"|"authorityWitness">} fields
 */
export function authorityBundleContentForHash(fields) {
  return {
    piHash: fields.piHash,
    epochId: fields.epochId,
    governanceConstraintSetId: fields.governanceConstraintSetId,
    governanceConstraintHash: fields.governanceConstraintHash,
    resolutionPolicyRef: fields.resolutionPolicyRef,
    resolutionPolicyEpoch: fields.resolutionPolicyEpoch,
    lifecycleState: fields.lifecycleState,
    authorityWitness: fields.authorityWitness
  };
}

/**
 * @param {Omit<ProjectionAuthorityBundle, "bundleHash"|"_version"> & {
 *   governanceConstraintSetId: string;
 *   governanceConstraintHash: string;
 *   resolutionPolicyRef: string;
 *   resolutionPolicyEpoch: string;
 *   lifecycleState: LifecycleState;
 *   authorityWitness: Record<string, unknown>;
 * }} fields
 * @returns {ProjectionAuthorityBundle}
 */
export function sealCanonicalAuthorityBundle(fields) {
  const content = authorityBundleContentForHash(fields);
  const bundleHash = H_canon(content);
  return {
    _version: AUTHORITY_BUNDLE_CANONICAL_VERSION,
    ...fields,
    bundleHash
  };
}

/**
 * True when bundle carries RBL canonical closure (GCS id present).
 * @param {unknown} b
 */
export function isCanonicalAuthorityBundle(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) {
    return false;
  }
  const id = /** @type {Record<string, unknown>} */ (b).governanceConstraintSetId;
  return typeof id === "string" && id.length > 0;
}

/**
 * Structural check for **canonical** PAG_BUNDLE_0_2 shape (does not verify witnesses crypto).
 * @param {unknown} b
 * @returns {boolean}
 */
export function isCanonicalAuthorityBundleShape(b) {
  if (!isCanonicalAuthorityBundle(b)) {
    return false;
  }
  const o = /** @type {Record<string, unknown>} */ (b);
  if (typeof o.piHash !== "string" || !_hex64.test(o.piHash)) {
    return false;
  }
  if (typeof o.epochId !== "string" || o.epochId.length === 0) {
    return false;
  }
  if (typeof o.governanceConstraintHash !== "string" || !_hex64.test(o.governanceConstraintHash)) {
    return false;
  }
  if (typeof o.resolutionPolicyRef !== "string" || o.resolutionPolicyRef.length === 0) {
    return false;
  }
  if (typeof o.resolutionPolicyEpoch !== "string" || o.resolutionPolicyEpoch.length === 0) {
    return false;
  }
  if (typeof o.lifecycleState !== "string" || o.lifecycleState.length === 0) {
    return false;
  }
  if (!o.authorityWitness || typeof o.authorityWitness !== "object" || Array.isArray(o.authorityWitness)) {
    return false;
  }
  if (typeof o.bundleHash !== "string" || !_hex64.test(o.bundleHash)) {
    return false;
  }
  return true;
}

/**
 * Legacy PAG_BUNDLE_0_1 shape (council + compat matrix refs).
 * @param {unknown} b
 */
function isLegacyAuthorityBundleShape(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) {
    return false;
  }
  const o = /** @type {Record<string, unknown>} */ (b);
  if (typeof o.piHash !== "string" || !_hex64.test(o.piHash)) {
    return false;
  }
  if (typeof o.epochId !== "string" || o.epochId.length === 0) {
    return false;
  }
  if (!("councilWitness" in o)) {
    return false;
  }
  if (!Array.isArray(o.dissentWitnesses)) {
    return false;
  }
  if (typeof o.compatMatrixRef !== "string" || o.compatMatrixRef.length === 0) {
    return false;
  }
  if (!("dualReadWindow" in o)) {
    return false;
  }
  if (!("sunsetRule" in o)) {
    return false;
  }
  return true;
}

/**
 * Minimal shape check — legacy **or** canonical RBL closure.
 * Does not cryptographically verify witnesses.
 * @param {unknown} b
 * @returns {b is ProjectionAuthorityBundle}
 */
export function isAuthorityBundleShape(b) {
  if (isCanonicalAuthorityBundle(b)) {
    return isCanonicalAuthorityBundleShape(b);
  }
  return isLegacyAuthorityBundleShape(b);
}

/**
 * RBL-A1 closure after π / epoch alignment: GCS & policy scope, lifecycle, content hash.
 * @param {ProjectionAuthorityBundle} bundle
 * @param {{ manifest?: Record<string, unknown>; epochContext?: Record<string, unknown> }} ctx
 * @returns {typeof RBL_A_ERR[keyof typeof RBL_A_ERR] | null} error code or null if ok / skipped
 */
export function validateAuthorityRblClosure(bundle, ctx) {
  if (!isCanonicalAuthorityBundle(bundle)) {
    return null;
  }
  const manifest = ctx.manifest && typeof ctx.manifest === "object" ? ctx.manifest : {};
  const epochContext =
    ctx.epochContext && typeof ctx.epochContext === "object" ? ctx.epochContext : {};

  const mGcs = manifest.governanceConstraintSetId;
  if (typeof mGcs === "string" && mGcs !== bundle.governanceConstraintSetId) {
    return RBL_A_ERR.GCS_SCOPE_MISMATCH;
  }
  const eGcs = epochContext.governanceConstraintSetId;
  if (typeof eGcs === "string" && eGcs !== bundle.governanceConstraintSetId) {
    return RBL_A_ERR.GCS_SCOPE_MISMATCH;
  }

  const mPol = manifest.resolutionPolicyRef;
  if (typeof mPol === "string" && mPol !== bundle.resolutionPolicyRef) {
    return RBL_A_ERR.POLICY_SCOPE_MISMATCH;
  }

  if (bundle.resolutionPolicyEpoch !== bundle.epochId) {
    return RBL_A_ERR.POLICY_SCOPE_MISMATCH;
  }

  if (!_lifecycleValues.has(/** @type {string} */ (bundle.lifecycleState))) {
    return RBL_A_ERR.LIFECYCLE_INVALID;
  }

  const expectedHash = H_canon(
    authorityBundleContentForHash({
      piHash: bundle.piHash,
      epochId: bundle.epochId,
      governanceConstraintSetId: bundle.governanceConstraintSetId,
      governanceConstraintHash: bundle.governanceConstraintHash,
      resolutionPolicyRef: bundle.resolutionPolicyRef,
      resolutionPolicyEpoch: bundle.resolutionPolicyEpoch,
      lifecycleState: bundle.lifecycleState,
      authorityWitness: bundle.authorityWitness
    })
  );
  if (expectedHash !== bundle.bundleHash) {
    return RBL_A_ERR.AUTHORITY_DRIFT;
  }

  return null;
}

/**
 * @param {Omit<ProjectionAuthorityBundle, "_version">} fields
 * @returns {ProjectionAuthorityBundle}
 */
export function sealAuthorityBundle(fields) {
  return {
    _version: AUTHORITY_BUNDLE_VERSION,
    ...fields
  };
}

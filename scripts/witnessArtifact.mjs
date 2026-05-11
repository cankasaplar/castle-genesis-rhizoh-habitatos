/**
 * RBL-1 — Witness artifact primitive: seal + append-only ledger helper.
 * Kernel konuşmaz ham sinyalle; yalnız kamusal witness artefaktı ile (payloadHash, seal).
 *
 * @see docs/RBL_1_REALITY_BRIDGE_LAYER_V1.md
 * @see docs/RBL_TAU_BINDING_LAYER_V1.md (τ binding)
 * @see docs/RBL_TAU_LINEAGE_LAYER_V1.md (witness lineage)
 */

import { H_canon } from "./mk1Validate.mjs";

export const RBL_ARTIFACT_VERSION = "RBL_ARTIFACT_0_1";

/**
 * Input taxonomy tags — hepsi aynı witness contract’a girer.
 * @see docs/RBL_1_REALITY_BRIDGE_LAYER_V1.md §1
 */
export const SOURCE_CLASS = Object.freeze({
  SENSOR_SIGNAL: "RBL_SOURCE_SENSOR_SIGNAL",
  IOT: "RBL_SOURCE_IOT",
  TELEMETRY: "RBL_SOURCE_TELEMETRY",
  METRIC_STREAM: "RBL_SOURCE_METRIC_STREAM",
  HUMAN_ASSERTION: "RBL_SOURCE_HUMAN_ASSERTION",
  HUMAN_TESTIMONY: "RBL_SOURCE_HUMAN_TESTIMONY",
  HUMAN_DECLARATION: "RBL_SOURCE_HUMAN_DECLARATION",
  EXTERNAL_API: "RBL_SOURCE_EXTERNAL_API",
  ORACLE_FEED: "RBL_SOURCE_ORACLE_FEED",
  MODEL_OUTPUT: "RBL_SOURCE_MODEL_OUTPUT",
  AGENT_ACTION: "RBL_SOURCE_AGENT_ACTION",
  SIMULATION_OUTPUT: "RBL_SOURCE_SIMULATION_OUTPUT"
});

export const RBL_ERR = Object.freeze({
  WITNESSLESS: "RBL_ERR_WITNESSLESS",
  INVALID_CONTEXT: "RBL_ERR_INVALID_CONTEXT",
  APPEND_SEAL_FAIL: "RBL_ERR_APPEND_SEAL_FAIL",
  INVALID_LEDGER: "RBL_ERR_INVALID_LEDGER"
});

const _hex64 = /^[0-9a-f]{64}$/;

/**
 * @typedef {{
 *   _version: string;
 *   artifactHash: string;
 *   sourceClass: string;
 *   payloadHash: string;
 *   witnessSet: string[];
 *   observedAt: string;
 *   projectionEpochId: string;
 *   piHash: string;
 *   normalizationSpec?: string;
 *   sourceScope?: string;
 *   uncertaintyVector?: unknown;
 *   parentArtifact?: string;
 * }} WitnessArtifact
 */

/**
 * @param {unknown} context
 * @returns {context is { sourceClass: string, projectionEpochId: string, piHash: string, observedAt: string }}
 */
function isWitnessContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return false;
  }
  const o = /** @type {Record<string, unknown>} */ (context);
  return (
    typeof o.sourceClass === "string" &&
    o.sourceClass.length > 0 &&
    typeof o.projectionEpochId === "string" &&
    o.projectionEpochId.length > 0 &&
    typeof o.piHash === "string" &&
    _hex64.test(o.piHash) &&
    typeof o.observedAt === "string" &&
    o.observedAt.length > 0
  );
}

/**
 * Deterministic witness set: non-empty unique strings, sorted.
 * @param {unknown} witnesses
 * @returns {string[] | null}
 */
function normalizeWitnessSet(witnesses) {
  if (!Array.isArray(witnesses) || witnesses.length === 0) {
    return null;
  }
  const set = new Set();
  for (const w of witnesses) {
    if (typeof w !== "string" || w.length === 0) {
      return null;
    }
    set.add(w);
  }
  return [...set].sort();
}

/**
 * @param {unknown} signal Canonicalized serializable domain object; **payload kapalı — yalnız hash zincire girer** (RBL-I1).
 * @param {{
 *   sourceClass: string;
 *   projectionEpochId: string;
 *   piHash: string;
 *   observedAt: string;
 *   normalizationSpec?: string;
 *   sourceScope?: string;
 *   uncertaintyVector?: unknown;
 *   parentArtifact?: string;
 * }} context Epoch / clock / kaynak kapsamı bağlamı.
 * @param {string[]} witnesses Kamusal tanık kimlikleri (RBL-I2).
 * @returns {{ ok: true, artifact: WitnessArtifact } | { ok: false, code: string }}
 */
export function sealWitnessArtifact(signal, context, witnesses) {
  if (!isWitnessContext(context)) {
    return { ok: false, code: RBL_ERR.INVALID_CONTEXT };
  }
  const witnessSet = normalizeWitnessSet(witnesses);
  if (!witnessSet) {
    return { ok: false, code: RBL_ERR.WITNESSLESS };
  }

  const ctx = /** @type {Record<string, unknown>} */ (context);
  const parentArtifact = ctx.parentArtifact;
  if (parentArtifact !== undefined && parentArtifact !== null) {
    if (typeof parentArtifact !== "string" || !_hex64.test(parentArtifact)) {
      return { ok: false, code: RBL_ERR.INVALID_CONTEXT };
    }
  }

  const payloadHash = H_canon(signal);

  /** @type {Record<string, unknown>} */
  const body = {
    _version: RBL_ARTIFACT_VERSION,
    sourceClass: context.sourceClass,
    payloadHash,
    witnessSet,
    observedAt: context.observedAt,
    projectionEpochId: context.projectionEpochId,
    piHash: context.piHash
  };

  if (typeof ctx.normalizationSpec === "string" && ctx.normalizationSpec.length > 0) {
    body.normalizationSpec = ctx.normalizationSpec;
  }
  if (typeof ctx.sourceScope === "string" && ctx.sourceScope.length > 0) {
    body.sourceScope = ctx.sourceScope;
  }
  if ("uncertaintyVector" in ctx && ctx.uncertaintyVector !== undefined) {
    body.uncertaintyVector = ctx.uncertaintyVector;
  }
  if (parentArtifact !== undefined && parentArtifact !== null) {
    body.parentArtifact = parentArtifact;
  }

  const artifactHash = H_canon(body);
  const artifact = /** @type {WitnessArtifact} */ ({
    ...body,
    artifactHash
  });

  return { ok: true, artifact };
}

/**
 * @param {unknown} a
 * @returns {a is WitnessArtifact}
 */
export function isWitnessArtifactShape(a) {
  if (!a || typeof a !== "object" || Array.isArray(a)) {
    return false;
  }
  const o = /** @type {Record<string, unknown>} */ (a);
  if (typeof o.artifactHash !== "string" || !_hex64.test(o.artifactHash)) {
    return false;
  }
  if (typeof o.sourceClass !== "string" || o.sourceClass.length === 0) {
    return false;
  }
  if (typeof o.payloadHash !== "string" || !_hex64.test(o.payloadHash)) {
    return false;
  }
  if (!Array.isArray(o.witnessSet) || o.witnessSet.length === 0) {
    return false;
  }
  if (!o.witnessSet.every((w) => typeof w === "string" && w.length > 0)) {
    return false;
  }
  if (typeof o.observedAt !== "string" || o.observedAt.length === 0) {
    return false;
  }
  if (typeof o.projectionEpochId !== "string" || o.projectionEpochId.length === 0) {
    return false;
  }
  if (typeof o.piHash !== "string" || !_hex64.test(o.piHash)) {
    return false;
  }
  if (o.parentArtifact !== undefined && o.parentArtifact !== null) {
    if (typeof o.parentArtifact !== "string" || !_hex64.test(o.parentArtifact)) {
      return false;
    }
  }
  return true;
}

/**
 * RBL-I4: mühür `artifactHash === H_canon(body)` (artifactHash hariç gövde).
 * @param {unknown} artifact
 * @returns {boolean}
 */
export function verifyArtifactSeal(artifact) {
  if (!isWitnessArtifactShape(artifact)) {
    return false;
  }
  const { artifactHash, ...body } = /** @type {WitnessArtifact} */ (artifact);
  return H_canon(body) === artifactHash;
}

/**
 * Append-only: yeni ledger kopyası; mühür geçersizse reddeder (RBL-I7 ile uyumlu çoklu append).
 * @param {unknown} ledger
 * @param {unknown} artifact
 * @returns {{ ok: true, ledger: WitnessArtifact[] } | { ok: false, code: string }}
 */
export function appendWitnessArtifact(ledger, artifact) {
  if (!Array.isArray(ledger)) {
    return { ok: false, code: RBL_ERR.INVALID_LEDGER };
  }
  if (!verifyArtifactSeal(artifact)) {
    return { ok: false, code: RBL_ERR.APPEND_SEAL_FAIL };
  }
  const a = /** @type {WitnessArtifact} */ (artifact);
  return { ok: true, ledger: [...ledger, a] };
}

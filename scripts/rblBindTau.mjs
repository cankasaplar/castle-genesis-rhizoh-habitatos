/**
 * RBL-τ — Bind / Unbind primitives (RTB-B1 implementation).
 * @see docs/RBL_TAU_BINDING_LAYER_V1.md
 * @see docs/RBL_TAU_LINEAGE_LAYER_V1.md (witness + epoch + π signature chain)
 */

import { H_canon } from "./mk1Validate.mjs";
import { projectPi } from "./projectPi.mjs";
import { verifyArtifactSeal } from "./witnessArtifact.mjs";

/** Must match spec / docs when binding rules change. */
export const RBL_TAU_BINDING_VERSION = "RBL_TAU_BINDING_0_2";

const _hex64 = /^[0-9a-f]{64}$/;

export const RTB_ERR = Object.freeze({
  INVALID_ARTIFACT: "RTB_ERR_INVALID_ARTIFACT",
  ARTIFACT_SEAL_FAIL: "RTB_ERR_ARTIFACT_SEAL_FAIL",
  PI_EPOCH_MISMATCH: "RTB_ERR_PI_EPOCH_MISMATCH",
  INVALID_SKELETON: "RTB_ERR_INVALID_SKELETON",
  NO_BINDING: "RTB_ERR_NO_BINDING",
  NO_BINDING_VERSION: "RTB_ERR_NO_BINDING_VERSION",
  BINDING_VERSION_MISMATCH: "RTB_ERR_BINDING_VERSION_MISMATCH",
  INVALID_ROOTS: "RTB_ERR_INVALID_ROOTS"
});

/**
 * Kanonik multiset: lexicographic sıralı unique artifactHash (RTB-I4).
 * @param {string[]} hashes
 * @returns {string[]}
 */
export function canonicalArtifactRootList(hashes) {
  const set = new Set();
  for (const h of hashes) {
    if (typeof h !== "string" || !_hex64.test(h)) {
      throw new Error("RTB: invalid artifact hash in canonicalArtifactRootList");
    }
    set.add(h);
  }
  return [...set].sort();
}

/**
 * @param {unknown[]} artifacts
 * @returns {{ ok: true, roots: string[] } | { ok: false, code: string }}
 */
export function canonicalRootsFromArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    return { ok: false, code: RTB_ERR.INVALID_ARTIFACT };
  }
  /** @type {string[]} */
  const hashes = [];
  for (const a of artifacts) {
    if (!a || typeof a !== "object") {
      return { ok: false, code: RTB_ERR.INVALID_ARTIFACT };
    }
    const h = /** @type {{ artifactHash?: string }} */ (a).artifactHash;
    if (typeof h !== "string" || !_hex64.test(h)) {
      return { ok: false, code: RTB_ERR.INVALID_ARTIFACT };
    }
    hashes.push(h);
  }
  return { ok: true, roots: canonicalArtifactRootList(hashes) };
}

/**
 * rblWitnessCommitment = H_canon(W*) — W* = lexicographic artifactHash sırasıyla
 * { artifactHash, witnessSet (sorted) }[] — @see docs/RBL_TAU_LINEAGE_LAYER_V1.md §1.2
 * @param {unknown[]} artifacts Sealed WitnessArtifact objects
 * @returns {string} 64-char hex
 */
export function witnessCommitmentFromArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error("RTB: witnessCommitmentFromArtifacts requires non-empty artifacts");
  }
  /** @type {{ artifactHash: string; witnessSet: string[] }[]} */
  const pairs = [];
  for (const a of artifacts) {
    if (!a || typeof a !== "object") {
      throw new Error("RTB: invalid artifact");
    }
    const art = /** @type {{ artifactHash?: string; witnessSet?: unknown }} */ (a);
    if (typeof art.artifactHash !== "string" || !_hex64.test(art.artifactHash)) {
      throw new Error("RTB: invalid artifactHash for witness commitment");
    }
    if (!Array.isArray(art.witnessSet) || art.witnessSet.length === 0) {
      throw new Error("RTB: witnessSet required for witness commitment");
    }
    for (const w of art.witnessSet) {
      if (typeof w !== "string" || w.length === 0) {
        throw new Error("RTB: invalid witness id");
      }
    }
    const ws = [...art.witnessSet].sort();
    pairs.push({ artifactHash: art.artifactHash, witnessSet: ws });
  }
  pairs.sort((x, y) => x.artifactHash.localeCompare(y.artifactHash));
  return H_canon(pairs);
}

/**
 * @param {unknown[]} artifacts
 * @param {{
 *   piHash: string;
 *   projectionEpochId: string;
 *   mk1ClockWitness?: object;
 *   manifestVersion: string;
 *   rblEpochLineage?: Record<string, unknown>;
 * }} bindingContext
 * @param {{ nodes?: unknown[]; edges: unknown[] }} traceSkeleton
 * @returns {{ ok: true, trace: Record<string, unknown> } | { ok: false, code: string }}
 */
export function bindTraceFromArtifacts(artifacts, bindingContext, traceSkeleton) {
  if (
    !bindingContext ||
    typeof bindingContext !== "object" ||
    typeof bindingContext.piHash !== "string" ||
    !_hex64.test(bindingContext.piHash) ||
    typeof bindingContext.projectionEpochId !== "string" ||
    bindingContext.projectionEpochId.length === 0 ||
    typeof bindingContext.manifestVersion !== "string"
  ) {
    return { ok: false, code: RTB_ERR.INVALID_SKELETON };
  }
  if (
    !traceSkeleton ||
    typeof traceSkeleton !== "object" ||
    !Array.isArray(traceSkeleton.edges)
  ) {
    return { ok: false, code: RTB_ERR.INVALID_SKELETON };
  }

  for (const a of artifacts) {
    if (!verifyArtifactSeal(a)) {
      return { ok: false, code: RTB_ERR.ARTIFACT_SEAL_FAIL };
    }
    const art = /** @type {{ piHash: string; projectionEpochId: string }} */ (a);
    if (
      art.piHash !== bindingContext.piHash ||
      art.projectionEpochId !== bindingContext.projectionEpochId
    ) {
      return { ok: false, code: RTB_ERR.PI_EPOCH_MISMATCH };
    }
  }

  const rootsResult = canonicalRootsFromArtifacts(artifacts);
  if (!rootsResult.ok) {
    return rootsResult;
  }

  let rblWitnessCommitment;
  try {
    rblWitnessCommitment = witnessCommitmentFromArtifacts(artifacts);
  } catch {
    return { ok: false, code: RTB_ERR.INVALID_ARTIFACT };
  }

  const epochLineage =
    bindingContext.rblEpochLineage != null &&
    typeof bindingContext.rblEpochLineage === "object" &&
    !Array.isArray(bindingContext.rblEpochLineage)
      ? bindingContext.rblEpochLineage
      : { traceEpoch: bindingContext.projectionEpochId };

  const nodes = Array.isArray(traceSkeleton.nodes) ? traceSkeleton.nodes : [];
  const merged = {
    nodes,
    edges: traceSkeleton.edges,
    manifestVersion: bindingContext.manifestVersion,
    piHash: bindingContext.piHash,
    projectionEpochId: bindingContext.projectionEpochId,
    rblArtifactRoots: rootsResult.roots,
    rblWitnessCommitment,
    rblEpochLineage: epochLineage,
    rblTauBindingVersion: RBL_TAU_BINDING_VERSION
  };
  if (bindingContext.mk1ClockWitness != null) {
    merged.mk1ClockWitness = bindingContext.mk1ClockWitness;
  }

  const body = projectPi(merged);
  const finalHash = H_canon(body);
  const trace = { ...body, finalHash };
  return { ok: true, trace };
}

/**
 * Reverse bind: τ → kanonik artifactHash listesi (RTB-I2: sürüm zorunlu).
 * @param {unknown} trace
 * @returns {{ ok: true, artifactRoots: string[], rblTauBindingVersion: string } | { ok: false, code: string }}
 */
export function extractArtifactRootsFromTrace(trace) {
  if (!trace || typeof trace !== "object") {
    return { ok: false, code: RTB_ERR.NO_BINDING };
  }
  const t = /** @type {Record<string, unknown>} */ (trace);
  const ver = t.rblTauBindingVersion;
  if (typeof ver !== "string" || ver.length === 0) {
    return { ok: false, code: RTB_ERR.NO_BINDING_VERSION };
  }
  if (ver !== RBL_TAU_BINDING_VERSION) {
    return { ok: false, code: RTB_ERR.BINDING_VERSION_MISMATCH };
  }
  const roots = t.rblArtifactRoots;
  if (!Array.isArray(roots) || roots.length === 0) {
    return { ok: false, code: RTB_ERR.NO_BINDING };
  }
  try {
    const canon = canonicalArtifactRootList(
      /** @type {string[]} */ (roots)
    );
    return {
      ok: true,
      artifactRoots: canon,
      rblTauBindingVersion: ver
    };
  } catch {
    return { ok: false, code: RTB_ERR.INVALID_ROOTS };
  }
}

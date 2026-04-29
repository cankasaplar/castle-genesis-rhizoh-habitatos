/**
 * (C) Identity Compression Layer v1 — frame + seal + graph → tek doğrulanabilir özet parmak izi.
 */

export const RHIZOH_IDENTITY_COMPRESSION_VERSION = "v1";

const FNV_OFFSET = 2166136261 >>> 0;
const FNV_PRIME = 16777619 >>> 0;

function fnv1aStr(h0, str) {
  let h = h0 >>> 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/**
 * @param {{
 *   inputSnapshotHash?: string | null,
 *   jointClosureRoot?: string | null,
 *   replayChainHash?: string | null,
 *   contractGraphVersion?: string | null,
 *   unifiedClosureFingerprint?: string | null
 * }} parts
 */
export function compressRhizohIdentityV1(parts = {}) {
  const frame = parts.inputSnapshotHash ?? "∅frame";
  const joint = parts.jointClosureRoot ?? "∅joint";
  const replay = parts.replayChainHash ?? "∅replay";
  const gv = parts.contractGraphVersion ?? "v0_graph_skeleton";
  const ucf = parts.unifiedClosureFingerprint ?? "∅ucf";
  const canonical = `${gv}\n${frame}\n${joint}\n${replay}\n${ucf}`;
  const fp = fnv1aStr(FNV_OFFSET, canonical).toString(16).padStart(8, "0");
  return Object.freeze({
    version: RHIZOH_IDENTITY_COMPRESSION_VERSION,
    compositeFingerprint: fp,
    verifiableObjectKind: "compressed_identity_blob_v1",
    components: Object.freeze({
      contractGraphVersion: gv,
      frameAnchor: frame,
      jointClosureRoot: joint,
      replayChainHash: replay,
      unifiedClosureFingerprint: ucf
    })
  });
}

export function getIdentityCompressionLayerSpec() {
  return Object.freeze({
    version: RHIZOH_IDENTITY_COMPRESSION_VERSION,
    merges: Object.freeze(["frame", "seal", "contract_graph", "unified_fingerprint"]),
    note: "single_reference_layer_not_crypto_commitment"
  });
}

/**
 * @param {object} bridgePayload
 * @param {{ frameState?: { meta?: object } | null }} [extras]
 */
export function buildIdentityCompressionLayerSurface(bridgePayload = {}, extras = {}) {
  const meta = extras.frameState?.meta;
  const compressed = compressRhizohIdentityV1({
    inputSnapshotHash: meta?.inputSnapshotHash ?? bridgePayload?.readinessHonestField?.frameTruth,
    jointClosureRoot: meta?.jointSeal?.closureRoot,
    replayChainHash: meta?.replaySeal?.chainHash,
    contractGraphVersion: bridgePayload?.fullClosureContractGraph?.version,
    unifiedClosureFingerprint: meta?.unifiedClosureContract?.closureFingerprint
  });
  return Object.freeze({
    layerId: "C_IDENTITY_COMPRESSION",
    version: RHIZOH_IDENTITY_COMPRESSION_VERSION,
    spec: getIdentityCompressionLayerSpec(),
    compressedIdentity: compressed
  });
}
